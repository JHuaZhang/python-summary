---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 13
title: mypy静态类型检查
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 mypy

mypy 是 Python 最主流的**静态类型检查器**(static type checker)。它读取你代码里的类型注解(以及无注解代码的推断类型),在不运行代码的前提下,检查"类型是否用对了"——传给函数的参数类型对不对、返回值类型对不对、对 `Optional`/`None` 的操作安不安全、容器元素类型是否一致,等等。发现类型不符就报错,让你在运行前就抓到类型 bug。

```python
def greet(name: str) -> str:
    return "Hello, " + name
greet(42)    # 运行时不报错(int 也能拼到 str?不,"Hello,"+42 运行时 TypeError)
# 但 greet(42) 要等运行到才崩;mypy 在运行前就报:
# error: Argument 1 to "greet" has incompatible type "int"; expected "str"
```

前三篇(09~12)讲了类型注解怎么写、怎么运行时存储。注解本身"不影响运行时"——解释器不检查,你写 `greet(42)` 运行时该崩才崩,不会因注解提前报错。注解要真正发挥"提前发现类型错误"的价值,必须配合一个**静态检查器**,而 mypy 就是这个检查器。没有 mypy(或类似工具),注解退化成"可能过时的文档";有了 mypy,注解成为"可执行的类型契约",在开发期/CI 守护类型安全。

mypy 与 Python 解释器、IDE 的关系:

- **Python 解释器(运行时)**:执行代码,不检查类型(注解对它是元数据)。
- **mypy(静态)**:独立工具,读源码做类型检查,**不运行代码**,在开发期报类型错误。
- **IDE(pyright/Pylance 等)**:编辑器内实时类型检查,基于与 mypy 类似的类型系统(微软 pyright 是另一实现,vscode 默认用 Pylance)。

```python
# mypy 检查的是"类型一致性",不运行代码
def add(a: int, b: int) -> int:
    return a + b
add(1, 2)        # mypy:OK
add(1, "x")      # mypy:报错(参数 "x" 是 str,期望 int)
add(1)           # mypy:报错(缺参数 b)
# 这些错误 mypy 都能抓,无需运行
```

为什么要用 mypy?它把大量"运行时才暴露的类型错误"前置到开发期:

- **提前发现 bug**:`greet(42)`、对 None 误操作、容器元素类型错、属性不存在等,运行前就报。据统计,Python 项目里相当比例的运行时错误本质是类型错误,mypy 能消除其中大部分。
- **类型注解生效**:没有 mypy,注解是"写给人看的";有 mypy,注解是"机器检查的契约",逼你维护注解与实现一致。
- **重构信心**:改函数签名/类型时,mypy 跨文件检查所有调用点,确保类型仍兼容——大幅降低重构引入 bug 的风险。
- **文档化**:注解 + mypy 检查,让函数签名成为可靠文档(不会因忘改而过时)。

mypy 的定位是"渐进式类型化的检查器"——它配合 Python 渐进式类型化设计:有注解的部分严格检查,无注解的部分用类型推断(或当作 `Any` 放松)。这让你能逐步给老项目加注解,mypy 逐步收紧检查,不必一次性全改。

本篇是类型注解子系列的收官篇——把 09~12 讲的注解"落地"为可执行的类型检查工作流。本篇聚焦 mypy 的**实操**:安装、基础用法、配置(`mypy.ini`/`pyproject.toml`)、严格度渐进收紧、常见错误解读、与 IDE/CI 集成、与其他检查器(pyright)对比。本篇属"工具链类"主题,按项目规范不设原理章,聚焦"怎么装、怎么配、怎么用、怎么调"。

### 1.2 静态检查 vs 运行时:为何需要 mypy

要理解 mypy 的价值,先彻底分清"静态检查"与"运行时检查"。

**运行时(解释器)**:Python 执行代码时,操作若类型不匹配才报错。`"Hello, " + 42` 运行到这一行才抛 `TypeError`(str 不能 + int)。这意味着:

- 错误**只在执行到那行**才暴露——若该路径是罕见分支(如错误处理、特定输入),可能上线很久才触发。
- 错误**只在有测试覆盖该路径**时被抓——没测到的路径,bug 潜伏到生产。

```python
def process(data):
    return data["name"].upper()    # data 是 dict 才行
process({"name": "Alice"})         # OK
process(None)                      # 运行时 TypeError(None 不可索引) —— 但要等到这行执行
process([1, 2])                    # 运行时 TypeError(list 不可 ["name"]) —— 等执行
```

`process(None)` 的错误要等运行到 `data["name"]` 才崩。若 `process` 在生产里很少被 None 调用,这个 bug 可能潜伏。

**静态检查(mypy)**:mypy 不运行代码,只读注解与实现,推理类型,检查一致性。它能在**所有路径**(不只执行的)上发现类型问题:

```python
def process(data: dict) -> str:
    return data["name"].upper()
process({"name": "Alice"})    # mypy:OK(data 是 dict)
process(None)                 # mypy:报错(None 不是 dict)
process([1, 2])               # mypy:报错(list 不是 dict)
# mypy 检查所有调用点,不论是否执行,都报类型不符
```

加了注解 `data: dict` 后,mypy 检查所有 `process(...)` 调用,`process(None)`/`process([1,2])` 都报"参数类型不符",无需运行。这是静态检查的核心优势——**覆盖所有路径,前置到开发期**。

**静态 vs 运行时的能力边界**:

- mypy 能抓:类型不匹配、Optional/None 误操作、属性不存在、签名不符、容器元素类型错等"类型层面"错误。
- mypy 抓不了:运行时才知的值(`if x > 0:` 分支)、动态特性(`getattr`、`__getattr__`、exec)、运行时数据依赖(JSON 结构)。这些靠测试与运行时检查。

```python
# mypy 抓不了(运行时值决定)
def f(x: int) -> int:
    if x > 100:             # mypy 不知运行时 x 是否>100
        return "big"        # mypy 报错(返回 str 非 int)—— 这个能抓
    return x
# mypy 能抓"返回 str 与 -> int 不符",但抓不了"x 何时>100"
```

mypy 抓"类型层面"错误(返回 str 与注解 int 不符),抓不了"运行时值层面"。理解这条边界,就理解 mypy 不能替代测试,但能消除大量类型 bug,让测试专注于逻辑而非类型。

### 1.3 mypy 速览

讲清定位前,给出 mypy 工作流的全貌速览:

```bash
# 1. 安装
pip install mypy

# 2. 基本检查:对单个或多个文件
mypy mycode.py
mypy src/

# 3. 配置(mypy.ini 或 pyproject.toml)
# [mypy]
# strict = true              # 严格模式(全开)
# disallow_untyped_defs = true   # 函数必须注解

# 4. 严格度渐进:mypy 默认宽松,可逐步收紧
mypy --strict mycode.py     # 一次性最严
# 或配置里逐项开(disallow_untyped_defs 等)

# 5. CI 集成:把 mypy 加进 CI,每次提交/PR 检查
#   - run: mypy src/
```

mypy 的核心工作流:**安装 → 运行检查 → 读错误 → 配置严格度 → CI 自动化**。mypy 默认相当宽松(只检查有注解处的明显错误),通过配置逐步收紧到严格模式(`--strict` 全开),让老项目能渐进迁移。

### 1.4 mypy 的渐进式检查策略

mypy 配合 Python 渐进式类型化,有"宽松→严格"的渐进谱系,理解这点是用好 mypy 的关键:

- **默认(宽松)**:只对有注解的代码做明显检查,无注解代码当 `Any`(不报错)。适合老项目无注解时引入——先让它跑起来不报海量错。
- **渐进收紧**:通过配置逐项开严格开关(如 `disallow_untyped_defs` 要求函数注解),逐步把"宽松放行"变"严格检查"。
- **strict(全严)**:所有严格开关全开,接近"全注解强类型"检查,适合新项目或彻底迁移后的项目。

```python
# 默认宽松:无注解函数不报
def f(x):           # 无注解,mypy 当 x 和返回都是 Any,不报
    return x + 1
# disallow_untyped_defs=true 后:报错(函数缺注解)
# def f(x: int) -> int: ...   # 必须注解
```

这条渐进谱系让 mypy 适配不同项目阶段:新项目直接 `--strict`;老项目从默认开始,逐步开严格项,边加注解边收紧。mypy 不会"一下子报几千个错让你放弃",而是陪你渐进迁移——这是它能在真实大型项目普及的关键设计。

理解了 mypy 的定位(静态检查器)、与运行时/IDE 的关系、渐进式策略这些总纲,后续章节展开安装、配置、用法、错误处理、CI 集成的实操细节。

---

## 2. 核心内容

本章详解 mypy 的安装、用法、配置、错误解读、CI 集成。每节遵循"操作 → demo → 陷阱 → 场景"展开。配置严格度、常见错误解读是重点。

### 2.1 安装与基本用法

**安装 mypy**:用 pip(项目虚拟环境内安装):

```bash
pip install mypy
# 或随开发依赖一起装:pip install mypy pytest(开发依赖)
# 验证
mypy --version
```

mypy 是独立的命令行工具,pip 安装后提供 `mypy` 命令。建议装在项目虚拟环境(随开发依赖),锁定版本(不同 mypy 版本检查行为有差异)。

**基本检查**:对 Python 文件/目录运行 mypy:

```bash
mypy mycode.py        # 检查单文件
mypy src/             # 检查目录(递归)
mypy src/ tests/      # 多目录
```

mypy 读取文件,解析注解与推断类型,输出类型错误。示例代码与典型输出:

```python
# mycode.py
def greet(name: str) -> str:
    return "Hello, " + name
def add(a: int, b: int) -> int:
    return a + b
greet(42)              # 类型错:int 传给 str 参数
add(1, "x")           # 类型错:str 传给 int 参数
add(1)                # 缺参数
```

```bash
$ mypy mycode.py
mycode.py:5: error: Argument 1 to "greet" has incompatible type "int"; expected "str"
mycode.py:6: error: Argument 1 to "add" has incompatible type "str"; expected "int"
mycode.py:7: error: Missing positional argument "b" for "add"
Found 3 errors in 1 file (checked 1 source file)
```

mypy 输出:文件名:行号 + error + 描述。第 5 行 `greet(42)` 报"参数 1 类型 int 与期望 str 不符";第 6 行 `add(1,"x")` 同理;第 7 行 `add(1)` 报"缺位置参数 b"。这些错误 mypy 全抓,无需运行代码。

**检查整个项目**:推荐对 `src/`(或主代码目录)运行,而非个别文件——mypy 跨文件分析(函数在 a.py 定义、b.py 调用,要一起检查才知调用是否类型对):

```bash
mypy src/             # 检查整个 src,跨文件分析
# 单独检查某文件可能漏跨文件错误(因其依赖的模块未一起检查)
```

⚠️ **单文件检查的局限**:mypy 跨文件分析——若只检查 `b.py`(调用方)而 `a.py`(定义方)未检查,mypy 可能不知 `a.greet` 的签名,把它当 `Any` 放松。故**检查整个项目目录**而非单文件,才能完整跨文件验证。

**退出码**:mypy 发现错误时返回非 0 退出码(CI 据此判断检查失败):

```bash
mypy src/ && echo "类型检查通过"
# 有错误时 mypy 返回非0,&& 不执行 echo
# CI 用退出码决定流水线是否失败
```

mypy 无错误返回 0,有错误返回非 0。CI 据此让"类型检查失败"中断流水线。

### 2.2 配置:mypy.ini 与 pyproject.toml

mypy 的行为通过配置文件控制——严格度、忽略的模块、按模块规则等。配置文件有三种载体:`mypy.ini`(专用)、`pyproject.toml`(现代统一)、`setup.cfg`(老式)。

**mypy.ini(专用,传统)**:

```ini
# mypy.ini
[mypy]
# 全局严格度
python_version = 3.10
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True

# 按模块覆盖:对某些模块放松(如第三方库无 stub)
[mypy-some_legacy_lib.*]
ignore_missing_imports = True

[mypy-tests.*]
disallow_untyped_defs = False    # 测试代码放松注解要求
```

`[mypy]` 是全局配置节,可设严格度开关等。`[mypy-模块名.*]` 是按模块覆盖(对特定包放松/收紧)。`ignore_missing_imports` 忽略无类型 stub 的第三方库导入警告。

**pyproject.toml(现代,推荐)**:

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true

[[tool.mypy.overrides]]      # 按模块覆盖(pyproject 语法)
module = "some_legacy_lib.*"
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

`[tool.mypy]` 是 pyproject 的 mypy 配置节。`[[tool.mypy.overrides]]` 是按模块覆盖(数组,每个 override 一个 module + 规则)。现代项目用 pyproject.toml 统一管理工具配置(含 mypy/pytest/black/ruff 等),避免多配置文件散乱。**推荐用 pyproject.toml**。

**常用配置项速查**:

| 配置项 | 作用 | 默认 |
|--------|------|------|
| `python_version` | 假设的目标 Python 版本 | 推断 |
| `disallow_untyped_defs` | 函数必须注解参数与返回 | false |
| `disallow_incomplete_defs` | 部分注解的函数报错 | false |
| `check_untyped_defs` | 检查无注解函数体 | false |
| `warn_return_any` | 警告返回 Any | false |
| `warn_unused_ignores` | 警告无用的 `# type: ignore` | false |
| `warn_redundant_casts` | 警告冗余 cast | false |
| `strict` | 严格模式(全开) | false |
| `ignore_missing_imports` | 忽略无 stub 的导入 | false |
| `no_implicit_optional` | `x: T = None` 不自动转 Optional | false(3.11+ true) |

`strict = true` 等价开启一组严格项(下节详)。`ignore_missing_imports` 对第三方库无类型 stub 时有用(否则 mypy 报"找不到模块 stub")。

**配置生效**:mypy 自动在当前目录及父目录找配置文件(`mypy.ini`/`pyproject.toml`/`setup.cfg`)。也可 `mypy --config-file <path>` 显式指定。配置文件的 `[mypy]` 全局节 + `[mypy-mod.*]` 覆盖节共同决定行为。

### 2.3 严格度:从宽松到 strict

mypy 的核心魅力是渐进式严格度——从默认宽松逐步收紧到 strict(全严)。这节讲清各严格开关,以及如何渐进迁移。

**--strict(一次性全严)**:`--strict` 开启一组严格开关,接近"全注解强类型":

```bash
mypy --strict src/
# 等价开启:
# disallow_untyped_defs(函数必注解)
# disallow_incomplete_defs(部分注解报错)
# check_untyped_defs(查无注解函数体)
# disallow_untyped_decorators(装饰器必注解)
# no_implicit_optional(不自动 Optional)
# warn_return_any(警告返回 Any)
# warn_unused_ignores(警告无用 type:ignore)
# warn_redundant_casts(警告冗余 cast)
# strict_equality(警告不可能相等的比较)
# 等十余项
```

`--strict` 适合新项目(从一开始严格)或彻底迁移后的项目。它会报所有"缺注解""Any 渗透""冗余"等,逼你写完整注解。

**逐项严格(渐进迁移)**:老项目不要直接 `--strict`(会报海量错让人放弃),而逐项开严格,边加注解边收紧:

```ini
# 第一阶段:只开基础严格
[mypy]
check_untyped_defs = true        # 检查无注解函数体(报明显错)
warn_unused_ignores = true       # 清理无用 type:ignore

# 第二阶段:要求注解(项目注解覆盖率提高后)
disallow_untyped_defs = true     # 新函数必须注解
disallow_incomplete_defs = true  # 不能部分注解

# 第三阶段:全严(接近 strict)
warn_return_any = true
no_implicit_optional = true
# ...逐步加到接近 strict
```

渐进迁移策略:从 `check_untyped_defs`(报明显错,不改注解)开始,逐步加 `disallow_untyped_defs`(要求注解,可能需补大量注解),最后到 strict。每阶段让 mypy 通过,再开下一项,避免一次性海量错。

**关键严格开关详解**:

```python
# disallow_untyped_defs:函数缺注解报错
def f(x):           # 报错!缺注解
    return x
def f(x: int) -> int: ...   # OK

# disallow_incomplete_defs:部分注解报错
def f(x: int, y):    # 报错!y 和返回未注解(部分注解)
    return x + y
def f(x: int, y: int) -> int: ...   # OK(全注解)

# check_untyped_defs:检查无注解函数体(报体内明显错)
def f(x):           # 无注解,但
    return x + 1    # check_untyped_defs 报?不,x 是 Any,x+1 当 Any 不报
    # 但若体内有明显类型错(如对 Any 调不存在方法),可能报

# no_implicit_optional:x: T = None 不自动转 Optional
def f(x: int = None): ...   # 旧:自动转 Optional[int]=None(隐式)
# no_implicit_optional=true 后:报错!int 默认 None 矛盾,要显式 Optional[int]|None
def f(x: int | None = None): ...   # OK(显式)

# warn_return_any:警告返回 Any
def f() -> int:
    return json.loads("1")   # json.loads 返回 Any,warn_return_any 报"返回 Any 但注解 int"
```

这些开关各有侧重:`disallow_untyped_defs`/`disallow_incomplete_defs` 强制注解完整性,`check_untyped_defs` 深入无注解函数体,`no_implicit_optional` 取消隐式 Optional(3.11+ 已默认),`warn_return_any` 防 Any 渗透到返回值。逐项理解,按项目阶段开启。

**strict 的完整清单**:`--strict` 实际开启(可用 `mypy --help | grep strict` 看全列表):disallow_any_generics, disallow_subclassing_any, disallow_untyped_calls, disallow_untyped_defs, disallow_incomplete_defs, check_untyped_defs, disallow_untyped_decorators, no_implicit_optional, warn_redundant_casts, warn_unused_ignores, warn_return_any, no_implicit_reexport, strict_equality, extra_checks 等。这是一套"类型安全最大化"的组合,新项目直接用最省心。

**实践建议**:

```bash
# 新项目:直接 strict(从第一行代码就严格)
mypy --strict src/
# 配置:strict = true

# 老项目:渐进
# 1. 默认跑,看错误量(可能因无注解而几乎不报)
# 2. 开 check_untyped_defs(报体内错),修
# 3. 开 disallow_untyped_defs(要求注解),逐步给函数加注解
# 4. 最终开 strict
```

理解 mypy 的渐进谱系(默认宽松 → 逐项 → strict),就掌握"如何让 mypy 适配项目不同阶段"——新项目 strict 起步,老项目渐进迁移,避免一次性海量错。

### 2.4 常见错误解读与修复

mypy 报的错误初看抽象,理解常见模式才能快速修复。这节列举高频错误及其修复。

**错误一:参数类型不匹配**——最常见:

```python
def greet(name: str) -> str: ...
greet(42)
# mypy: error: Argument 1 to "greet" has incompatible type "int"; expected "str"
# 解读:greet 参数 1 期望 str,传了 int
# 修复:传 str(greet(str(42))),或改函数签名(若 greet 应接受 int|str)
```

修复方向:要么调用方传对类型,要么函数签名该接受更多类型(若设计如此)。判断"是调用错还是签名错"——按真实意图修。

**错误二:返回类型不匹配**:

```python
def f(x: int) -> int:
    if x > 0:
        return "positive"    # mypy: error: Incompatible return value type (got "str", expected "int")
    return x
# 解读:函数注解返回 int,某分支返回 str
# 修复:该分支返回 int(return x),或改返回类型(-> int | str)
```

某分支返回与注解不符。修复:统一返回类型(各分支返回注解类型),或调整注解(若确实多类型,用 `int | str`)。

**错误三:对 Optional/None 误操作**(呼应第 10 篇):

```python
def f(user: dict | None) -> str:
    return user["name"]
    # mypy: error: Value of type "dict | None" is not indexable
# 解读:user 可能是 None,None 不可索引
# 修复:先判 None
def f(user: dict | None) -> str:
    if user is None:         # 收窄 user 为 dict
        return "guest"
    return user["name"]      # mypy 知此处 user: dict,允许索引
```

`dict | None` 上直接 `["name"]` 报"None 不可索引"。修复:先 `is None`/`is not None` 判(收窄),再操作。这是 Optional 安全的标准检查,mypy 强制你处理 None 分支。

**错误四:属性不存在**:

```python
class User:
    name: str
u = User("Alice")
print(u.nme)    # mypy: error: "User" has no attribute "nme" (拼写错)
# 解读:User 没有 nme 属性(应是 name)
# 修复:改正拼写 u.name
# 价值:mypy 抓拼写错的属性名,运行时 pytest 才发现
```

mypy 抓"属性拼写错"(运行时才 AttributeError 的)。这是静态检查抓"属性不存在"的典型,IDE(pyright)也能实时抓。

**错误五:缺注解(disallow_untyped_defs)**:

```python
def add(a, b):       # mypy: error: Function is missing a type annotation
    return a + b
# 解读:disallow_untyped_defs 开启,函数缺注解
# 修复:加注解 def add(a: int, b: int) -> int: ...
```

严格模式下缺注解报错。修复:补全参数与返回注解。

**错误六:部分注解(disallow_incomplete_defs)**:

```python
def f(x: int, y):    # mypy: error: Function is missing a type annotation for one or more arguments
    return x + y
# 解读:部分参数注解(x 注了,y 没注)
# 修复:全注解 def f(x: int, y: int) -> int: ...
```

部分注解报错(要么全注要么全不注,部分易误导)。修复:注全。

**错误七:返回 Any(warn_return_any)**:

```python
import json
def get_num() -> int:
    return json.loads("1")    # mypy: error: Returning Any from function declared to return "int"
# 解读:json.loads 返回 Any,赋给 -> int 报"返回 Any"
# 修复:显式校验/转换
def get_num() -> int:
    data = json.loads("1")
    if isinstance(data, int):    # 收窄 Any → int
        return data
    raise TypeError
```

`warn_return_any` 防 Any 渗透到返回值。修复:在返回前 isinstance/cast 把 Any 收窄为注解类型。

**错误八:无 stub 的第三方库**:

```python
import some_lib    # mypy: error: Library stubs not installed for "some_lib"
# 或: error: Cannot find implementation or library stub for module named "some_lib"
# 解读:some_lib 无类型 stub(第三方库未提供类型信息)
# 修复方案:
# 1. 装 stub 包:pip install types-some-lib(若有官方 stub)
# 2. 忽略该库:配置 [mypy-some_lib.*] ignore_missing_imports = True
# 3. 用 mypy --ignore-missing-imports(全局忽略,粗放)
```

第三方库无 stub 时报错。修复:装 stub 包(`types-xxx`)、或配置忽略该库、或全局 `ignore_missing_imports`(不推荐全局,会掩盖所有缺失)。优先按库忽略(只放过确无 stub 的)。

**错误九:list 等容器元素类型不匹配**:

```python
def process(nums: list[int]) -> int:
    return sum(nums)
process([1, 2, "x"])     # mypy: error: List item 2 has incompatible type "str"; expected "int"
# 解读:list[int] 但传了含 str 的列表
# 修复:传纯 int 列表,或改签名 list[int | str]
```

容器元素类型不符。修复:传对元素,或调整容器注解。

**错误十:不可达/冗余**:

```python
def f(x: int) -> int:
    if x > 0:
        return x
    elif x <= 0:        # mypy(部分场景):冗余(else 已涵盖),或相关警告
        return -x
# strict_equality:警告不可能相等的比较
if isinstance(x, int) and isinstance(x, str): ...  # 不可能同时,警告
```

strict 的 `warn_redundant_casts`(冗余 cast)、`strict_equality`(不可能相等)等抓"代码冗余/不可能"。这些是代码质量警告,修复按提示。

理解这十类高频错误的模式与修复方向,就能快速解读 mypy 输出。核心心法:**看错误描述的类型(期望 vs 实际),判断是调用方错、签名错、还是缺收窄**,按真实意图修(改调用/改签名/加 isinstance 收窄)。

### 2.5 type:ignore、cast 与 stub 处理

有些情况 mypy 报错但你知道代码是对的(mypy 推断局限),或第三方库无类型信息——这节讲如何处理这些"mypy 误报或局限"场景。

**`# type: ignore`——抑制单行错误**:

```python
import some_lib
result = some_lib.do_thing(42)    # type: ignore    # mypy 不报这行(some_lib 无 stub)
# 或针对特定错误码
result = some_lib.do_thing(42)    # type: ignore[import-untyped]
```

`# type: ignore` 行尾注释让 mypy 忽略该行的类型错误。可加错误码(如 `[import-untyped]`)只忽略特定错误,更精确(避免忽略其他真错误)。用于:mypy 误报、无 stub 第三方库调用、动态特性。

⚠️ **`type: ignore` 的风险**:它无条件忽略该行所有类型错误——若该行有真类型 bug,也被掩盖。故:

```python
# 坏:无差别 ignore,掩盖所有
result = lib.do(x)    # type: ignore
# 好:指定错误码,只忽略该错误,其他真错误仍报
result = lib.do(x)    # type: ignore[no-untyped-call]
# 配置 warn_unused_ignores=true:无用的 type:ignore 报警(删除冗余的)
```

配 `warn_unused_ignores = true`——若某 `type: ignore` 实际没忽略任何错误(mypy 已不报),报警提示删除(避免冗余 ignore 掩盖未来真错误)。这是保持 ignore 卫生的关键配置。优先用错误码精确 ignore,而非无差别。

**`cast(T, x)`——类型断言(回应第 10 篇)**:

```python
from typing import cast
data: dict = {"name": "Alice"}
# mypy 不知 data["name"] 是 str(dict 值是 object),但你确知
name = cast(str, data["name"])    # 告诉 mypy 当 str
print(name.upper())               # mypy 当 str,允许 upper
# 注:cast 不运行时验证(只是静态断言),错则运行时崩
```

`cast(目标类型, 值)` 告诉 mypy"把这个值当目标类型",不做运行时验证。用于"你确知类型但 mypy 推断不出"的场景(如 dynamic dict 取值、C 扩展返回)。比 `type: ignore` 更精确(收窄到具体类型而非全放行),但仍不如 isinstance(后者运行时验证)。

**`# type: ignore` vs `cast` vs `isinstance`**:

- `isinstance(x, T)`:运行时验证 + mypy 收窄。最安全(运行时也查),适合"不确定类型需验证"。
- `cast(T, x)`:仅静态断言,不运行时验证。适合"确知类型但 mypy 不知",比 ignore 精确。
- `# type: ignore`:忽略整行类型检查。最粗放,用于"mypy 误报/无 stub/动态特性",尽量少用、配错误码用。

```python
# 优先级:isinstance(最安全) > cast(精确断言) > type:ignore(粗放)
# 能 isinstance 就不 cast,能 cast 就不 ignore
```

**stub 文件(.pyi)——给无类型库补类型**:第三方库无类型信息时,可写 `.pyi` stub 文件提供类型声明:

```python
# some_lib.pyi(stub 文件,只含类型声明无实现)
def do_thing(x: int) -> str: ...
class Helper:
    def method(self) -> int: ...
```

`.pyi` 与 `.py` 同名,mypy 优先读 `.pyi`(类型声明)。你可为无类型库写 stub 放项目内(或 `types-xxx` 包发布)。stub 适合"常用无类型库需类型检查"——比 `ignore_missing_imports` 更优(提供真实类型供检查)。但写 stub 工作量大,仅对核心库值得。

**`reveal_type`——调试类型推断**:mypy 提供特殊函数 `reveal_type` 探查推断类型:

```python
# mycode.py
def f(x):
    reveal_type(x)        # mypy 输出:Revealed type is "Any"(或具体类型)
    return x
# 运行 mypy:mycode.py:2: note: Revealed type is "Any"
# reveal_type 不影响运行(运行时 NameError,故只在 mypy 检查时用,发布前删)
```

`reveal_type(x)` 让 mypy 输出它推断的 x 类型——调试类型推断问题("mypy 为何把 x 当 Any?")的利器。注意 reveal_type 运行时未定义(只在 mypy 上下文),故发布前删除(或用 `typing.reveal_type` 3.11+)。

理解 `type: ignore`/`cast`/`isinstance`/stub/reveal_type 各自的用途与优先级,就掌握"处理 mypy 局限与误报"的工具集——优先精确工具(isinstance/cast/错误码 ignore),避免无差别放行。

### 2.6 增量检查、缓存与性能

大型项目 mypy 检查可能慢(几十秒)，影响开发体验。mypy 提供增量检查与缓存机制加速。

**增量检查(默认)**:mypy 默认启用增量检查——只重新分析改动的文件，复用之前结果：

```bash
mypy src/                # 首次全量，慢
# 改了一个文件
mypy src/                # 增量，只分析改动文件及其依赖，快
```

mypy 默认把缓存存到 `.mypy_cache/`（项目内，应 .gitignore 忽略），下次复用未改文件的分析结果。增量检查让"改一个文件重跑 mypy"快很多（只重算影响范围）。

**dmypy（守护进程）**：mypy 的守护进程模式，常驻内存，更快：

```bash
dmypy run -- src/          # 首次启动守护进程并检查
dmypy run -- src/          # 复用进程，增量，更快(省了启动开销)
dmypy restart              # 重启守护(配置变更时)
dmypy kill                 # 停止守护
```

`dmypy` 是 mypy 的守护进程版——分析结果常驻内存，省去每次启动 mypy 的开销（加载模块、读 stub 等）。频繁重跑 mypy 的开发场景（如保存即检查），dmypy 比每次冷启动 mypy 快几倍。适合 IDE/编辑器集成。

**缓存目录与清理**：

```bash
# 缓存默认 .mypy_cache/(项目内)
# .gitignore 加 .mypy_cache/(不提交)
# 清理缓存(推断异常时):rm -rf .mypy_cache/
# 或 mypy --no-incremental(不增量,每次全量,慢但干净)
```

`.mypy_cache/` 应加入 .gitignore（不提交缓存）。偶发"mypy 报错不一致"（缓存损坏），`rm -rf .mypy_cache/` 清理重跑。

**性能调优**：

- `--fast-module-lookup`：加速模块查找。
- 减少检查范围（只查 src/，不查 tests/vendor/）。
- 用 dmypy 守护模式（频繁检查场景）。
- 拆分大模块（mypy 单文件分析开销随文件规模）。

**CI 中的缓存**：CI 每次干净环境，缓存丢失，mypy 慢。可缓存 `.mypy_cache/`：

```yaml
# GitHub Actions 缓存 mypy
- uses: actions/cache@v3
  with:
    path: .mypy_cache
    key: mypy-${{ runner.os }}-${{ hashFiles('**/requirements*.txt') }}
```

CI 缓存 `.mypy_cache/` 加速增量检查（虽 CI 通常全量，但缓存命中后增量快）。理解增量/cache/dmypy 机制，控制大型项目 mypy 性能。

### 2.7 CI 集成与 IDE 配合

mypy 的价值在"持续检查"——CI 自动跑、IDE 实时提示。这节讲 CI 与 IDE 集成。

**CI 集成（GitHub Actions 示例）**：

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.10"
      - run: pip install mypy
      - run: mypy src/             # 类型检查,失败则 CI 失败
      # 或带配置:mypy --config-file pyproject.toml src/
```

CI 流水线加 typecheck job——mypy 有错误返回非 0，CI 失败，阻止合并。这让"类型检查"成为 PR 合并的门禁，保证主分支类型安全。

**pre-commit 集成（提交前检查）**：

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        args: [--strict]
        additional_dependencies: [types-requests]   # 额外 stub 依赖
```

pre-commit 在 `git commit` 时跑 mypy，有错误阻止提交。比 CI 更早（提交前而非推送后），及时止损。配 mypy 到 pre-commit，让类型错误"进不了仓库"。

**IDE 集成（VSCode/Pylance）**：VSCode 默认用 Pylance（基于 pyright）做实时类型检查，编辑器内即时红波浪线+错误提示。mypy 与 pyright 都是类型检查器，但实现不同：

- **pyright/Pylance**：微软实现，VSCode 默认，速度快，实时检查，编辑器体验优。检查规则与 mypy 略有差异（部分更严或更松）。
- **mypy**：Python 官方生态主流，命令行/CI 用，规则成熟，社区文档多。

```json
// VSCode settings.json:可让 Pylance 模仿 mypy 严格度,或禁用 Pylance 用 mypy 插件
{
  "python.analysis.typeCheckingMode": "strict",   // Pylance 严格模式
  // 或装 mypy 插件用 mypy 检查
}
```

实践：VSCode 用 Pylance 实时检查（快、体验好），CI 用 mypy（成熟、统一）。两者规则尽量对齐（都用 strict 级别），避免"编辑器通过 CI 失败"或反之。偶有规则差异，以 CI 的 mypy 为准（CI 是门禁）。

**mypy 与 pyright 的差异与选择**：

| 方面 | mypy | pyright |
|------|------|---------|
| 实现语言 | Python | TypeScript(快) |
| 实时检查 | 弱(命令行为主) | 强(VSCode 集成) |
| CI 常用 | 是(主流) | 也支持 |
| 严格度可配 | 细(disallow_* 项) | 模式(basic/strict) |
| 社区/文档 | 多(官方生态) | 微软维护 |

选择：**命令行/CI 用 mypy（主流、文档多），VSCode 编辑器用 Pylance（实时体验）**，两者配合。纯 pyright 也行（CI 也跑 pyright），但 mypy 更普遍。按团队习惯，关键是"CI 有类型检查门禁 + 编辑器实时提示"。

**综合工作流**：

```bash
# 开发时:VSCode + Pylance 实时提示(改错即时红波浪)
# 提交时:pre-commit 跑 mypy(阻止类型错进仓库)
# CI:GitHub Actions 跑 mypy src/(门禁,失败不合并)
# 全程类型守护:编辑器→提交→CI 三层
```

理解 CI（门禁）+ pre-commit（提交前）+ IDE（实时）三层类型守护，就建立了完整的 mypy 工作流——类型错误在编辑、提交、CI 三个环节都被拦截，最大化类型安全。这是大型 Python 项目类型工程的标准实践。

---

## 3. 最佳实践

### 3.1 新项目 strict 起步,老项目渐进迁移

```bash
# 新项目:直接 strict(从第一行严格)
# pyproject.toml: [tool.mypy] strict = true
# 老项目:渐进
# 阶段1 check_untyped_defs → 阶段2 disallow_untyped_defs → 阶段3 strict
```

新项目用 `strict = true` 一开始就严格（避免技术债）。老项目不能直接 strict（海量错），按 `check_untyped_defs`→`disallow_untyped_defs`→`strict` 渐进，每阶段让 mypy 通过再开下一项，边加注解边收紧。避免一次性海量错让人放弃。

### 3.2 配置放 pyproject.toml,统一管理工具

```toml
# pyproject.toml(统一 mypy/pytest/ruff/black 配置)
[tool.mypy]
strict = true
python_version = "3.10"
[[tool.mypy.overrides]]
module = "legacy.*"
ignore_missing_imports = true
# 不要用分散的 mypy.ini/setup.cfg
```

用 `pyproject.toml` 的 `[tool.mypy]` 统一管理（与 pytest/ruff 等同放），避免多配置文件散乱。按模块覆盖用 `[[tool.mypy.overrides]]`。现代项目标准实践。

### 3.3 检查整个项目目录,而非单文件

```bash
mypy src/          # 推荐:跨文件分析完整
# mypy a.py        # 避免:单文件可能漏跨文件错误(依赖模块未一起检查)
```

mypy 跨文件分析（函数 a.py 定义、b.py 调用），单文件检查可能不知依赖签名而放松。检查整个 src/ 才完整验证跨文件类型。CI 也跑 src/ 整体。

### 3.4 type:ignore 配错误码精确忽略,warn_unused_ignores 卫生

```python
result = lib.do(x)    # type: ignore[no-untyped-call]   # 精确:只忽略该错误
# result = lib.do(x)  # type: ignore                     # 粗放:掩盖所有,避免
```

`type: ignore` 配错误码（`[xxx]`）只忽略特定错误，避免无差别掩盖真 bug。开 `warn_unused_ignores = true` 让"无用 ignore"报警（mypy 已不报的 ignore 提示删除），保持 ignore 卫生。少用裸 ignore。

### 3.5 优先 isinstance > cast > type:ignore 处理 mypy 局限

```python
# 1 isinstance(运行时验证 + 收窄,最安全)
if isinstance(x, str): ...
# 2 cast(静态断言,不运行时验证,精确)
name = cast(str, data["name"])
# 3 type: ignore(忽略整行,粗放,最后手段)
result = lib.do(x)  # type: ignore[xxx]
```

处理"mypy 不知/误报"按安全度选：isinstance（运行时也验证，最安全）> cast（静态断言，比 ignore 精确）> type:ignore（粗放，最后手段）。能 isinstance 就不 cast，能 cast 就不 ignore。

### 3.6 第三方库无 stub 装官方 stub 或按库忽略

```toml
# 1 装官方 stub(优先):pip install types-requests
# 2 按库忽略(确无 stub)
[[tool.mypy.overrides]]
module = "some_lib.*"
ignore_missing_imports = true
# 避免全局 ignore_missing_imports(掩盖所有缺失)
```

第三方库无类型 stub 报错。优先装官方 stub 包（`types-xxx`，如 types-requests），或按库 `ignore_missing_imports`。避免全局 `ignore_missing_imports`（掩盖所有缺失，新引入库的 stub 缺失也不报）。

### 3.7 函数全注解,避免部分注解

```python
# 推荐:全注解
def f(x: int, y: int) -> int: ...
# 避免:部分注解(disallow_incomplete_defs 报错,且易误导)
# def f(x: int, y): ...
```

函数要么全注解（参数+返回）要么全不注，部分注解（`disallow_incomplete_defs` 报错）易误导（看起来注解了但漏了）。全注解是 strict 基本要求。

### 3.8 Optional 严格判 None,防运行时 None 操作 bug

```python
def f(user: dict | None) -> str:
    if user is not None:      # mypy 强制收窄
        return user["name"]
    return "guest"
# 不要直接 user["name"](mypy 报 None 不可索引)
```

mypy 对 Optional 强制"判 None 后再操作"——利用这点消除对 None 的运行时误操作 bug。这是 mypy 最有价值的能力之一，配合 `no_implicit_optional`（不自动 Optional，显式声明可空）效果最佳。

### 3.9 reveal_type 调试类型推断,发布前删除

```python
def f(x):
    reveal_type(x)   # mypy 输出推断类型,调试用
    return x
# 发布前删 reveal_type(运行时未定义),或用 typing.reveal_type(3.11+)
```

mypy 推断异常时用 `reveal_type(x)` 探查它推断的类型，调试"为何当 Any/为何报错"的利器。注意 reveal_type 运行时 NameError，发布前删除（或用 3.11+ `typing.reveal_type` 安全版）。

### 3.10 CI 加类型检查门禁,pre-commit 提交前止损

```yaml
# CI 门禁(失败不合并)
- run: mypy src/
# pre-commit(提交前阻止类型错进仓库)
# .pre-commit-config.yaml 配 mirrors-mypy
```

CI 加 mypy job 作门禁（有类型错 CI 失败、不合并），pre-commit 在 `git commit` 时跑 mypy（提交前止损）。两层守护让类型错误进不了主分支/仓库。这是类型工程的标准门禁实践。

### 3.11 编辑器用 Pylance 实时提示,CI 用 mypy 门禁,规则对齐

```json
// VSCode Pylance 严格模式
{"python.analysis.typeCheckingMode": "strict"}
// CI mypy strict
```

VSCode 用 Pylance（pyright）实时类型提示（编辑器体验优），CI 用 mypy（成熟主流）门禁。两者规则对齐（都 strict 级别），避免"编辑器过 CI 失败"差异。偶有 pyright/mypy 规则差异，以 CI 的 mypy 为准。

### 3.12 dmypy 加速频繁检查,大型项目控性能

```bash
dmypy run -- src/      # 守护进程,复用内存,频繁检查快
# CI 不需 dmypy(每次干净环境),开发频繁重跑用
```

大型项目频繁重跑 mypy 慢，用 `dmypy` 守护进程（常驻内存省启动开销）加速。CI 不用（干净环境无复用），开发场景（保存即检查/手动重跑）用 dmypy。配合增量 cache（`.mypy_cache/`）控制性能。

### 3.13 缓存 .mypy_cache 入 .gitignore,异常时清理

```bash
# .gitignore: .mypy_cache/
# 推断不一致(缓存损坏):rm -rf .mypy_cache/ && mypy src/
```

`.mypy_cache/` 加 .gitignore（不提交）。偶发 mypy 报错不一致（缓存损坏），`rm -rf .mypy_cache/` 清理重跑。CI 可缓存 `.mypy_cache/` 加速增量（配 actions/cache）。

### 3.14 mypy 不替代测试,聚焦类型层面 bug

```python
# mypy 抓类型层(返回 str 与 -> int 不符)
def f(x: int) -> int:
    if x > 0: return "big"   # mypy 报(返回 str)
    return x
# mypy 抓不了逻辑层(x 何时 >0、业务对错)—— 靠测试
```

mypy 抓"类型层面"错误（类型不匹配、None 误操作、属性不存在），抓不了"逻辑层面"（业务对错、运行时值）。mypy 不替代测试，二者互补：mypy 消除类型 bug，测试验证逻辑。理解边界，不期望 mypy 抓所有 bug。

---

## 4. 总结

### 4.1 本文内容回顾

- **mypy 定义**:Python 主流静态类型检查器,读注解与推断类型,不运行代码报类型错误;让注解从"文档"升级为"可执行类型契约",前置类型 bug 到开发期。
- **静态 vs 运行时**:运行时执行到才报、只覆盖执行路径;mypy 静态覆盖所有路径、前置开发期;抓类型层面(类型不匹配/None/属性/容器元素),不抓逻辑层/动态特性。
- **安装与用法**:`pip install mypy`、`mypy src/`(查目录跨文件分析)、退出码非0表有错(CI 门禁)。
- **配置**:pyproject.toml `[tool.mypy]`(推荐统一),或 mypy.ini;全局严格度 + `[[tool.mypy.overrides]]` 按模块覆盖;常用项 `disallow_untyped_defs`/`check_untyped_defs`/`warn_return_any`/`ignore_missing_imports`/`strict`。
- **严格度渐进**:默认宽松(无注解当 Any)→ 逐项开(check_untyped_defs → disallow_untyped_defs → …)→ strict(全严);新项目 strict 起步,老项目渐进迁移避免海量错。
- **常见错误**:参数/返回类型不匹配、Optional 误操作(判 None 收窄)、属性不存在、缺/部分注解、返回 Any、无 stub 第三方库、容器元素类型、冗余/不可能。解读"期望 vs 实际",判断调用错/签名错/缺收窄。
- **局限处理**:`# type: ignore[错误码]` 精确抑制(配 warn_unused_ignores)、`cast(T,x)` 类型断言(比 ignore 精确)、stub 文件(.pyi 补类型)、`reveal_type` 调试推断;优先级 isinstance > cast > type:ignore。
- **性能**:增量检查(默认,.mypy_cache 缓存)、dmypy 守护进程(频繁检查加速)、CI 缓存 .mypy_cache、清理缓存治推断异常。
- **CI/IDE 集成**:CI(GitHub Actions)加 mypy job 门禁、pre-commit 提交前止损、VSCode 用 Pylance(pyright)实时提示;CI 用 mypy 主流成熟、编辑器用 Pylance 体验优,规则对齐(都 strict);三层守护(编辑→提交→CI)。
- **mypy vs pyright**:mypy(Python 实现、CI 主流、配置细);pyright(微软、TS 实现快、VSCode 集成强);实践 CI mypy + 编辑器 Pylance。
- **最佳实践**:新项目 strict 起步老项目渐进、配置放 pyproject.toml、查整个目录、type:ignore 配错误码、isinstance>cast>ignore 优先级、无 stub 装官方 stub 或按库忽略、函数全注解、Optional 严格判 None、reveal_type 调试发布前删、CI 门禁 + pre-commit、Pylance+mypy 规则对齐、dmypy 控性能、缓存入 gitignore、mypy 不替代测试。

### 4.2 读完本文你应能掌握

- 说明 mypy 的定位(静态检查器)与"注解需配 mypy 才生效"的关系,区分静态检查与运行时检查的能力边界。
- 安装 mypy,对项目目录运行检查,读懂 "文件:行号 error 描述" 输出与退出码。
- 用 pyproject.toml 配置 mypy(全局严格度 + 按模块覆盖),设置常用项(disallow_untyped_defs/check_untyped_defs/warn_return_any/strict 等)。
- 按项目阶段选择严格度:新项目 strict 起步,老项目从 check_untyped_defs 渐进到 strict,避免一次性海量错。
- 解读并修复十类常见错误(参数/返回不匹配、Optional 误操作、属性不存在、缺注解、返回 Any、无 stub、容器元素等),判断改调用/签名/收窄。
- 用 `# type:ignore[错误码]`/`cast`/stub/reveal_type 处理 mypy 局限与误报,按 isinstance>cast>ignore 优先级选用。
- 用增量检查/dmypy 控制 mypy 性能,清理缓存,CI 缓存加速。
- 集成 mypy 到 CI(门禁)、pre-commit(提交前)、配合 VSCode Pylance(实时),建立三层类型守护。
- 阐述 mypy 与 pyright 的差异与选择,理解 mypy 不替代测试(聚焦类型层)。

### 4.3 延伸方向

- **类型注解全套**:mypy 检查的基础是注解,注解写法见《类型注解基础》《Union 与 Any 类型》《TypeVar 泛型》《类型注解运行时行为》(09~12)。
- **pyright/Pylance**:微软的另一个类型检查器,VSCode 默认集成,规则与 mypy 略异,深入对比与配置。
- **类型 stub 生态**:`typeshed`(官方 stub 仓库)、`types-xxx` 包、自定义 `.pyi` stub 编写,为无类型库补类型。
- **进阶 mypy**:插件机制(mypy plugins,如对 SQLAlchemy/Django 的类型支持)、`@overload`、`Protocol`、`TypedDict` 在 mypy 下的检查行为。
- **类型工程实践**:大型项目渐进迁移策略、类型覆盖率提升、类型与测试/重构的协作、团队类型规范制定。
