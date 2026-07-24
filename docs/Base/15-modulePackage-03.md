---
group:
  title: 【15】模块与包管理
  order: 15
order: 3
title: __name__ 与程序入口
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 __name__

在 Python 中，**每个模块（module）对象都有一个内置属性 `__name__`**，它是一个字符串，记录"这个模块当前是以什么身份被加载的"。确切地说，`__name__` 的取值只有两种可能：

- 当这个 `.py` 文件被**直接运行**时（比如在终端 `python mymod.py`、或在 IDE 里点"运行"），解释器会把这个入口脚本当作一个特殊的模块 `__main__` 来执行，于是该模块的 `__name__` 被赋值为字符串 `"__main__"`。
- 当这个 `.py` 文件**被导入**时（`import mymod` 或 `from mymod import anything`），它的 `__name__` 被赋值为它的**模块名**（即去掉 `.py` 后缀的文件名，如 `"mymod"`；如果是包里的子模块则是 `"mypkg.mymod"` 这样的点分形式）。

也就是说，同一个文件的 `__name__` 不是固定的：你直接跑它就是 `"__main__"`，别人 import 它它就变成模块名。这种"随运行方式而变"的特性，正是 `__name__` 最有用的地方。

### 1.2 程序入口惯用法：if __name__ == "__main__":

既然 `__name__` 能区分"是被直接运行还是被导入"，程序员就利用它写出了一个经典惯用法：

```python
def main():
    # 程序的主体逻辑
    print("程序运行")

if __name__ == "__main__":
    main()
```

这段代码的语义是：**只有当本文件被直接运行时，才调用 `main()`；当本文件被别的模块 import 时，这一行不执行**。

为什么需要这个守卫？因为 Python 的模块有一个特点：导入一个模块时，该模块**顶层（不在任何函数/类里的）代码会被完整执行一次**。如果你把"启动程序的逻辑"（比如 `print`、`sys.argv` 解析、连接数据库、启动服务器）直接写在文件顶层，那么只要别人 `import mymod`，这些启动动作就会在导入的瞬间被触发——这通常不是你想要的。你希望这个文件既能"作为脚本直接跑起来启动程序"，又能"被当作库导入、复用里面的函数而不引发副作用"。`if __name__ == "__main__":` 就是用来同时满足这两个诉求的标准写法。

### 1.3 基本语法与最小示例

先看一个最小例子，直观感受 `__name__` 的两种取值：

```python
# 文件名：greet.py
print("模块加载中，我的 __name__ 是", __name__)

def greet(name):
    print(f"你好，{name}！")
```

情况一：直接运行这个文件。

```bash
python greet.py
```

```text
# 输出：
模块加载中，我的 __name__ 是 __main__
```

情况二：在另一个文件里导入它。

```python
# 文件名：use.py
import greet          # 导入时执行 greet.py 的顶层代码
greet.greet("张三")
```

```bash
python use.py
```

```text
# 输出：
模块加载中，我的 __name__ 是 greet
你好，张三！
```

同一个 `greet.py`，直接跑时 `__name__` 是 `"__main__"`，被导入时是 `"greet"`。这就验证了本节开头的结论。

加上入口守卫后，文件就变成"既能当脚本又能当库"的双重身份：

```python
# 文件名：tool.py（改进版）
def add(a, b):
    return a + b

def main():
    print(add(3, 5))

if __name__ == "__main__":
    main()
```

直接 `python tool.py` 会打印 `8`；而 `import tool` 的其他代码可以安静地使用 `tool.add(1, 2)` 而不会触发那次 `print`。

**适用场景**

任何一个"既要作为可复用模块被导入、又可能在某些情况下被直接运行"的 Python 文件，都该在写"脚本启动逻辑"时用 `if __name__ == "__main__":` 把启动逻辑包起来。典型如：命令行小工具、含自测代码的模块、可独立运行的服务入口。

**常见误区**

最常见的误解是以为"只要写了 `if __name__ == "__main__":` 这个文件就不能被 import 了"。恰恰相反——文件依然可以正常被导入，只是这块守卫里的启动代码在导入时不跑而已。文件里函数/类的定义在两种情况下都会执行，这就是它能"既当库又当脚本"的原因。

---

## 2. 核心内容

### 2.1 __name__ 的两种取值与触发条件

把 `__name__` 的取值规则用一张表说清楚：

| 运行方式 | `__name__` 的值 | 说明 |
|---------|----------------|------|
| `python mymod.py`（直接运行） | `"__main__"` | 入口脚本被当作 `__main__` 模块 |
| `python -m mymod`（以模块方式运行） | `"__main__"` | `-m` 指定的模块也被当作 `__main__` |
| `import mymod`（被导入） | `"mymod"` | 取模块名 |
| `from mypkg.sub import x`（包内模块被导入） | `"mypkg.sub"` | 取点分模块名 |
| 交互式 REPL | `"__main__"` | REPL 本身就是 `__main__` |

关键点有两个：第一，"直接运行"和"`-m` 运行"都让目标模块成为 `__main__`，区别只在于 `-m` 会事先正确设置好 `__package__` 等上下文（这点在相对导入篇详细讲过）。第二，被导入时 `__name__` 取的是"在导入系统眼中的模块全名"，不是文件 basename 那么简单——包内子模块会带上包前缀。

用代码验证 REPL 里的 `__name__`：

```python
# 在交互式解释器里
>>> __name__
'__main__'
```

```text
# 输出：
'__main__'
```

这说明交互式环境本身被视作 `__main__` 模块，你在 REPL 里直接写的顶层代码就跑在 `__main__` 里。

### 2.2 if __name__ == "__main__": 守卫的作用

这个守卫块的本质作用，是**把"脚本启动逻辑"与"模块定义逻辑"分离**。

先看一个反面例子——不写守卫会怎样：

```python
# 文件名：bad_service.py（反面教材）
import sys

def handle_request(path):
    print(f"处理请求: {path}")

# 启动逻辑直接写在顶层
print("服务启动，监听端口 8080 ...")
handle_request(sys.argv[1] if len(sys.argv) > 1 else "/")
```

现在你只想在别处复用 `handle_request`：

```python
# 文件名：test_bad.py
import bad_service   # 只想拿 handle_request 用
print("导入完成")
```

```bash
python test_bad.py
```

```text
# 输出：
服务启动，监听端口 8080 ...
处理请求: /
导入完成
```

注意：你只是 `import` 了一下，服务却"启动"了——`bad_service.py` 顶层的 `print` 和 `handle_request(...)` 在导入瞬间全执行了。这通常不是复用方想要的：它只想要那个函数，不想牵连启动一个服务。

正确写法是把启动逻辑放进守卫：

```python
# 文件名：good_service.py
import sys

def handle_request(path):
    print(f"处理请求: {path}")

def main():
    print("服务启动，监听端口 8080 ...")
    handle_request(sys.argv[1] if len(sys.argv) > 1 else "/")

if __name__ == "__main__":
    main()
```

现在 `import good_service` 只会加载函数定义，不会触发任何启动动作：

```python
# 文件名：test_good.py
import good_service
good_service.handle_request("/api/users")   # 主动调用，预期内
print("导入完成")
```

```bash
python test_good.py
```

```text
# 输出：
处理请求: /api/users
导入完成
```

再单独 `python good_service.py`，又照常启动服务。一个文件两种用法，互不干扰。这就是守卫的价值。

### 2.3 标准入口结构：main() + 守卫

工程里推荐的标准写法是：**把主体逻辑包进一个 `main()` 函数，再用守卫调用它**。这样有几个好处：

第一，`main()` 里的局部变量不会污染模块命名空间。如果把启动逻辑写在守卫块里直接平铺，那些临时变量就成了模块级名字，被 import 时虽然守卫不执行所以无影响，但代码组织上不整洁。

第二，`main()` 函数方便被单独调用与测试，比如 `python -c "from yourmod import main; main()"`，或在单测里直接 `yourmod.main()`。

第三，标准库和主流项目都这么写，保持一致便于他人阅读。

一个稍微完整的命令行工具入口：

```python
# 文件名：wordcount.py
import sys

def count_words(text):
    return len(text.split())

def main(argv=None):
    # argv 参数便于测试时传入，默认取 sys.argv
    argv = sys.argv if argv is None else argv
    if len(argv) < 2:
        print("用法: python wordcount.py <文件>")
        return 1
    path = argv[1]
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        print(f"文件不存在: {path}")
        return 2
    print(f"词数: {count_words(text)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

```text
# 输出示意（python wordcount.py sample.txt）：
词数: 42
```

这里几个细节值得学：

- `main(argv=None)` 默认用 `sys.argv`，但允许传入自定义参数，**这样 `main()` 可以被单元测试直接调用来验证逻辑**，而不必拼命令行。
- `sys.exit(main())` 把 `main()` 的返回码作为进程退出码，0 表示成功、非 0 表示出错，这是 Unix 命令行的惯例，便于脚本编排。
- 错误处理写在 `main()` 里而非守卫里，保持主流程清晰。

### 2.4 模块自测代码

`__name__ == "__main__"` 守卫还非常适合放**模块的自测代码**——那些"我想在开发时随手跑一下验证这个模块工作正常、但不想在别人导入我的模块时也执行"的断言或演示。

```python
# 文件名：mathutil.py
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

if __name__ == "__main__":
    # 自测：直接运行时执行，被导入时不执行
    assert is_prime(2) is True
    assert is_prime(4) is False
    assert is_prime(17) is True
    assert is_prime(1) is False
    print("所有自测通过")
```

直接 `python mathutil.py` 会跑这些断言并打印"所有自测通过"；`import mathutil` 时这些断言完全不执行，不会污染调用方。这种"带上自检能力的模块"在没有专门测试框架的小项目里非常实用。

正式项目里通常会改用 `pytest` 等框架，把这些断言搬到 `test_*.py` 里。但即便如此，在模块里留一小段 `if __name__ == "__main__":` 的快速演示代码，对阅读者快速理解模块用途也有帮助。

### 2.5 被 import 时不执行副作用

把"副作用"概念说清楚：所谓副作用，指模块加载时除了"定义函数、类、常量"之外，会改变外部世界或依赖外部状态的那些动作。典型的副作用包括：

- `print` 到终端、写文件、写日志
- 连接数据库、打开网络套接字
- 读取 `sys.argv`、`os.environ`、当前时间等"运行环境"
- 启动后台线程、注册单例
- 修改全局可变状态

这些动作放在模块顶层、会被 import 触发时，就是"导入副作用"。守卫的作用正是把这类副作用挡在 `__main__` 之外：

```python
# 文件名：config.py（反面：顶层副作用）
import os
import json

# 顶层就读取环境 + 解析配置文件，import 时就执行
ENV = os.environ["APP_ENV"]            # 若环境变量未设，import 直接 KeyError
CONFIG = json.load(open("config.json")) # 若文件不在，import 直接报错

def get(key, default=None):
    return CONFIG.get(key, default)
```

别的模块只是想用 `get("timeout")`，结果 `import config` 时就因为缺环境变量或配置文件崩溃了。正确做法是把"读环境/读文件"这种副作用延后到实际使用时，或放进守卫/函数内：

```python
# 文件名：config.py（改进：延后副作用）
import os
import json

def load():
    env = os.environ.get("APP_ENV", "dev")
    with open(f"config.{env}.json", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    cfg = load()
    print(cfg)
```

现在 `import config` 不会触发任何文件读取或环境依赖，只有你主动 `config.load()` 时才真正去读——副作用被推迟到了显式调用时，模块作为库的安全性与可预测性大大提升。

### 2.6 __main__.py 与 python -m

包的入口还可以用一个叫 `__main__.py` 的特殊文件来表达。当一个目录是包、且包内有 `__main__.py` 时，`python -m 包名` 会执行这个 `__main__.py`。

假设有这样一个包结构：

```
mycli/
  __init__.py
  core.py
  __main__.py
```

```python
# mycli/__main__.py
from .core import run

if __name__ == "__main__":
    run()
```

```bash
python -m mycli
```

`python -m mycli` 会以模块方式运行 `mycli` 包，等价于执行 `mycli/__main__.py`。注意 `__main__.py` 里那个 `if __name__ == "__main__":` 守卫并不是多余的——虽然 `-m` 运行时这个 `__main__.py` 的 `__name__` 确实是 `"__main__"`、守卫恒为真，但写上守卫让 `__main__.py` 也能被直接当作脚本运行，且符合统一风格。

`python -m 包` 与 `python 包/__main__.py` 有个重要区别：用 `-m` 运行时，当前工作目录会被加进 `sys.path`，并且包的 `__package__` 被正确设置，因此 `__main__.py` 里的相对导入（`from .core import run`）能正常工作；直接运行 `python 包/__main__.py` 则不会设置这些，相对导入会失败。这也是为什么"运行包入口"应优先用 `python -m`。

### 2.7 守卫的常见误用与坑

**坑一：把守卫写成函数定义的前缀**。有人把整个函数定义塞进守卫里：

```python
# 反面写法
if __name__ == "__main__":
    def helper():
        ...
    def main():
        helper()
    main()
```

这样 `helper` 和 `main` 只在直接运行时才被定义，被 import 时根本拿不到——违反了"库函数应可被复用"的初衷。守卫里只该放"启动调用"，定义应放在守卫之外。

**坑二：以为守卫里的代码被 import 时"完全不加载"**。严格说，守卫块的字节码是被加载、可被检查的，只是运行时不执行。对绝大多数人这不是问题，但要知道"未执行"与"未加载"的区别——前者是说不会跑到它，后者是连代码都没读进来，显然守卫是前者。

**坑三：守卫写成 `if __name__ = "__main__"`（单等号）**。这是初学者的笔误，单等号是赋值、不是比较，会直接语法错误。必须用 `==`。也可以写成 `if __name__ == '__main__'`，单双引号无所谓。

**坑四：在守卫里放耗时/阻塞操作但不加退出路径**。比如守卫里启动一个 `while True` 的服务循环却忘了处理 `KeyboardInterrupt`，Ctrl+C 时打印一堆栈而不够优雅。推荐：

```python
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已中断")
        sys.exit(130)
```

这样用户 Ctrl+C 时干净退出，符合 Unix 信号约定（130 = 128 + 2，2 是 SIGINT）。

**坑五：把多个不相关的启动操作堆在一个守卫里**。守卫应保持聚焦于"这一个文件作为脚本时的入口"，不要塞一堆临时实验代码后忘记清理，否则日后 import 这个模块的人（或你自己）看到守卫里一坨芜杂逻辑会困惑。实验代码请单独存放在脚本文件或测试里。

### 2.8 用 __name__ 做更灵活的运行模式分支

`__name__` 除了守卫这一个用途，还能做更细的运行模式分支。比如某些模块希望被直接运行时多打印一些调试信息、被导入时静默：

```python
DEBUG = (__name__ == "__main__")

def do_work():
    if DEBUG:
        print("调试：开始处理")
    result = 42
    if DEBUG:
        print(f"调试：结果 = {result}")
    return result

if __name__ == "__main__":
    print(do_work())
```

```text
# 输出（直接运行）：
调试：开始处理
调试：结果 = 42
42
```

被 `import` 时 `DEBUG` 为 `False`，那些 `print` 不执行。当然实际项目里更常用专门的日志库（`logging`）来控制日志级别，这里只是展示 `__name__` 可作为模式开关。

### 2.9 用 __name__ 作为模块身份做条件加载

`__name__` 不仅仅用于"是不是入口"这一个判断，它本身携带"我是谁"的信息，可以用来做更细的条件加载。一个常见场景是：某个模块在被作为子模块导入、与被作为主模块直接运行时，希望走不同的初始化分支。比如做命令行工具时，直接运行要解析 `argv`，作为库被导入则跳过：

```python
# 文件名：calc.py
import sys

def add(a, b):
    return a + b

if not hasattr(sys, "argv") or __name__ != "__main__":
    # 被导入或非主模块运行环境：只做库的初始化，不碰 argv
    _RUN_MODE = "library"
else:
    _RUN_MODE = "script"
    _argv = sys.argv[1:]

def main():
    print("运行模式:", _RUN_MODE)

if __name__ == "__main__":
    main()
```

这种按 `__name__` 分支初始化在大型项目里偶有出现，但更通用的做法仍是"把副作用收进 `main()` + 守卫"，上述写法仅作示例说明 `__name__` 可被当作运行模式信号。

### 2.10 一份既当库又当脚本的完整模板

把前面几节汇总成一份可复用的"库 + 脚本"双用途模板：

```python
# 文件名：mymod.py
"""本模块既是可复用库，也支持作为命令行脚本直接运行。"""
import sys

# —— 1. 纯函数/类定义（导入时安全，无副作用）——
def do_useful_work(x):
    """核心业务函数，无论导入还是直接运行都可被调用。"""
    return x * 2

# —— 2. 命令行封装（只解析 argv，无外部 IO 副作用）——
def parse_args(argv):
    if len(argv) < 2:
        raise SystemExit("用法: python mymod.py <数字>")
    return int(argv[1])

# —— 3. 入口 main（便于单测直接调用）——
def main(argv=None):
    argv = sys.argv if argv is None else argv
    n = parse_args(argv)
    print(do_useful_work(n))
    return 0

# —— 4. 守卫：仅作为脚本运行时才启动 ——
if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, SystemExit) as e:
        print(f"参数错误: {e}", file=sys.stderr)
        sys.exit(2)
    except KeyboardInterrupt:
        print("\n已中断", file=sys.stderr)
        sys.exit(130)
```

这份模板集中体现了本篇要点：函数定义在前、副作用延后、`main` 可测、退出码规范、信号优雅处理、守卫专注启动。

### 2.11 守卫与单元测试的协同

写好 `main()` + 守卫后，单元测试可以直接 import 这个模块、调用其函数与 `main`，而不触发任何启动副作用。举例测试上面 `mymod.py`：

```python
# 文件名：test_mymod.py
import mymod

def test_do_useful_work():
    assert mymod.do_useful_work(3) == 6

def test_main_returns_zero_on_valid_arg(capsys):
    code = mymod.main(["mymod.py", "5"])
    assert code == 0
    out = capsys.readouterr().out
    assert "10" in out

def test_main_bad_arg_exits():
    try:
        mymod.main(["mymod.py"])     # 无参数，parse_args 抛 SystemExit
        assert False, "应抛 SystemExit"
    except SystemExit:
        pass
```

测试导入 `mymod` 时，顶层的守卫块因为 `__name__` 不是 `"__main__"` 而跳过，所以不会真的 `sys.exit`、不会真的跑命令行；而 `do_useful_work`、`main` 都可用——这正是"库 + 脚本"双用途设计对测试友好之处。

---

## 3. 最佳实践

### 3.1 入口逻辑一律用 main() + 守卫，不要平铺在顶层

```python
# 推荐
def main():
    ...

if __name__ == "__main__":
    main()

# 不推荐：把启动逻辑直接平铺在模块顶层
print("启动...")
handle(sys.argv[1])
```

**原因**：平铺在顶层的代码会被 `import` 触发，导致"只想复用一个函数却被迫执行了整个脚本"。`main()` + 守卫是隔离启动副作用的标准做法，也让 `main` 可被单测直接调用。

### 3.2 main() 接受 argv 参数，便于测试

```python
# 推荐
def main(argv=None):
    argv = sys.argv if argv is None else argv
    ...

# 不推荐：main 内部直接硬读 sys.argv
def main():
    path = sys.argv[1]   # 测试时无法注入参数
```

**原因**：让 `main(argv=None)` 在缺省时回退到 `sys.argv`，但允许测试传入自定义参数列表。这样你可以在单测里 `main(["prog", "input.txt"])` 验证命令行解析逻辑，而不是去 mock `sys.argv`。这是一个小改动、大收益的可测试性习惯。

### 3.3 副作用延后到函数内，导入时只做定义

```python
# 推荐：导入时不读文件、不连库
def load_config():
    with open("config.json", encoding="utf-8") as f:
        return json.load(f)

# 不推荐：导入时就触发文件/环境依赖
CONFIG = json.load(open("config.json"))
```

**原因**：模块导入应尽可能"无副作用、无外部依赖"，这样它才能被任何环境安全 import（测试环境、文档生成工具、类型检查器、REPL 探索）。把读文件、连网络这类动作放进函数，由使用方按需调用。

### 3.4 用 sys.exit(main()) 传递退出码

```python
# 推荐
if __name__ == "__main__":
    sys.exit(main())

# 不推荐：main 返回了退出码却被丢弃
if __name__ == "__main__":
    main()
```

**原因**：`main()` 返回 0/1/2 等退出码时，用 `sys.exit(main())` 把它作为进程退出码，shell 与 CI 脚本就能据此判断成功失败。不接 `sys.exit`，进程退出码恒为 0，错误被静默吞掉。

### 3.5 模块自测放守卫里，正式测试移到测试文件

```python
# 推荐：快速自测
if __name__ == "__main__":
    assert add(1, 2) == 3
    print("自测通过")
```

**原因**：守卫里的 `assert` 适合"开发时随手跑一下"，不污染导入方。但项目长大后，断言要搬到 `test_*.py` 交给 pytest 跑——守卫里只保留一小段最有代表性的演示即可。两者不冲突，是渐进的工程演进。

### 3.6 运行包入口优先用 python -m

```bash
# 推荐
python -m mycli

# 不推荐（相对导入会失败）
python mycli/__main__.py
```

**原因**：`python -m mycli` 会在执行 `__main__.py` 前正确设置 `__package__` 与 `sys.path`，使包内相对导入生效；直接运行子文件则丢失这些上下文。所以"以包的方式运行入口"统一用 `-m`。

### 3.7 守卫只放启动调用，不放函数定义

```python
# 推荐：定义在守卫外，守卫只调用
def helper(): ...
def main(): helper()

if __name__ == "__main__":
    main()

# 不推荐：定义塞进守卫，导致 import 时拿不到函数
if __name__ == "__main__":
    def helper(): ...
    def main(): helper()
    main()
```

**原因**：把定义放进守卫会让这些名字只在直接运行时存在、被导入时消失，破坏"文件作为库"的可复用性。守卫里只该是"启动一个调用"，定义应留在模块顶层。

---

## 4. 原理

### 4.1 __name__ 从何而来：模块对象的加载过程

要理解 `__name__` 为什么这样取值，得看 Python 加载模块时发生了什么。

在 CPython 里，模块加载由导入系统（`importlib`）负责。大致流程是：查找模块源码（或已编译的字节码）→ 创建一个空的模块对象 → 把模块源码在该模块对象的命名空间里执行（即把顶层代码的 `def`/`class`/赋值结果绑定进模块的 `__dict__`）→ 把模块对象存入 `sys.modules` 缓存。其中"创建空模块对象"这步，导入系统会调用 `types.ModuleType(name)` 来构造，而构造时传入的 `name` 就成为该模块对象的 `__name__` 属性。

那么这个 `name` 是怎么决定的？关键在于"入口脚本"与"普通被导入模块"走的是不同的路径：

**入口脚本的路径**：当你执行 `python mymod.py`，CPython 启动后会准备好一个名为 `__main__` 的特殊模块对象，把 `mymod.py` 的源码在这个 `__main__` 模块的命名空间里执行。注意——此时解释器并不知道"这个文件叫 mymod"，它只是把内容塞进一个统一命名为 `__main__` 的模块里。因此该模块对象的 `__name__` 就是 `"__main__"`。这也是为什么所有直接运行的脚本，`__name__` 毫无例外都是 `"__main__"`：它们都被装载进了同一个名字叫 `__main__` 的模块对象。可以在直接运行时验证 `__main__` 这个身份：

```python
# mymod.py
import sys
print(__name__)           # __main__
print(sys.modules["__main__"] is sys.modules[__name__] and __name__ == "__main__")
```

```text
# 输出：
__main__
True
```

**普通被导入模块的路径**：当执行 `import mymod`，导入系统会以模块名 `"mymod"` 去查找 `mymod.py`，构造模块对象时 `types.ModuleType("mymod")`，于是 `__name__` 为 `"mymod"`。包内子模块 `mypkg/sub.py` 被 `from mypkg import sub` 导入时，模块名是 `"mypkg.sub"`，所以 `__name__` 就是 `"mypkg.sub"`。

一句话总结：**`__name__` 是模块对象在导入系统中的"登记名"，直接运行的入口脚本被统一登记为 `__main__`，被导入的模块登记为其导入名**。这就是两种取值的统一来源。

### 4.2 守卫为何生效：__name__ 在导入与运行时的恒等对照

理解了 `__name__` 的来源，守卫 `if __name__ == "__main__":` 的生效逻辑就显而易见了：

- 直接运行 → 入口模块的 `__name__` 是 `"__main__"` → `__name__ == "__main__"` 为 `True` → 守卫块执行。
- 被导入 → 该模块的 `__name__` 是模块名（如 `"mymod"`） → `__name__ == "__main__"` 为 `False` → 守卫块跳过。

这是一个编译期即可确定"条件"的普通 `if`，没有任何魔法——只是因为 `__name__` 这个变量在两种场景下取值不同，导致同一个 `if` 在两种场景下走向不同分支。

### 4.3 字节码视角：顶层代码如何执行、守卫如何跳过

用 `dis` 看模块顶层字节码能更具体地理解。考虑：

```python
# demo_m.py
def f():
    return 1

if __name__ == "__main__":
    print(f())
```

模块顶层（不在任何函数里的代码）会被编译成模块级字节码。简化来看，顶层大致编译为：

```
# 伪字节码
LOAD_NAME __name__
LOAD_CONST "__main__"
COMPARE_OP ==
POP_JUMP_IF_FALSE skip
LOAD_NAME print
LOAD_NAME f
CALL_FUNCTION 0
CALL_FUNCTION 1
POP_TOP
skip:
LOAD_CONST None
RETURN_VALUE
```

执行到 `POP_JUMP_IF_FALSE skip` 时，解释器检查 `__name__ == "__main__"` 的结果：如果为假（被导入场景），就跳转到 `skip` 标签，跳过 `print(f())` 那段字节码。

关键洞察有两点：

第一，**模块顶层代码在两种场景下都会被"执行到"字节码层面**——`def f` 那行无论如何都会执行（创建函数对象并绑定 `f`），`if __name__ == "__main__":` 这个判断本身也会被执行。被导入时只是判断结果为假、跳过了守卫体内的启动调用。所以"`import` 时不执行守卫内代码"准确说是"跳过守卫内的调用"，而不是"连判断都没跑"。

第二，**函数定义的 `def f` 在导入时也执行**——它创建函数对象并绑定名字，这正是 `import` 后能使用 `module.f` 的原因；而守卫里的 `print(f())` 是"调用"动作，只在判断为真时发生。这就解释了"被导入的模块仍然能用其函数、只是不启动"的现象。

### 4.4 为什么是 "__main__" 这个名字

`__main__` 是 CPython 启动时硬编码的入口模块名。解释器一启动，就在 `sys.modules` 里创建/准备一个键为 `"__main__"` 的模块对象，然后把入口脚本（或 REPL 的交互式环境、或 `python -c` 的代码、或 `python -m` 指定模块）的内容填进去执行。换言之，`__main__` 是"当前脚本所在的那一层"的统一身份标记。

这也意味着，**同一时刻只有一个模块的 `__name__` 是 `"__main__"`**——即入口那一个。即便你的程序 import 了一百个模块，也只有入口脚本的 `__name__` 是 `"__main__"`，其余都是各自的模块名。所以"是不是 `__main__`"恰好等价于"我是不是这次运行的入口"，这正是守卫想要判断的语义。

### 4.5 python -m 与直接运行对 __name__ 的统一处理

`python -m mymod` 与 `python mymod.py` 都让 `mymod` 的 `__name__` 成为 `"__main__"`，这一点是一致的——所以守卫在两种运行方式下都触发。

但 `-m` 走的是 `runpy` 模块的执行路径：`runpy` 先以 `__main__` 为名把 `mymod` 读进来执行，同时额外设置好 `__package__`、`sys.path[0]`（把当前目录加进去）等上下文。直接运行 `python mymod.py` 则是 CPython 主程序直接把脚本作为 `__main__` 加载，同样设 `__name__` 为 `"__main__"`，但不设 `__package__`（为 `None`/空）。

因此对 `__name__` 这一项两者一致，守卫都能工作；差异在于相对导入能用与否（依赖 `__package__`）——那是相对导入篇的内容。本篇只需记住："无论直接运行还是 `-m`，入口模块的 `__name__` 都是 `__main__`"，守卫统一生效。

### 4.6 sys.modules 中的 __main__ 条目

作为对原理的补充验证，可以直接观察 `sys.modules`：

```python
# 直接运行任意脚本时，在脚本内
import sys
print("__main__" in sys.modules)          # True
print(sys.modules["__main__"].__name__)   # __main__
```

```text
# 输出：
True
__main__
```

`sys.modules["__main__"]` 就是当前入口脚本对应的那个模块对象，访问它的 `.__name__` 就是 `"__main__"`。这也印证了"入口模块被登记为 `__main__`"这一事实——它就活在 `sys.modules` 的 `"__main__"` 键下。

### 4.7 ctypes/runpy 视角：入口代码的执行来源

扩展理解 `python -m` 与 `python -c` 时 `__main__` 模块内容的来历。`python -m mod` 实际上调用的是标准库 `runpy` 模块：`runpy.run_module("mod", run_name="__main__")` 它读入 `mod` 的源码，创建一个模块命名空间，把 `run_name`（即 `"__main__"`）赋给该命名空间的 `__name__`，然后在其中执行源码。`python -c "代码"` 也类似——它把那段字符串代码放进一个 `__main__` 命名的命名空间执行。理解这一点后能明白：**入口模块的 `__name__` 是由"装载者"主动设成 `__main__` 的，而非来自文件名**；普通 import 则由导入系统把模块名设进去。同一份源码在不同装载者手里获得了不同的 `__name__`。

```python
# 验证 runpy 的设定
import runpy, types
ns = runpy.run_module("json", run_name="__main__", alter_sys=False)
print(ns["__name__"])     # __main__
```

```text
# 输出：
__main__
```

注意：`runpy.run_module` 返回的是装载后产生的命名空间字典，`json` 模块的 `__name__` 在这个 run 上下文里被设成了 `"__main__"`，这正是 `-m` 的内部机制，也再次说明"入口身份 `__main__` 是装载者赋予的"。

### 4.8 reload 与 __name__ 的稳定性

`importlib.reload` 重新执行已加载模块，但**不会改变 `__name__`**——reloaded 模块的 `__name__` 仍维持它最初导入时的名字。这对调试"热重载"场景重要：一个被 import 的模块 `m`，`__name__` 始终是 `"mymod"`，无论你 reload 多少次，它永远不会变成 `__main__`，于是守卫里的启动逻辑在 reload 时同样不会误触发。可以放心在开发时热重载库模块，不必担心 reload 意外跑起入口逻辑。

```python
import importlib, mymod
print("重载前 name:", mymod.__name__)
importlib.reload(mymod)
print("重载后 name:", mymod.__name__)
```

```text
# 输出：
重载前 name: mymod
重载后 name: mymod
```

### 4.9 __main__ 与进程退出码

补一点关于 `sys.exit` 与 `__main__` 的协同原理。`sys.exit(code)` 实际是抛出 `SystemExit(code)` 异常，该异常沿调用栈向上传播。当传播到 `__main__` 模块顶层（也即解释器主循环的边界）未被捕获时，解释器捕获它、以 `code` 作为进程退出码结束。若 `code` 是整数，进程退出码 = `code & 0xFF`（0–255 区间）；若 `code` 是 `None`，退出码为 0。这就是为什么我们在守卫里写 `sys.exit(main())`：`main()` 返回的整数经 `sys.exit` → `SystemExit` → 解释器主循环 → 进程退出码，整条链是同一条，从而让"函数返回值"成为"进程退出码"。在非 `__main__` 场景（被 import），`SystemExit` 会传播到 import 方并可能中断其进程——所以**`main()` 内部绝不该自己 `sys.exit`，只应返回退出码，由守卫统一 `sys.exit`**，避免一个库函数意外终结调用者进程。

```python
# 推荐：main 只返回退出码
def main(argv=None):
    ...
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())

# 危险：main 内部 sys.exit 会在被 import 调用时炸掉调用者进程
def main():
    ...
    sys.exit(0)   # 被单测调到就整个解释器退出
```

这个原理既解释了"何以 `sys.exit(main())` 能传退出码"，也给出了"为什么 `main` 不要自带 `sys.exit`"的硬道理。

---

## 5. 总结

- 每个模块都有 `__name__` 属性：直接运行（含 `python -m`、REPL、`python -c`）时其值为 `"__main__"`，被导入时其值为模块名（包内子模块为点分全名）。
- `if __name__ == "__main__":` 守卫把"脚本启动逻辑"与"模块定义逻辑"分离：守卫里的代码只在直接运行时执行、被导入时跳过，让一个文件既能当脚本跑、又能当库被复用。
- 标准入口结构是 `def main(argv=None): ...` + `if __name__ == "__main__": sys.exit(main())`，便于测试、便于传退出码、避免顶层副作用。
- 副作用（读文件、连库、读 argv）应延后到函数内或守卫内，模块导入应无副作用、无外部依赖，这样才安全可复用。
- 模块自测代码可放守卫里随手跑，正式测试再搬到 `test_*.py` 交给框架。
- 包入口可用 `__main__.py`，配合 `python -m 包名` 运行（相对导入需 `-m` 才能生效）。
- 守卫只放启动调用、不放函数定义；用 `==` 不是 `=`；耗时/阻塞操作记得处理 `KeyboardInterrupt`。
- 原理上 `__name__` 来自模块对象加载时的登记名——入口脚本被 CPython 装进一个统一名为 `__main__` 的模块对象，被导入模块以导入名登记；同 一时刻只有一个模块是 `__main__`；守卫的字节码在导入时也会执行到判断点，只是条件为假跳过调用体，函数定义部分照常执行。
- 读完本文你应能掌握：解释 `__name__` 两种取值的来源、写出标准的 `main()` + 守卫入口结构、避免导入副作用、让入口可被单元测试直接调用、用 `python -m` 正确运行包入口，并能说清守卫在导入与运行时各自执行了什么、为什么 `__name__` 在两种场景下不同。