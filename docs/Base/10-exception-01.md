---
group:
  title: 【10】异常处理完整体系
  order: 10
order: 1
title: try-except基础异常捕获
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是异常捕获

异常捕获是 Python 中用于处理运行时错误的机制。当程序在执行过程中遇到错误（例如除零、访问不存在的列表索引、打开不存在的文件等），Python 解释器会创建一个异常对象并"抛出"（raise）它。如果这个异常没有被捕获和处理，程序就会立即终止并输出一条 traceback 错误信息。

`try-except` 语句提供了一种结构化的方式，让开发者能够预测程序中可能出错的代码区域，在异常发生时优雅地处理错误，而不是让程序直接崩溃。这在所有实用程序中几乎是必须掌握的技能——无论是网络请求失败、文件读写异常、用户输入格式错误，还是数据库连接超时，都需要通过异常捕获来保障程序的健壮性。

异常捕获机制的核心思想是：**将正常的业务逻辑与错误处理逻辑分离开**。没有异常处理时，我们需要在每个可能出错的函数调用后检查返回值、手动判断错误码，代码会变得臃肿且难以阅读。有了 `try-except`，我们可以先把正常流程写在一个块中，然后把错误处理集中写在另一个块中。

### 1.2 基本语法与最小可用示例

最简单的 `try-except` 语法结构如下：

```
try:
    <可能引发异常的代码>
except:
    <异常发生时的处理代码>
```

下面是一个最小可运行的示例。它试图将用户输入的字符串转换为整数，如果用户输入的不是合法数字，程序不会崩溃，而是打印一条友好的提示信息。

```python
# 最小示例：将用户输入转换为整数，捕获转换失败时的异常
user_input = input("请输入一个数字：")
try:
    number = int(user_input)
    print(f"你输入的数字是 {number}")
except:
    print("输入的不是有效数字，转换失败！")
```

**运行结果说明**：当用户输入 "42" 时，输出 `你输入的数字是 42`；当用户输入 "abc" 时，`int("abc")` 会抛出 `ValueError` 异常，被 `except` 捕获，程序输出 `输入的不是有效数字，转换失败！` 并继续执行，不会崩溃。

从这个最小示例可以看出，`try-except` 改变了程序的控制流：正常情况下，`int()` 返回后继续执行下一行；异常发生时，`try` 块中剩余的代码被跳过，直接跳转到 `except` 块。

---

## 2. 核心内容

### 2.1 try-except 的基本语法与执行流程

完整的 `try-except` 语句可以包含多个 `except` 子句、一个可选的 `else` 子句和一个可选的 `finally` 子句。本节先聚焦最基础的形态——`try` + 单个 `except`。

**语法结构**

```python
try:
    # 被监控的代码块
    # 这里的任何一行都可能抛出异常
except 异常类型 as 异常变量:
    # 异常处理代码
    # 仅当 try 块中抛出了匹配的异常时执行
```

**执行流程的文字说明**

当 Python 解释器执行到 `try` 块时，它会逐行执行其中的代码。整个过程遵循以下规则：

1. 如果 `try` 块中的所有代码都成功执行完毕（没有抛出任何异常），则跳过 `except` 子句，继续执行 `try-except` 之后的代码。
2. 如果在 `try` 块中的任何一行抛出了异常，该行之后的所有代码都不会被执行，解释器立即跳转到 `except` 子句。
3. 如果抛出的异常类型与 `except` 后指定的类型匹配（或是其子类），则执行 `except` 块中的处理代码。
4. 如果抛出的异常不匹配任何 `except` 子句，则该异常会继续向上传播，最终可能会导致程序终止。

以下 demo 通过分步执行来验证上述流程：

```python
# 演示 try-except 的基本执行流程
def demo_basic_flow():
    print("=== 示例 1：try 块中未发生异常 ===")
    try:
        print("  try 块开始")
        result = 10 + 20
        print(f"  计算结果为 {result}")
        print("  try 块结束（无异常）")
    except:
        print("  这个不会执行")
    print("  try-except 之后继续执行")
    print()

    print("=== 示例 2：try 块中发生异常 ===")
    try:
        print("  try 块开始")
        numbers = [1, 2, 3]
        print(f"  列表长度为 {len(numbers)}")
        # 访问不存在的索引，抛出 IndexError
        value = numbers[10]
        print(f"  这行不会被执行")  # 跳过了！
        print("  try 块不会正常结束")  # 跳过了！
    except:
        print("  捕获到异常！异常处理完成")
    print("  程序继续执行，没有崩溃")

demo_basic_flow()
```

**运行结果说明**：
- 示例 1 中，所有代码正常执行，`except` 块被跳过。
- 示例 2 中，当执行到 `numbers[10]` 时抛出 `IndexError`，`try` 块中后续两行被跳过，控制权立即转移到 `except` 块。执行完 `except` 块后，程序继续执行 `try-except` 之后的代码，没有崩溃。

需要注意的是，如果 `except` 块本身中又发生了异常且未被内部处理，该异常会继续向外传播。另外，`except` 块中可以使用 `raise` 重新抛出同一个异常，这在某些场景下很有用（稍后章节会提到）。

### 2.2 单个 except 捕获所有异常——裸 except 的争议与风险

裸 `except:`（不指定任何异常类型）会捕获所有异常，包括 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit` 等不应该被随意捕获的系统级异常。

**语法形式**

```python
try:
    # 某些操作
except:
    # 捕获所有异常
```

**裸 except 的风险演示**

```python
# 演示裸 except 的风险：它连 KeyboardInterrupt 和 SystemExit 也会捕获
import time

def risky_bare_except_demo():
    print("警告：这个 demo 演示裸 except 的潜在风险")
    print("（Ctrl+C 也不会中断下面的循环，因为 KeyboardInterrupt 被捕获了）")
    print()

    try:
        print("开始长时间计算（可以尝试按 Ctrl+C 中断）...")
        counter = 0
        for i in range(10**7):
            counter += i
        print(f"计算完成，结果为 {counter}")
    except:
        # 这将捕获包括 KeyboardInterrupt 在内的所有异常！
        print("捕获到异常（但无法判断是什么异常）")
        # 这里有风险：如果是 KeyboardInterrupt，用户期望程序停止，
        # 但这里却悄悄地吞掉了它

    print("程序继续执行（用户可能以为中断无效）")

# 为了演示安全，只展示代码逻辑，建议不要实际运行 Ctrl+C 测试
print("代码说明：裸 except 会捕获 KeyboardInterrupt、SystemExit 等")
print("如果用户想通过 Ctrl+C 中断程序，程序将不会响应，这不是期望行为")
print()

# 安全的演示：展示裸 except 确实能捕获特殊异常
def safe_demo_bare_except():
    print("=== 安全的裸 except 演示 ===")
    # 模拟一个需要被捕获的异常场景
    data = {"key": "value"}

    try:
        # 访问不存在的键会抛出 KeyError
        result = data["non_existent"]
    except:
        # 裸 except 捕获了 KeyError（这在功能上是没问题的）
        result = None
        print("裸 except 捕获了 KeyError（这里能正常工作）")

    print(f"返回结果: {result}")

safe_demo_bare_except()
```

**运行结果说明**：裸 `except:` 是一种"万能捕网"，它什么异常都能捕获。但问题恰恰在于它的"万能"——它捕获了 `KeyboardInterrupt`（用户按 Ctrl+C 希望终止程序）和 `SystemExit`（`sys.exit()` 调用）等系统级异常，导致程序无法被用户正常中断或退出。因此，除极少数特殊场景外，**不推荐使用裸 `except:`**，而应使用 `except Exception:`。

**关于裸 except 的具体争议点**：

| 争议点 | 说明 |
|-------|------|
| 捕获不该捕获的异常 | 会捕获 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit` |
| 无法区分异常类型 | 所有异常都用同一段逻辑处理，无法差异化响应 |
| 隐藏编程错误 | 像 `AttributeError`、`TypeError` 这样的编码错误也被吞掉，增加调试难度 |
| PEP 8 建议 | PEP 8 明确建议避免使用裸 `except`，推荐使用 `except Exception:` |

### 2.3 `except Exception:` 与裸 `except:` 的区别

这是初学者最容易混淆的一对概念。严格来说，`except:` 和 `except Exception:` 捕获的范围不同，理解它们的区别是写出健壮异常处理代码的前提。

**Python 异常继承体系的关键节点**

Python 中的所有异常都继承自 `BaseException`。它的子类包括：

- `Exception`：所有常规异常的基类（程序应该捕获的异常）
- `SystemExit`：`sys.exit()` 触发，不继承自 `Exception`
- `KeyboardInterrupt`：用户按 Ctrl+C 触发，不继承自 `Exception`
- `GeneratorExit`：生成器关闭时触发，不继承自 `Exception`

```python
# 演示 except Exception: 与裸 except 的区别
def demo_exception_vs_bare():
    result_list = []

    # 场景 1：裸 except 捕获一切
    print("=== 场景 1：裸 except ===")
    try:
        # 手动抛出一个 KeyboardInterrupt（模拟）
        # 实际 KeyboardInterrupt 由解释器在 Ctrl+C 时抛出
        # 这里用一个普通的 Exception 来对比
        raise ValueError("这是一个测试异常")
    except:
        result_list.append("裸 except 捕获到了异常")
    print(f"裸 except 结果: {result_list[-1] if result_list else '无'}")

    # 场景 2：except Exception 也能捕获 ValueError
    print()
    print("=== 场景 2：except Exception ===")
    try:
        raise ValueError("这是一个测试异常")
    except Exception:
        result_list.append("except Exception 捕获到了异常")
    print(f"except Exception 结果: {result_list[-1] if result_list else '无'}")

    # 场景 3：使用 except Exception 无法捕获 KeyboardInterrupt
    print()
    print("=== 场景 3：except Exception 无法捕获 KeyboardInterrupt ===")
    try:
        # 手动模拟抛出 KeyboardInterrupt（它不继承自 Exception）
        raise KeyboardInterrupt("模拟用户中断")
    except Exception:
        print("except Exception 捕获到了 KeyboardInterrupt（这不可能发生！）")
    except KeyboardInterrupt:
        print("except KeyboardInterrupt 捕获到了 KeyboardInterrupt")
        print("注意：如果这里没有 KeyboardInterrupt 子句，异常会向上传播")

demo_exception_vs_bare()
```

**运行结果说明**：

- 裸 `except:` 捕获了 `ValueError`，`except Exception` 也捕获了 `ValueError`。
- `except Exception` 没有捕获 `KeyboardInterrupt`，因为 `KeyboardInterrupt` 不继承自 `Exception`，而是直接继承自 `BaseException`。
- 如果 `except Exception` 和 `except KeyboardInterrupt` 都没有提供，`KeyboardInterrupt` 会继续向上传播。

**核心总结**：

- `except Exception:` 捕获所有"正常"的程序异常（`ValueError`、`TypeError`、`KeyError`、`IOError` 等）。
- 裸 `except:` 额外捕获了 `SystemExit`、`KeyboardInterrupt`、`GeneratorExit`。
- 在 99% 的场景中，应该使用 `except Exception:`。

### 2.4 try 块中发生异常时的代码跳转行为

当 `try` 块中发生异常时，代码的执行路径会发生跳跃式的变化。理解这个跳跃行为是掌握异常处理的基础。

**核心规则**：

1. 异常抛出后，`try` 块中从异常点开始的所有剩余代码都不会执行。
2. 控制权立即转移到匹配的 `except` 子句。
3. `except` 块执行完毕后，控制权转移到 `try-except` 之后的代码（除非 `except` 块中又抛出了异常）。

```python
# 演示异常发生时的代码跳转行为
def demo_jump_behavior():
    print("=== 跳转行为演示 ===")
    print("准备进入 try 块...")
    print()

    try:
        print("第 1 行：try 块开始")
        print("第 2 行：尝试进行一些操作")

        # 模拟读取一个文件列表
        files = ["readme.txt", "config.json", "data.csv"]
        print(f"第 3 行：文件列表长度为 {len(files)}")

        # 访问索引 100——抛出 IndexError
        target_file = files[100]
        print("第 5 行：这行不会执行")  # 跳过了！
        print("第 6 行：这行也不会执行")  # 跳过了！
    except IndexError:
        print("第 7 行：捕获到 IndexError！")
        print("第 8 行：正在处理索引越界错误...")
        target_file = "fallback.txt"
    except:
        print("如果执行到这里，说明不是 IndexError")
        print("但在这个示例中不会执行到这里")

    print()
    print(f"try-except 之后：target_file = {target_file}")
    print("程序正常结束")

demo_jump_behavior()
```

**运行结果说明**：

第 1~3 行正常执行。当执行到 `files[100]` 时抛出 `IndexError`，第 5 行和第 6 行被跳过，直接跳转到 `except IndexError:` 块。`except` 块执行完毕后，继续执行 `try-except` 结构之后的代码。

**关键理解**：异常是"立即生效"的——一旦抛出，当前作用域中异常点之后的所有代码都失效。这种"短路"行为意味着你无法在 `try` 块中定义"在异常后仍需要执行的清理代码"——这种场景需要 `finally` 子句来处理（将在后续笔记中详述）。

```python
# 进一步演示：异常发生后无法恢复执行到 try 块内部
def demo_no_going_back():
    print("=== try 块中的代码不会恢复执行 ===")

    try:
        print("步骤 1：打开数据库连接")
        # 模拟异常
        raise ConnectionError("数据库连接超时")

        # 以下代码永远不会执行
        print("步骤 2：执行查询")  # 不可达
        print("步骤 3：关闭连接")  # 不可达
    except ConnectionError:
        print("处理异常：数据库连接失败，尝试重新连接...")
        # 在这里连接成功后，try 块中未执行的步骤 2 和 3 不会自动恢复

    print("程序仍在继续（但 try 块中跳过的代码不会补执行）")

demo_no_going_back()
```

**运行结果说明**：这个示例清晰地展示了异常抛出的"不可逆转性"。即使 `except` 块成功处理了 `ConnectionError`，`try` 块中跳过的代码也不会被重新执行。如果需要重试，必须在外面用循环包裹整个 `try-except` 结构。

### 2.5 try 块中未发生异常时的流程

当 `try` 块中的代码没有抛出任何异常时，执行流程非常简单直接：`try` 块从头到尾正常执行完毕，然后跳过所有 `except` 子句，继续执行后续代码。

```python
# 演示当 try 块中没有异常时的流程
def demo_no_exception_flow():
    print("=== 无异常时的执行流程 ===")

    items = ["苹果", "香蕉", "橘子"]

    try:
        print("try 块：开始获取列表中的元素")
        for i, item in enumerate(items):
            print(f"  try 块内循环：第 {i + 1} 个元素是 {item}")

        # 正常访问——不越界
        first_item = items[0]
        last_item = items[-1]
        print(f"  try 块内：第一个元素是 {first_item}，最后一个元素是 {last_item}")
        print("try 块：正常执行完毕，未发生异常")
    except IndexError:
        print("except 块：出现了索引越界（但这次不会执行）")
    except Exception:
        print("except 块：其他异常（但这次不会执行）")

    print("try-except 结构执行完毕，程序继续")
    print("最终获取到的第一个元素是", first_item)

demo_no_exception_flow()
```

**运行结果说明**：所有代码都按顺序正常执行。`except` 块中的代码从未被执行。变量 `first_item` 和 `last_item` 的值是稳定的。

**外侧代码的可变性**：需要特别注意的是，变量 `first_item` 和 `last_item` 是在 `try` 块内部定义的。在无异常时，这些变量存在且有效；但如果 `try` 块中发生了异常，这些变量可能不存在（如果定义它们的代码在异常抛出之前已经执行，则存在；否则不存在）。这种"部分赋值"的风险将在 2.11 节中详细讨论。

### 2.6 多个 try-except 嵌套时的异常传播规则

`try-except` 结构可以嵌套使用。当内层 `try` 块抛出的异常没有被内层的 `except` 捕获时，异常会向外层传播，就像异常在一个普通函数调用栈中传播一样。

**嵌套规则的文字说明**：

1. 异常首先尝试在当前 `try` 的 `except` 子句中找到匹配项。
2. 如果当前 `try-except` 无法处理该异常，异常会向外层 `try-except` 传播。
3. 外层 `try-except` 可以捕获内层未处理的异常。
4. 如果所有层级的 `try-except` 都无法处理，程序崩溃。

```python
# 演示 try-except 嵌套时的异常传播
def demo_nested_try_except():
    print("=== 嵌套 try-except 演示 ===")

    # 外层 try
    try:
        print("[外层] try 块开始")

        try:
            print("  [内层] try 块开始")
            # 抛出一个 ValueError
            raise ValueError("内层抛出的 ValueError")
            print("  [内层] 这行不会执行")  # 被跳过
        except IndexError:
            # 只捕获 IndexError，不捕获 ValueError
            print("  [内层] except IndexError")
        except KeyError:
            # 也不捕获 ValueError
            print("  [内层] except KeyError")
        # 注意：这里没有 except ValueError

        # 如果内层异常未被处理，这一行不会执行
        print("  [内层] try-except 之后的代码不会执行")
        # 因为异常在离开内层结构后立即开始向外传播

    except ValueError as error:
        # 外层捕获了内层没有处理的 ValueError
        print(f"[外层] 捕获到内层未处理的异常: {error}")
    except Exception as error:
        print(f"[外层] 捕获到其他异常: {error}")

    print("程序正常结束")

demo_nested_try_except()
```

**运行结果说明**：

1. 内层 `try` 块抛出 `ValueError`。
2. 内层的 `except IndexError` 和 `except KeyError` 都不匹配 `ValueError`。
3. 异常离开内层 `try-except` 结构后立即向外传播，内层 `try-except` 结构之后的代码也被跳过。
4. 外层的 `except ValueError` 成功捕获了这个异常。
5. 整个程序继续正常执行。

**多层嵌套与异常传播的边界情况**

```python
# 更复杂的嵌套场景
def demo_complex_nesting():
    print("=== 复杂嵌套场景演示 ===")
    print()

    # 场景 1：内层自己处理了异常，外层感知不到
    print("--- 场景 1：内层自己处理了异常 ---")
    try:
        try:
            raise RuntimeError("内层错误")
        except RuntimeError:
            print("内层异常被自己捕获了")
        print("内层之后的代码可以执行")
    except Exception:
        print("外层捕获到了异常（但不会执行到这里）")
    print("场景 1 结束")
    print()

    # 场景 2：内层重新抛出了异常（raise），外层可以捕获
    print("--- 场景 2：内层重新抛出异常 ---")
    try:
        try:
            raise ValueError("内层错误")
        except ValueError:
            print("内层捕获到异常，但决定重新抛出")
            raise  # 重新抛出同一个异常
    except ValueError:
        print("外层捕获到了内层重新抛出的异常")
    print("场景 2 结束")
    print()

    # 场景 3：不同异常类型的嵌套传播
    print("--- 场景 3：异常类型转换 ---")
    def parse_data(value):
        """模拟一个解析数据的函数"""
        try:
            # 尝试将输入转换为整数
            return int(value)
        except ValueError:
            # 将 ValueError 转换为更语义化的 RuntimeError
            raise RuntimeError(f"数据解析失败：无法将 '{value}' 转为整数") from None

    outer_data = "not_a_number"
    try:
        result = parse_data(outer_data)
        print(f"解析成功：{result}")
    except RuntimeError as error:
        print(f"业务层捕获：{error}")
    print("场景 3 结束")

demo_complex_nesting()
```

**运行结果说明**：

- **场景 1**：内层 `except RuntimeError` 自己处理了异常，异常不会向外传播，内层后续代码正常执行，外层 `except` 不会触发。
- **场景 2**：内层先用 `except ValueError` 捕获了异常，然后使用不带参数的 `raise` 重新抛出同一个异常，导致异常继续向外传播，被外层 `except ValueError` 捕获。这是"记录日志后重新抛出"模式的典型用法。
- **场景 3**：内层 `except ValueError` 捕获后将原始异常转换成一个新类型的异常（`RuntimeError`）向外抛出，外层捕获到的是转换后的异常。这体现了异常封装的常见模式——将底层异常转换为更高层次的业务异常。

### 2.7 try 块中 return 与异常的关系

当 `try` 块中包含 `return` 语句时，异常处理的行为会与`finally`子句产生有趣的交互。由于本笔记聚焦基础 `try-except`（不含 `finally`），我们首先讨论不包含 `finally` 时的 `return` 行为。

**核心规则**：

在 `try` 块中，如果 `return` 语句之前发生了异常，`return` 语句不会被执行。如果 `return` 语句本身执行了（无异常），则函数正常返回，`except` 块不会被触发。

```python
# 演示 try 块中 return 与异常的关系
def demo_return_in_try():
    print("=== try 块中的 return 行为 ===")

    # 场景 1：try 块中 return 前无异常
    def find_item_normal(items, index):
        """正常返回：不发生异常"""
        try:
            print(f"  尝试获取索引 {index} 的元素")
            result = items[index]
            # 如果执行到这里，说明没有异常
            print(f"  成功获取，准备 return")
            return result
        except IndexError:
            print("  except 块：索引越界")
            return "默认值"

    # 场景 2：try 块中发生异常，return 被跳过
    def find_item_error(items, index):
        """异常返回：发生异常"""
        try:
            print(f"  尝试获取索引 {index} 的元素")
            # 这一行会抛出异常
            result = items[index]
            # 这里的 return 永远不会执行
            return result
        except IndexError:
            print("  except 块：索引越界，返回默认值")
            return "默认值"

    my_list = ["a", "b", "c"]

    print("--- 场景 1：无异常，return 正常执行 ---")
    value1 = find_item_normal(my_list, 1)
    print(f"  函数返回: {value1}")
    print()

    print("--- 场景 2：有异常，return 被跳过，except 中的 return 执行 ---")
    value2 = find_item_error(my_list, 10)
    print(f"  函数返回: {value2}")

demo_return_in_try()
```

**运行结果说明**：

- 场景 1：`my_list[1]` 正常返回 `"b"`，`try` 块中的 `return result` 正常执行，函数立即返回 `"b"`，`except` 块不会被执行。
- 场景 2：`my_list[10]` 抛出 `IndexError`，`try` 块中 `return result` 被跳过，控制权转移到 `except` 块，`except` 块中的 `return "默认值"` 执行，函数返回 `"默认值"`。

**一个容易踩坑的场景：try 块中的 return 与 finally 的关系预告**

虽然本笔记不深入 `finally`，但有一个常见的陷阱值得提前了解：如果 `try` 块中有 `return`，且存在 `finally` 块，则 `finally` 块会在 `return` 之前执行。这个知识点会在后续 `finally` 的笔记中展开，此处仅作为一个警示。

### 2.8 常见内置异常类型速览

Python 提供了丰富的内置异常类型，它们构成了一个继承体系。理解常见的异常类型及其适用场景，有助于写出更精确的异常捕获代码。

**异常继承体系简图**：

```
BaseException
├── SystemExit
├── KeyboardInterrupt
├── GeneratorExit
└── Exception
    ├── ArithmeticError
    │   ├── ZeroDivisionError
    │   └── FloatingPointError
    ├── LookupError
    │   ├── IndexError
    │   └── KeyError
    ├── ValueError
    ├── TypeError
    ├── AttributeError
    ├── ImportError
    │   └── ModuleNotFoundError
    ├── NameError
    ├── FileNotFoundError (OSError的子类)
    ├── IOError (OSError的同义词)
    ├── RuntimeError
    └── StopIteration
```

**常见异常类型表格**：

| 异常类型 | 触发场景 | 典型代码示例 |
|---------|---------|-------------|
| `ValueError` | 操作对象类型正确但值不合适 | `int("abc")` |
| `TypeError` | 操作或函数应用于类型不合适的对象 | `"hello" + 42` |
| `KeyError` | 字典中访问不存在的键 | `{"a": 1}["b"]` |
| `IndexError` | 序列（列表/元组/字符串）访问越界 | `[1,2,3][10]` |
| `ZeroDivisionError` | 除零或取模零 | `10 / 0` |
| `AttributeError` | 访问对象不存在的属性 | `None.name` |
| `ImportError` | import 语句失败 | `import nonexistent_module` |
| `ModuleNotFoundError` | 模块未找到（ImportError的子类） | Python 3.6+ |
| `FileNotFoundError` | 打开不存在的文件 | `open("not_exist.txt")` |
| `NameError` | 使用未定义的变量 | `print(undefined_var)` |
| `StopIteration` | 迭代器没有更多元素 | `next(iter([]))` |
| `RuntimeError` | 不归属其他类别的运行时错误 | 通常用于自定义业务异常 |

```python
# 演示各种常见异常类型
def demo_common_exceptions():
    print("=== 常见异常类型演示 ===\n")

    # 1. ValueError——值错误
    print("--- 1. ValueError ---")
    try:
        # 字符串转整数时格式不正确
        print("  int('abc') 尝试...")
        int("abc")
    except ValueError as error:
        print(f"  ValueError: {error}")
    print()

    # 2. TypeError——类型错误
    print("--- 2. TypeError ---")
    try:
        # 字符串和整数不能被连接
        print("  'hello' + 42 尝试...")
        "hello" + 42
    except TypeError as error:
        print(f"  TypeError: {error}")
    print()

    # 3. KeyError——字典键错误
    print("--- 3. KeyError ---")
    try:
        user_scores = {"Alice": 95, "Bob": 87}
        print("  user_scores['Charlie'] 尝试...")
        score = user_scores["Charlie"]
    except KeyError as error:
        print(f"  KeyError: '{error}' 键不存在")
    print()

    # 4. IndexError——索引错误
    print("--- 4. IndexError ---")
    try:
        fruits = ["苹果", "香蕉", "橘子"]
        print("  fruits[10] 尝试...")
        fruit = fruits[10]
    except IndexError as error:
        print(f"  IndexError: {error}")
    print()

    # 5. ZeroDivisionError——除零错误
    print("--- 5. ZeroDivisionError ---")
    try:
        print("  10 / 0 尝试...")
        result = 10 / 0
    except ZeroDivisionError as error:
        print(f"  ZeroDivisionError: {error}")
    print()

    # 6. AttributeError——属性错误
    print("--- 6. AttributeError ---")
    try:
        none_value = None
        print("  None.length 尝试...")
        length = none_value.length
    except AttributeError as error:
        print(f"  AttributeError: {error}")
    print()

    # 7. ImportError——导入错误
    print("--- 7. ImportError ---")
    try:
        print("  import some_unknown_module 尝试...")
        import some_unknown_module
    except ImportError as error:
        print(f"  ImportError: {error}")
    print()

    # 8. FileNotFoundError——文件未找到
    print("--- 8. FileNotFoundError ---")
    try:
        print("  open('not_exist_file.txt') 尝试...")
        with open("not_exist_file.txt", "r") as file:
            content = file.read()
    except FileNotFoundError as error:
        print(f"  FileNotFoundError: {error}")
    print()

    # 9. NameError——名称错误
    print("--- 9. NameError ---")
    try:
        print("  print(undefined_variable) 尝试...")
        print(undefined_variable)
    except NameError as error:
        print(f"  NameError: {error}")
    print()

    # 10. StopIteration——迭代结束
    print("--- 10. StopIteration ---")
    try:
        empty_iter = iter([])
        print("  next(empty_iter) 尝试...")
        element = next(empty_iter)
    except StopIteration as error:
        print(f"  StopIteration: {error}")

demo_common_exceptions()
```

**运行结果说明**：

每个 `try` 块都精心构造了一个会触发特定异常类型的场景：

- `int("abc")` 抛出 `ValueError`（字符串 "abc" 不是有效的整数格式）。
- `"hello" + 42` 抛出 `TypeError`（不能将字符串和整数直接相加）。
- 访问不存在的字典键抛出 `KeyError`。
- 访问超出列表范围的索引抛出 `IndexError`。
- 数字除以零抛出 `ZeroDivisionError`。
- 在 `None` 上访问不存在的属性抛出 `AttributeError`。
- 导入不存在的模块抛出 `ImportError`。
- 打开不存在的文件抛出 `FileNotFoundError`。
- 使用未定义的变量抛出 `NameError`。
- 在空迭代器上调用 `next()` 抛出 `StopIteration`。

通过将每个异常包装在独立的 `try-except` 中，程序在每种异常发生时都会执行对应的 `except` 块，不会崩溃。这种精确捕获的能力正是 `try-except` 的精髓。

### 2.9 异常捕获的粒度控制：太大的 try 块 vs 太细的 try 块

异常捕获的代码设计需要考虑一个关键的权衡：`try` 块的粒度。过大的 `try` 块会捕获到意料之外的异常并隐藏错误；过细的 `try` 块会让代码变得冗长且难以阅读。

**太大 try 块的问题**

```python
# 演示过大 try 块的陷阱
def demo_too_large_try():
    print("=== 太大 try 块的风险 ===\n")

    # 糟糕的设计：用一个 try 包裹了太多不同逻辑
    def process_user_data_bad(user_dict, user_id):
        """用一个大 try 包裹所有逻辑"""
        try:
            # 多个不相关的操作
            user_info = user_dict[user_id]  # 可能 KeyError

            # 字符串操作
            name = user_info["name"]  # 可能 KeyError
            age_str = user_info["age"]  # 可能 KeyError

            # 数值操作
            age = int(age_str)  # 可能 ValueError
            birth_year = 2025 - age

            # 文件操作
            with open(f"user_{user_id}.txt", "w") as file:
                file.write(f"{name},{age}")

            # 数学运算
            division_result = 100 / age  # 可能 ZeroDivisionError

            return {
                "name": name,
                "age": age,
                "birth_year": birth_year,
                "division_result": division_result
            }
        except:
            # 裸 except：捕获一切异常
            # 但无法区分是 KeyError 还是 ZeroDivisionError 还是 FileNotFoundError
            print(f"处理用户 {user_id} 时出错")
            return None

    # 演示：传入一个不存在 age 字段的数据
    test_users = {
        1: {"name": "Alice", "age": "30"},
        2: {"name": "Bob"}  # 缺少 age
    }

    for uid in [1, 2]:
        result = process_user_data_bad(test_users, uid)
        status = "成功" if result else "失败"
        print(f"用户 {uid} 处理{status}")
        if result:
            print(f"  结果: {result}")
    print()

    # 更好的设计：区分异常来源
    def process_user_data_good(user_dict, user_id):
        """将不同操作分开处理"""
        # 第 1 步：获取用户数据（字典操作）
        try:
            user_info = user_dict[user_id]
        except KeyError:
            print(f"用户 ID {user_id} 不存在")
            return None

        # 第 2 步：提取并转换字段
        try:
            name = user_info["name"]
            age_str = user_info["age"]
        except KeyError as error:
            print(f"用户 {user_id} 缺少字段: {error}")
            return None

        try:
            age = int(age_str)
        except ValueError:
            print(f"用户 {user_id} 的 age 不是有效数字: '{age_str}'")
            return None

        # 第 3 步：业务计算
        birth_year = 2025 - age

        try:
            division_result = 100 / age
        except ZeroDivisionError:
            division_result = float('inf')

        print(f"用户 {user_id} ({name}) 处理成功")
        return {
            "name": name,
            "age": age,
            "birth_year": birth_year,
            "division_result": division_result
        }

    print("=== 更好设计的演示 ===")
    for uid in [1, 2]:
        result = process_user_data_good(test_users, uid)
        if result:
            print(f"  结果: {result}")

demo_too_large_try()
```

**运行结果说明**：

1. 在 `process_user_data_bad` 中，所有操作都包在一个大 `try` 块里，使用裸 `except`。当用户 2 缺少 `age` 字段时，程序虽然不会崩溃，但我们无法知道具体是哪个操作出了问题（是字典查找失败？还是文件写入失败？还是除零？）。这种"笼统处理"的方式让调试变得困难。

2. 在 `process_user_data_good` 中，每个操作步骤都有自己独立的 `try-except` 结构，异常类型也被精确匹配。当出错时，我们能明确知道是"哪个步骤"出了"什么类型的错"，并采取针对性的补救措施。

**太细 try 块的问题**

```
尽管精确很重要，但过度拆分也会带来问题：

1. 代码变得冗长，可读性下降。
2. 相同类型的异常需要在多个位置重复处理。
3. 正常的业务逻辑被大量的 `try-except` 结构淹没。

推荐的实践是：按照"逻辑阶段"而非"每一行"来划分 try 块。
```

**粒度控制的经验法则**：

| 粒度 | 适用场景 | 示例 |
|------|---------|------|
| 粗粒度 | 脚本顶层、快速原型、所有错误统一处理 | 爬虫调度器（所有网络/解析错误都视为"抓取失败"） |
| 中粒度（推荐） | 大多数生产代码，按函数/逻辑阶段划分 | 一个数据导入函数：解析阶段、校验阶段、持久化阶段各有独立 try |
| 细粒度 | 需要精确区分错误类型的核心逻辑 | 财务计算：除零和负数开平方需要不同的处理策略 |

```python
# 粒度控制的对比演示
def demo_granularity_comparison():
    print("=== 异常捕获粒度对比 ===\n")

    # 太细：每个操作一行一个 try
    def too_fine_grained():
        data = {"user": "Alice", "score": "95", "level": "3"}
        try:
            user = data["user"]
        except KeyError:
            user = "未知用户"

        try:
            score = int(data["score"])
        except (KeyError, ValueError):
            score = 0

        try:
            level = int(data["level"])
        except (KeyError, ValueError):
            level = 1

        return {"user": user, "score": score, "level": level}

    # 适中：按逻辑阶段划分
    def moderate_grained():
        data = {"user": "Alice", "score": "95", "level": "3"}

        # 阶段 1：字段存在性检查
        try:
            user = data["user"]
            score_str = data["score"]
            level_str = data["level"]
        except KeyError as error:
            print(f"数据缺少必填字段: {error}")
            return {"user": "未知用户", "score": 0, "level": 1}

        # 阶段 2：类型转换
        try:
            score = int(score_str)
            level = int(level_str)
        except ValueError as error:
            print(f"数据类型转换失败: {error}")
            return {"user": user, "score": 0, "level": 1}

        return {"user": user, "score": score, "level": level}

    print("太细粒度结果:", too_fine_grained())
    print("适中粒度结果:", moderate_grained())

demo_granularity_comparison()
```

**运行结果说明**：两者功能性等价，但 `moderate_grained` 更容易阅读和维护。当数据格式发生变化时，只需要修改一个地方而不是三个。异常的向上传播机制允许我们用更少的 `try-except` 覆盖更多的代码。

### 2.10 空 try 块的语法限制

Python 语法规定 `try` 块不能为空，必须至少包含一行代码。如果 `try` 块中没有任何代码，解释器会在语法解析阶段报错。

```python
# 演示空 try 块的语法错误
def demo_empty_try():
    print("=== 空 try 块的语法限制 ===\n")
    print("下面的代码会触发 SyntaxError：")
    print()
    print("  try:")
    print("      # 这里没有代码")
    print("  except Exception:")
    print("      pass")
    print()

    # 解释为什么不行：
    print("Python 的设计哲学是：如果没有需要保护的代码，就不需要 try。")
    print("空 try 块意味着"没有需要监控的操作"，这是矛盾的。")
    print()

    # 正确做法：如果确实需要空操作，用 pass
    print("=== 正确替代方案 ===")
    print("如果确实需要一个占位：")
    print("可以在 try 块中写 pass（虽然这在实际中很少有意义）")
    print()

    # 展示一个实际可能会遇到的场景
    print("实际中可能会遇到的情况：")
    def placeholder_function():
        """一个尚未实现的函数"""
        # 开发者先用 pass 占位
        pass

    # 如果 try 块中只调用了空函数...
    try:
        placeholder_function()
    except Exception:
        print("占位函数不会抛出异常")
    print("try 块中有代码（即使函数是空的），语法没问题")

demo_empty_try()
```

**运行结果说明**：

Python 解释器不允许出现空 `try` 块。尝试写一个空 `try` 块（`try:\n    \nexcept:`）会在编译阶段抛出 `SyntaxError`。这是因为 `try` 块的设计目的是保护一段代码——如果没有代码需要保护，就不应该存在 `try` 结构。

在调试或开发过程中，如果需要一个工具函数还没有实现，可以先用 `pass` 填充，这也意味着 `try` 块中有了实际代码，语法上没问题。

### 2.11 try 中变量的作用域问题

这是一个容易忽略但实际工程中经常踩坑的问题。在 `try` 块中定义的变量，对外部作用域是可见的（Python 的作用域以函数为单位，块级结构 `try/except/if/for/while` 不会创建新的作用域），但关键的问题是：**如果异常在变量赋值前发生，该变量可能不存在**。

```python
# 演示 try 中变量的作用域与部分赋值风险
def demo_variable_scope():
    print("=== try 块中变量的作用域问题 ===\n")

    # 场景 1：无异常时，try 块中的变量对外部可见
    print("--- 场景 1：无异常，变量正常存在 ---")
    try:
        user_input = 42
        processed_value = user_input * 2
    except ValueError:
        processed_value = 0

    # processed_value 在这里是可见的
    print(f"  processed_value = {processed_value}")
    print()

    # 场景 2：异常在赋值前发生，变量不存在
    print("--- 场景 2：异常在赋值前，变量不存在 ---")
    try:
        # 这一行抛出异常
        risky_data = [1, 2, 3]
        # 如果下面这行抛出异常，safe_result 不会被赋值
        first_element = risky_data[0]
        safe_result = first_element * 10  # 弱依赖
    except IndexError:
        print("  索引越界被捕获")
        safe_result = -1
    except TypeError:
        print("  类型错误被捕获")

    # 关键问题：如果 IndexError 在 first_element 之前被触发，
    # first_element 也会存在，因为异常发生在 risky_data[0] 之前。
    # 但如果异常来自 risky_data[0] 本身，first_element 就不存在了。
    # 这里我们安全访问了 first_element，因为它的赋值在异常之前
    print(f"  risky_data = {risky_data}")  # 存在
    print(f"  first_element = {first_element}")  # 存在
    print(f"  safe_result = {safe_result}")  # 存在（因为异常收到后赋值了 -1）
    print()

    # 场景 3：真正有风险的情况
    print("--- 场景 3：真正有风险的部分赋值 ---")
    risk_variable = "外部变量的值"  # 外部有默认值——安全做法

    try:
        # 假设这里有一段复杂逻辑
        data = {"score": "95"}
        # 假设异常在这之后发生
        score_str = data["score"]
        # 如果下面这行抛出异常，score_str 也存在（因为上面已经赋值了）
        score = int(score_str)  # 假设这里正常
        # 再假设另一个操作抛出了异常
        missing = data["non_existent_key"]  # KeyError!
        # 下面的变量不会存在
        never_created = "这部分代码不会执行"
    except KeyError:
        print("  捕获到 KeyError")

    print(f"  score_str = {score_str}")  # 存在（异常前已赋值）
    print(f"  score = {score}")  # 存在（异常前已赋值）
    # print(f"  never_created = {never_created}")  # 这一行会报 NameError！

    try:
        print(f"  never_created = {never_created}")  # 这行会抛出 NameError
    except NameError:
        print("  never_created 不存在（NameError），因为异常发生时它还没赋值")
    print()

    # 场景 4：避免变量不存在的最佳实践
    print("--- 场景 4：变量不存在的最佳实践 ---")
    def safe_process_score(data_dict, user_key):
        """安全地处理评分数据"""
        result = None  # 先给默认值

        try:
            score_str = data_dict[user_key]["score"]
            result = int(score_str)
        except (KeyError, ValueError, TypeError):
            # result 保持为 None，或者这里可以赋值默认值
            result = result  # 或者 result = 0

        # 检查 result
        if result is not None:
            print(f"  评分处理成功: {result}")
        else:
            print("  评分处理失败，返回默认值")
            result = 0
        return result

    users = {
        "Alice": {"score": "95"},
        "Bob": {"score": "not_a_number"},
        "Charlie": {}  # 缺少 score 字段
    }

    for name in ["Alice", "Bob", "Charlie"]:
        score_value = safe_process_score(users, name)
        print(f"  {name} 的最终评分: {score_value}")

demo_variable_scope()
```

**运行结果说明**：

1. **场景 1**：没有异常发生，`try` 块中创建的所有变量都存在，外部可以正常访问。Python 没有块级作用域，`try` 块不会创建独立的作用域。

2. **场景 2**：异常在 `first_element` 赋值之前发生（`risky_data[0]` 抛出异常），`first_element` 不会被赋值。但在我们的 demo 中 `risky_data[0]` 是 `1`，不会抛出 `IndexError`。异常发生在 `missing = data["non_existent_key"]`，所以 `score_str` 和 `score` 都存在。

3. **场景 3**：真正的风险来自异常前未赋值的变量。`never_created` 在异常发生时还未被创建，试图在 `try-except` 外部访问它会抛出 `NameError`。

4. **场景 4**：最佳实践是在 `try` 块外部先声明变量并赋予默认值，然后在 `try` 块内更新这个值。如果发生异常，变量保持默认值；如果成功，变量被更新。这样在 `try-except` 外部访问该变量时总是安全的。

**变量作用域问题的安全模式**：

```python
# 安全的变量初始化模式
def safe_variable_pattern():
    print("=== 变量初始化安全模式 ===\n")

    # 模式 1：外部初始化法（推荐）
    print("--- 模式 1：外部初始化法 ---")
    result = None  # 先声明并赋予默认值
    try:
        result = int("42")  # 尝试赋值
    except ValueError:
        result = 0  # 异常时的值

    print(f"  result = {result}")  # 恒安全
    print()

    # 模式 2：else 子句法（仅在无异常时需要变量的场景）
    # 注意：这里预告 else，但不展开
    print("--- 模式 2：使用 else 子句 ---")
    result_dict = {}
    try:
        number = int("42")  # 无异常，number 存在
    except ValueError:
        print("  转换失败")
    else:
        # 仅在无异常时执行，确保 number 存在
        result_dict["number"] = number
        result_dict["double"] = number * 2

    print(f"  result_dict = {result_dict}")
    print(f"  number = {number}")  # 因为无异常，number 存在
    print()

    # 模式 3：兜底返回值
    print("--- 模式 3：函数内兜底返回值 ---")
    def safe_divide(numerator, denominator):
        try:
            quotient = numerator / denominator
        except ZeroDivisionError:
            return None  # 异常时尽早返回
        return quotient  # 这里 quotient 一定存在

    print(f"  safe_divide(10, 2) = {safe_divide(10, 2)}")
    print(f"  safe_divide(10, 0) = {safe_divide(10, 0)}")

safe_variable_pattern()
```

**运行结果说明**：

三种模式都解决了同一个问题：确保变量在 `try-except` 外部被访问时一定存在。

- **模式 1（外部初始化法）**：最简单直接，在进入 `try` 前给变量一个"安全默认值"。
- **模式 2（`else` 子句法）**：利用 `else` 在无异常时才执行的特性，确保变量只在安全时被使用。
- **模式 3（兜底返回值法）**：在函数中，如果异常发生在变量赋值前，用 `return` 提前退出函数。

---

## 3. 最佳实践

### 3.1 优先使用 `except Exception:` 而非裸 `except:`

裸 `except:` 会捕获 `KeyboardInterrupt`、`SystemExit` 等不应被程序捕获的系统级异常。应始终使用 `except Exception:` 来捕获常规程序异常。

**不推荐**：
```python
try:
    data = parse_input(user_input)
except:
    data = None
```

**推荐**：
```python
try:
    data = parse_input(user_input)
except Exception:
    data = None
```

### 3.2 尽可能捕获具体的异常类型

捕获 `Exception` 本身仍是一种笼统的捕获。当场景允许时，应捕获最具体的异常类型。

```python
# 具体异常 vs 笼统异常的对比
def demo_specific_vs_generic():
    print("=== 具体异常 vs 笼统异常 ===\n")

    # 不推荐：笼统捕获
    def divide_numbers_bad(a, b):
        try:
            return a / b
        except Exception:
            print("出错了")
            return None

    # 推荐：具体捕获
    def divide_numbers_good(a, b):
        try:
            return a / b
        except ZeroDivisionError:
            print("除数不能为零")
            return None
        except TypeError:
            print("参数必须是数字")
            return None

    print("divide_numbers_good(10, 2) =", divide_numbers_good(10, 2))
    print("divide_numbers_good(10, 0) =", divide_numbers_good(10, 0))
    print("divide_numbers_good(10, 'a') =", divide_numbers_good(10, "a"))

demo_specific_vs_generic()
```

**运行结果说明**：
- 笼统捕获无法区分是除零错误还是参数类型错误，给用户的反馈信息也无法做到精准。
- 具体捕获允许针对不同类型的异常给出不同的错误信息和处理策略。

### 3.3 尽量缩小 try 块的范围

`try` 应该只包裹确实可能抛出异常的代码行，而不是整个函数。范围过大的 `try` 可能会导致异常被错误地捕获（隐藏了真正的 bug）。

```python
# 缩小 try 块的演示
def demo_narrow_try():
    print("=== 缩小 try 块的范围 ===\n")

    # 不推荐：整个函数都被 try 包裹
    def process_item_bad(item):
        try:
            name = item["name"]
            price = float(item["price"])
            discounted = price * 0.9
            formatted = f"{name}: ¥{discounted:.2f}"
            return formatted
        except KeyError:
            return "缺少字段"
        except ValueError:
            return "价格格式错误"

    # 推荐：只包裹真正可能出错的代码
    def process_item_good(item):
        # 字典查找——可能 KeyError
        try:
            name = item["name"]
            price_str = item["price"]
        except KeyError:
            return "缺少字段"

        # 类型转换——可能 ValueError
        try:
            price = float(price_str)
        except ValueError:
            return "价格格式错误"

        # 纯计算和格式化——这里不太可能出错
        discounted = price * 0.9
        formatted = f"{name}: ¥{discounted:.2f}"
        return formatted

    # 功能相同，但好设计的 try 范围更精确、更易读
    items = [
        {"name": "苹果", "price": "5.50"},
        {"name": "香蕉", "price": "invalid"},
        {"name": "橘子"}  # 缺少 price
    ]

    print("处理结果：")
    for item in items:
        print(f"  {process_item_good(item)}")

demo_narrow_try()
```

**运行结果说明**：两者在功能上等价，但 `process_item_good` 将字典操作和类型转换分离到独立的 `try-except` 中。这样做的优势是：
- 异常类型与异常源的对应关系更明确。
- 阅读者可以立即看出"哪个操作可能会抛出哪个异常"。
- 未来修改时，不易因为添加了新代码而意外捕获到不该捕获的异常。

### 3.4 避免在 try 块中放置与异常无关的代码

`try` 块只应包含你预期可能会抛出某个特定异常的代码。无关代码不应放在 `try` 块中，否则会增加"误捕获"的风险。

```python
# 演示无关代码被放到 try 块中的风险
def demo_unrelated_code_in_try():
    print("=== try 块中的无关代码风险 ===\n")

    # 不推荐：将无关的操作也放在 try 中
    def save_user_bad(user_data, filepath):
        try:
            # 下面两行是正常的业务逻辑，不太可能抛出异常
            user_id = user_data["id"]
            user_name = user_data["name"]
            print(f"准备保存用户 {user_name} (ID: {user_id})")

            # 下面这一行才是真正可能出错的操作
            with open(filepath, "w") as f:
                f.write(f"{user_id},{user_name}")
        except OSError:
            print(f"文件无法写入: {filepath}")
            return False
        except KeyError:
            # 但这里也能捕获 KeyError——因为它也被包裹在 try 中了
            print("用户数据格式错误（KeyError）")
            return False
        return True

    # 推荐：只将可能出错的代码放在 try 中
    def save_user_good(user_data, filepath):
        # 字典访问——在主逻辑中自然处理
        try:
            user_id = user_data["id"]
            user_name = user_data["name"]
        except KeyError:
            print("用户数据格式错误")
            return False

        print(f"准备保存用户 {user_name} (ID: {user_id})")

        # 文件操作——单独的 try
        try:
            with open(filepath, "w") as f:
                f.write(f"{user_id},{user_name}")
        except OSError:
            print(f"文件无法写入: {filepath}")
            return False
        return True

    print("函数可以正常工作，但 save_user_good 的设计更清晰。")

demo_unrelated_code_in_try()
```

### 3.5 不要用异常处理来替代正常的流程控制

有些场景下，使用 `if-else` 进行先验检查比使用 `try-except` 更合适。异常处理的设计初衷是处理"意料之外"的错误，而不是"常规的"条件分支。

```python
# 异常处理 vs 条件判断
def demo_exception_vs_condition():
    print("=== 异常处理 vs 条件判断 ===\n")

    # 不推荐：用异常处理来处理本可以避免的错误
    def get_dict_value_bad(data, key):
        try:
            return data[key]
        except KeyError:
            return None

    # 推荐：用条件判断进行先验检查
    def get_dict_value_good(data, key):
        if key in data:
            return data[key]
        return None

    # 另一个例子：类型转换
    def parse_int_bad(value):
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

    # 这个场景用 try-except 是可以的，因为没有优雅的 if 检查方式
    def parse_int_good(value):
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

    print("值存在时: get_dict_value_good({'a': 1}, 'a') =", get_dict_value_good({"a": 1}, "a"))
    print("值不存在时: get_dict_value_good({'a': 1}, 'b') =", get_dict_value_good({"a": 1}, "b"))
    print("parse_int_good('42') =", parse_int_good("42"))
    print("parse_int_good('abc') =", parse_int_good("abc"))
    print()
    print("关键原则：用 if 能做的事就不要用 try-except 来做。")
    print("try-except 适用于：无法先验检查的场景（如网络请求、用户输入、类型转换）。")

demo_exception_vs_condition()
```

**运行结果说明**：
- 对于字典键是否存在，可以使用 `if key in data` 进行先验检查，代码更简洁、意图更明确。
- 对于字符串转整数，虽然也可以先用 `isdigit()` 检查，但复杂的字符串格式（如负数、科学记数法）使得先验检查并不优雅，此时使用 `try-except` 是合理的。

**判断标准**：如果能用一条简单的 `if` 语句来规避异常，优先使用 `if`；如果先验检查本身复杂或不可靠（如网络 I/O），使用 `try-except`。

### 3.6 理解异常的继承关系，编写更精确的 except

异常继承体系允许我们利用多态性来捕获异常族。例如，`FileNotFoundError`、`PermissionError`、`IsADirectoryError` 都是 `OSError` 的子类。如果需要处理所有文件系统相关的错误，可以只捕获 `OSError`，而不是列出所有子类。

```python
# 利用异常继承关系进行捕获
def demo_exception_inheritance():
    print("=== 利用异常继承关系进行捕获 ===\n")

    # 场景：多个不同的文件操作错误
    def read_file_safe(filepath):
        try:
            with open(filepath, "r") as file:
                return file.read()
        except OSError as error:
            # OSError 是 FileNotFoundError、PermissionError 等的基类
            if isinstance(error, FileNotFoundError):
                return f"文件 {filepath} 不存在"
            elif isinstance(error, PermissionError):
                return f"没有权限读取 {filepath}"
            else:
                return f"读取文件时出错: {error}"

    # 更精确的方式：按顺序捕获具体的子类
    def read_file_precise(filepath):
        try:
            with open(filepath, "r") as file:
                return file.read()
        except FileNotFoundError:
            return f"文件 {filepath} 不存在"
        except PermissionError:
            return f"没有权限读取 {filepath}"
        except OSError as error:
            return f"读取文件时出错: {error}"

    print("两种方式都是合理的设计，取决于你是需要统一处理还是区分处理。")
    print()

    # 异常顺序很重要：子类必须写在父类前面
    print("=== 异常的捕获顺序很重要 ===")
    print("错误写法：")
    print("  try:")
    print("      # ...")
    print("  except Exception:    # 先捕获父类")
    print("      ...")
    print("  except ValueError:   # 这个子类永远不会被捕获")
    print("      ...")
    print("因为 ValueError 也是 Exception 的子类，前面的 except 会先捕获它。")
    print()
    print("正确写法：")
    print("  try:")
    print("      # ...")
    print("  except ValueError:    # 先捕获子类")
    print("      ...")
    print("  except Exception:     # 后捕获父类")
    print("      ...")

demo_exception_inheritance()
```

**运行结果说明**：异常的捕获顺序遵循"从上到下匹配"原则。一旦找到匹配的 `except` 子句，后续的 `except` 子句都会被跳过。因此，必须将具体异常类型（子类）写在前面，通用类型（父类）写在后面，否则具体的捕获逻辑永远不会有机会执行。

### 3.7 捕获异常后不要沉默地吞掉

这是新手最容易犯的错误之一。一个空的 `except` 块（或只包含 `pass`）会将异常彻底吞掉，使得调试时无从得知程序出了什么问题。

```python
# 演示沉默吞掉异常的风险
def demo_swallowing_exceptions():
    print("=== 不要沉默地吞掉异常 ===\n")

    # 糟糕的做法：沉默吞掉
    def convert_to_int_bad(data_list):
        results = []
        for item in data_list:
            try:
                number = int(item)
                results.append(number)
            except Exception:
                pass  # 异常被沉默吞掉！没有任何记录
        return results

    # 更好的做法：至少打印日志
    import logging
    logging.basicConfig(level=logging.WARNING)

    def convert_to_int_good(data_list):
        results = []
        for item in data_list:
            try:
                number = int(item)
                results.append(number)
            except Exception as error:
                # 记录日志，不沉默吞掉
                logging.warning(f"转换失败: '{item}' -> {error}")
                # 或者更简单的做法
                # print(f"警告: 无法转换 '{item}' -> {error}")
        return results

    test_data = ["10", "20", "abc", "30", "xyz", "40"]

    print("测试数据:", test_data)
    print("结果（含警告日志）:", end=" ")
    result = convert_to_int_good(test_data)
    print(result)
    print()
    print("注意：虽然 'abc' 和 'xyz' 被跳过，但至少我们知道了原因。")
    print("如果使用 bad 版本，我们甚至不知道有元素被跳过了。")

demo_swallowing_exceptions()
```

**运行结果说明**：
- `convert_to_int_bad` 静默地跳过了无法转换的元素，调用方完全不知道有元素被丢弃了，这在数据分析场景中可能会导致难以排查的数据质量问题。
- `convert_to_int_good` 在捕获到异常时至少会打印一条警告日志，让开发者知道哪些数据被跳过以及原因。在正式的生产代码中，应该使用 `logging` 模块记录异常，而非 `print`。

### 3.8 函数边界上进行异常捕获

一个常见的设计模式是在函数的边界处（即函数的入口或出口）进行异常捕获。这意味着函数内部只处理它知道如何恢复的异常，对于无法恢复的异常，让它们传播到调用方。这样可以让异常处理的责任层次分明。

```python
# 函数边界的异常捕获
def demo_function_boundary():
    print("=== 函数边界上的异常捕获 ===\n")

    # 设计良好的模式：函数内部只处理自己能处理的异常
    def fetch_user_score(user_data, user_id):
        """
        获取用户评分。
        函数只处理数据获取和转换，不处理业务层的逻辑。
        """
        try:
            user = user_data[user_id]
            score_str = user.get("score", "0")
            return int(score_str)
        except KeyError:
            # 函数边界内捕获：用户ID不存在
            raise ValueError(f"用户 {user_id} 不存在") from None
        except (ValueError, TypeError) as error:
            # 函数边界内捕获：转换失败
            raise ValueError(f"用户 {user_id} 的评分数据异常: {error}") from None

    # 上层调用方根据需要处理
    def display_user_score(user_data, user_id):
        try:
            score = fetch_user_score(user_data, user_id)
            print(f"用户 {user_id} 的评分: {score}")
        except ValueError as error:
            print(f"显示评分失败: {error}")

    test_users = {
        1: {"score": "95"},
        2: {"score": "not_a_number"},
        3: {}  # 没有 score
    }

    for user_id in [1, 2, 3, 999]:
        display_user_score(test_users, user_id)
    print()
    print("关键设计：fetch_user_score 将底层的 KeyError/ValueError 统一转换为")
    print("业务语义的 ValueError，上层调用方只需处理这一种业务异常。")

demo_function_boundary()
```

**运行结果说明**：

- `fetch_user_score` 在函数边界内将底层的 `KeyError` 和 `ValueError` 统一转换为业务语义的 `ValueError`（携带描述信息）。
- 上层调用方 `display_user_score` 只需要捕获一种异常类型（`ValueError`），而不需要关心内部实现细节。
- 这种"异常封装"的设计模式在构建多层应用程序时非常有用——每一层将本层的异常抽象化后向外传播，调用方无需了解底层实现的细节。

---

## 4. 原理

### 4.1 Python 异常处理机制的核心实现原理

Python 的异常处理机制由解释器在运行时动态管理，其核心实现涉及以下几个关键组件：

**异常对象与栈帧**

当 Python 解释器执行到 `try` 块的入口时，它会在当前执行帧（frame）上记录一个"异常处理表"（exception handling table）的入口。这个表记录了 `try` 块的起始字节码位置、对应的 `except` 子句位置、以及 `finally` 子句位置（如果有）。

每个异常都是 `BaseException` 或其子类的实例。异常对象包含三个关键属性：

```python
# 异常对象的属性
def demo_exception_attributes():
    print("=== 异常对象的属性 ===\n")

    try:
        1 / 0
    except ZeroDivisionError as error:
        print(f"异常类型: {type(error).__name__}")
        print(f"异常消息: {error}")
        print(f"异常参数: {error.args}")
        # traceback 对象
        import sys
        traceback_info = sys.exc_info()
        print(f"异常类型 (sys.exc_info): {traceback_info[0].__name__}")
        print(f"异常对象 (sys.exc_info): {traceback_info[1]}")
        print(f"traceback 对象: {traceback_info[2]}")
        print()
        print("每个异常对象都携带了完整的调用栈信息，")

demo_exception_attributes()
```

**运行结果说明**：
- `type(error).__name__` 返回异常类名（如 `ZeroDivisionError`）。
- `error.args` 是异常创建时传入的参数元组，通常是错误消息。
- `sys.exc_info()` 返回当前线程正在处理的异常信息元组 `(type, value, traceback)`，这在调试和日志记录中非常有用。

**异常传播的机制**

当 `try` 块中的某行代码抛出异常时，解释器执行以下操作：

1. **创建异常对象**：调用相应异常类的构造器，传入异常参数。
2. **查找匹配的 except**：从当前帧的异常处理表中搜索匹配当前异常类型的 `except` 子句。
3. **匹配规则**：如果 `except` 后指定的异常类型是抛出异常类型的父类（或相同），则匹配成功。例如 `except Exception` 可以匹配 `ValueError`。
4. **执行 except 块**：如果找到匹配的 `except` 子句，执行其中的代码。
5. **栈展开（Stack Unwinding）**：如果当前帧没有匹配的 `except` 子句，解释器会销毁当前帧（释放局部变量等资源），然后向调用帧（caller frame）传播异常。这个过程重复进行，直到找到匹配的 `except` 或到达程序顶层（此时程序终止）。

```python
# 模拟栈展开过程
def demo_stack_unwinding():
    print("=== 异常的栈展开过程 ===\n")

    def level3():
        print("  进入 level3")
        raise RuntimeError("在 level3 中出错了")
        print("  离开 level3（这行不显示）")

    def level2():
        print("  进入 level2")
        try:
            level3()
        except ValueError:
            # 不匹配 RuntimeError，所以不处理
            print("  level2 捕获到了 ValueError（但不会触发）")
        print("  level2 中的这个输出也不会显示（异常继续传播）")

    def level1():
        print(" 进入 level1")
        try:
            level2()
        except RuntimeError as error:
            print(f" level1 捕获到: {error}")
        print(" 离开 level1")

    print("调用链: level1 -> level2 -> level3")
    print()
    level1()
    print()
    print("分析：")
    print("1. level3 抛出 RuntimeError")
    print("2. level2 的 except ValueError 不匹配")
    print("3. level2 的 try-except 之后代码也被跳过")
    print("4. level1 的 except RuntimeError 成功匹配，异常被捕获")

demo_stack_unwinding()
```

**运行结果说明**：

异常从 `level3` 抛出后，逐层向外传播：

1. `level3` 中没有 `try-except`，所以异常立即离开 `level3` 返回到调用方 `level2`。
2. `level2` 的 `try` 块包含了调用 `level3()` 的语句，所以异常在 `level2` 的异常处理表中查找匹配项。`except ValueError` 不匹配 `RuntimeError`，匹配失败。
3. 异常继续从 `level2` 传播到 `level1`。
4. `level1` 的 `except RuntimeError` 成功匹配，异常被捕获，`level1` 可以继续正常执行。

注意：`level2` 中 `try-except` 结构之后的代码也**不会执行**，因为异常在离开 `level2` 帧时，该帧正在被销毁。

**异常捕获的性能成本**

异常处理不是零成本的——当 `try` 块进入时，解释器需要在帧上注册异常处理表入口。不过，这个成本主要体现在异常的设置阶段，如果 `try` 块中没有发生异常，额外的开销非常小（接近零）。真正昂贵的开销来自异常被**抛出**时的栈展开过程和 traceback 对象的创建。

```python
# 异常的性能成本示意
import time

def demo_exception_cost():
    print("=== 异常性能成本对比 ===\n")

    ITERATIONS = 100000

    # 方法 1：使用 try-except
    start = time.time()
    for i in range(ITERATIONS):
        try:
            result = int("42")  # 从不失败
        except ValueError:
            result = 0
    try_duration = time.time() - start

    # 方法 2：不使用 try-except
    start = time.time()
    for i in range(ITERATIONS):
        result = int("42")
    normal_duration = time.time() - start

    print(f"方法 1（有 try 但无异常）：{try_duration:.4f} 秒")
    print(f"方法 2（无 try）：{normal_duration:.4f} 秒")
    print(f"差异：{try_duration - normal_duration:.6f} 秒")
    print()
    print("结论：无异常时的 try 块几乎没有性能开销。")
    print("但异常被抛出时（栈展开 + traceback 创建），开销会显著增加。")
    print("因此，异常应用于真正的错误场景，而非正常的流程控制。")

demo_exception_cost()
```

**运行结果说明**：当 `try` 块中没有异常发生时，额外的性能开销可以忽略不计。这个特性意味着我们可以放心地使用 `try-except` 来保护代码，而不用过度担心性能问题。但需要注意的是，如果异常**被抛出**，其性能成本会显著增加（因为要创建异常对象、构建 traceback、展开调用栈），因此在正常的循环流程中使用异常来控制逻辑仍然是不推荐的。

### 4.2 裸 except 捕获所有异常的底层原因

从 Python 解释器的角度来看，`except:` 和 `except BaseException:` 在语义上是等价的。因为 `BaseException` 是所有异常类的根，所以 `except:` 会匹配一切。

```python
# 验证 except: 和 except BaseException: 等价
def demo_bare_equals_baseexception():
    print("=== 验证 except: 等价于 except BaseException: ===\n")

    # 验证 BaseException 是所有异常的根
    print("BaseException 的子类：")
    print(f"  Exception 是 BaseException 的子类: {issubclass(Exception, BaseException)}")
    print(f"  KeyboardInterrupt 是 BaseException 的子类: {issubclass(KeyboardInterrupt, BaseException)}")
    print(f"  SystemExit 是 BaseException 的子类: {issubclass(SystemExit, BaseException)}")
    print(f"  GeneratorExit 是 BaseException 的子类: {issubclass(GeneratorExit, BaseException)}")
    print()

    # & 验证 except Exception 不捕获 KeyboardInterrupt
    print("except Exception 的匹配范围：")
    print(f"  可以捕获 ValueError: {issubclass(ValueError, Exception)}")
    print(f"  不可捕获 KeyboardInterrupt: {issubclass(KeyboardInterrupt, Exception)}")
    print(f"  不可捕获 SystemExit: {issubclass(SystemExit, Exception)}")

demo_bare_equals_baseexception()
```

**运行结果说明**：

- `except:` 等价于 `except BaseException:`，会捕获从 `KeyboardInterrupt` 到 `ValueError` 的一切异常。
- `except Exception:` 只捕获继承自 `Exception` 的异常，这包括所有"常规"的程序运行时异常。
- 这种设计的背后原因：`KeyboardInterrupt`、`SystemExit`、`GeneratorExit` 被视为"系统级"事件，它们继承自 `BaseException` 而非 `Exception`，使得常规的 `except Exception` 不会意外地捕获它们。

### 4.3 try 语句在 CPython 中的字节码实现

理解 `try-except` 在 CPython 字节码层面的实现，能帮助我们更深入地理解其行为。在 CPython 中，`try` 块通过 `SETUP_FINALLY`（或 `SETUP_EXCEPT`）/ `POP_BLOCK` 等字节码指令来实现。

```python
# 查看 try-except 的字节码
import dis

def demo_bytecode_try_except():
    print("=== try-except 的字节码分析 ===\n")

    def sample_function():
        try:
            result = 10 / 2
            return result
        except ZeroDivisionError:
            return -1

    print("查看 sample_function 的字节码：")
    print("（这里是 dis 模块的反汇编输出）")
    dis.dis(sample_function)
    print()
    print("关键字节码指令说明：")
    print("  SETUP_EXCEPT       - 设置异常处理入口（进入 try 块）")
    print("  POP_BLOCK          - 退出 try 块")
    print("  JUMP_FORWARD       - 无异常时跳转到 try-except 之后")
    print("  POP_EXCEPT         - 异常处理后清理")
    print("  END_FINALLY        - 结束异常处理流程")

demo_bytecode_try_except()
```

**运行结果说明**：

`dis.dis()` 展示了 `try-except` 在字节码层面的实现：

- `SETUP_EXCEPT` 指令标记了 `try` 块的开始，并记录了异常处理代码（`except` 块）的跳转目标地址。
- `POP_BLOCK` 指令标记了 `try` 块的结束。
- 当异常发生时，解释器会查找当前帧的异常处理表（由 `SETUP_EXCEPT` 注册），找到匹配的 `except` 块后跳转执行。
- 这种实现方式意味着只有在进入 `try` 块后抛出的异常才会被捕获，在 `try` 块进入之前发生的异常不会进入这个处理流程。

### 4.4 异常对象的内存管理

异常对象作为堆上的普通 Python 对象，遵循标准的引用计数和垃圾回收机制。但在异常传播过程中，traceback 对象会持有一个帧对象的引用链，这可能导致循环引用问题（帧对象持有对异常对象的引用，异常对象通过 traceback 持有对帧对象的引用）。

```python
# 异常与循环引用
import sys
import gc

def demo_exception_cycle():
    print("=== 异常与循环引用 ===\n")

    def create_exception_with_traceback():
        try:
            1 / 0
        except ZeroDivisionError:
            # 获取当前异常信息
            exc_type, exc_value, exc_tb = sys.exc_info()
            return exc_value

    # 创建一个异常对象
    error = create_exception_with_traceback()
    print(f"异常对象: {error}")
    print(f"异常类型: {type(error).__name__}")

    # 检查 traceback 是否持有帧引用
    tb = error.__traceback__
    if tb:
        print(f"traceback 对象: {tb}")
        frame = tb.tb_frame
        print(f"traceback 持有的帧对象: {frame}")
        print(f"帧对象所属函数: {frame.f_code.co_name}")

    print()
    print("注意：在 Python 3.4+ 中，PEP 442 通过安全的对象清理机制")
    print("解决了异常处理中的循环引用问题，异常对象可以被正常回收。")

demo_exception_cycle()
```

**运行结果说明**：

- `sys.exc_info()` 返回一个三元组 `(exc_type, exc_value, exc_tb)`，其中 `exc_tb` 是 traceback 对象。
- traceback 对象通过 `tb_frame` 属性持有帧对象的引用，帧对象通过 `f_locals` 等属性持有局部变量的引用。
- 在 Python 3.4 之前，这种引用链可能会导致循环引用，影响垃圾回收。PEP 442 在 Python 3.4 中修复了这个问题。

---

## 5. 总结

### 5.1 本文内容要点

本文系统地介绍了 Python 中 `try-except` 基础异常捕获机制的方方面面，以下是关键内容的回顾：

**基础概念**：
- `try-except` 是一种结构化异常处理机制，将正常逻辑与错误处理逻辑分离。
- 基本语法：`try:` 块中包含被监控的代码，`except:` 块中包含异常处理代码。

**执行流程**：
- 无异常时：`try` 块正常执行完毕，跳过所有 `except` 块。
- 有异常时：从异常抛出处立即跳转到匹配的 `except` 块，`try` 块中后续代码全部跳过。
- 嵌套规则：内层未处理的异常会向外层传播，直到找到匹配的 `except`。

**核心 API 与要点**：
- 裸 `except:` 捕获所有异常（包括 `SystemExit`、`KeyboardInterrupt`），不推荐使用。
- `except Exception:` 只捕获常规程序异常，是推荐的基础捕获方式。
- 应该尽量捕获具体的异常类型（如 `ValueError`、`TypeError`、`KeyError` 等）。
- 空 `try` 块被认为是语法错误，`try` 块中至少需要一行代码。
- 变量作用域问题：`try` 块中定义的变量对外部可见，但异常可能导致部分变量未赋值。

**常见内置异常类型**：
- `ValueError`、`TypeError`、`KeyError`、`IndexError`、`ZeroDivisionError`、`AttributeError`、`ImportError`、`FileNotFoundError`、`NameError`、`StopIteration` 等。

**最佳实践**：
- 优先使用 `except Exception:` 而非裸 `except:`。
- 尽可能捕获具体的异常类型。
- 缩小 `try` 块的范围，只包裹可能抛出异常的代码。
- 不要在 `try` 块中放置与异常无关的代码。
- 不要用异常处理替代正常的流程控制。
- 不要沉默地吞掉异常——至少记录日志。
- 在函数边界上进行异常封装。
- 理解异常的继承关系，编写正确的 except 顺序。

**底层原理**：
- 异常对象包含类型、消息参数和 traceback。
- 栈展开（Stack Unwinding）是异常传播的底层机制。
- 无异常时的 `try` 块几乎没有性能开销。
- 裸 `except:` 在字节码层面等价于 `except BaseException:`。
- Python 3.4+ 通过 PEP 442 解决了异常处理中的循环引用问题。

### 5.2 读完本文你应能掌握

读完本文后，你应具备以下可验证的能力：

1. **能正确编写基本的 `try-except` 语句**，并准确预测代码在有无异常情况下的执行路径。
2. **能区分裸 `except:` 和 `except Exception:` 的行为差异**，并能说明何时应该使用哪一个。
3. **能识别并处理至少 8 种常见内置异常**（`ValueError`、`TypeError`、`KeyError`、`IndexError`、`ZeroDivisionError`、`AttributeError`、`FileNotFoundError`、`ImportError`）。
4. **能理解嵌套 `try-except` 的异常传播规则**，并正确编写可以跨层捕获异常的结构。
5. **能避免变量作用域的陷阱**，知道在 `try` 块外安全访问变量的方式。
6. **能根据异常粒度控制的原则**，设计出合适粒度的 `try` 块，避免过大或过细。
7. **能利用异常的继承关系**编写多个 `except` 子句，并安排正确的捕获顺序。
8. **能理解栈展开的基本原理**，知道异常从抛出到被捕获的完整路径。
9. **能有意识地避免常见的错误实践**，如沉默吞掉异常、使用异常替代条件判断等。