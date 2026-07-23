---
group:
  title: 【12】函数核心机制
  order: 12
order: 11
title: global修改全局变量
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 global 声明

`global` 是 Python 的一条**编译期声明语句**,它告诉解释器:在当前函数体内,某个(或某些)名字不从局部作用域解析,而是直接指向**模块全局层**(`globals()` 字典)的名字。一旦声明了 `global x`,函数内对 `x` 的读取和赋值都会落到模块全局变量上,而不是创建一个局部变量。

这是与 LEGB 作用域规则配套的"逃生舱"。Python 默认让函数内部的赋值创建局部变量——这对绝大多数函数是合理的(函数应该是自包含的计算单元)。但当你确实需要在函数里修改一个模块级变量时,默认行为就成了障碍:你写 `x = 10`,Python 认为你想新建局部变量 `x`,根本不会去碰全局的 `x`。`global` 就是用来打破这个默认、显式指明"我就是要改全局"的语法。

```python
# 没有 global: 函数内赋值会创建局部变量,全局变量纹丝不动
count = 0

def increment():
    count = 1          # 这里的 count 是局部变量,与全局 count 无关
    print("函数内:", count)

increment()            # 函数内: 1
print("函数外:", count)  # 函数外: 0  —— 全局 count 没被改
```

```python
# 有 global: 显式声明后,赋值会修改全局变量
count = 0

def increment():
    global count       # 声明: 这个 count 指向模块全局
    count = 1          # 改的是全局 count
    print("函数内:", count)

increment()            # 函数内: 1
print("函数外:", count)  # 函数外: 1  —— 全局 count 被修改
```

两个例子的唯一区别就是 `global count` 这一行,但运行结果完全不同。理解这条声明的本质——它改变的是**名字的绑定层级**,而不是"创建一个全局变量"——是掌握 `global` 的关键。

### 1.2 为什么需要 global:读取不用,写入必须

这里有一个让很多初学者困惑的点:**读取全局变量根本不需要 `global`,只有写入(赋值)才需要**。原因是 Python 的 LEGB 规则在查找名字时,会自动向外层作用域穿透——局部(Local)→ 外层函数(Enclosing)→ 全局(Global)→ 内置(Builtin)。当你只读取 `count` 而不赋值时,Python 在局部找不到它,就顺着 LEGB 自然找到了全局的 `count`,一切正常。

但赋值的行为完全不同。Python 在**编译期**就确定了函数内每个名字是局部的还是全局的:只要函数体内有对该名字的赋值(包括 `=`, `+=`, `del`, `for` 循环变量, `with ... as`, `except ... as` 等),且没有 `global`/`nonlocal` 声明,这个名字就被标记为**局部变量**。于是在运行时,对该名字的任何访问都会去局部栈帧找;如果赋值还没执行到,就会触发 `UnboundLocalError`。

```python
config = {"debug": False}

# 读取全局: 完全没问题,不需要 global
def is_debug():
    return config["debug"]    # LEGB 找到全局 config,读取它的元素

print(is_debug())             # False
print(config)                 # {"debug": False}  —— 读取不改变全局

# 写入全局: 不声明 global 就会创建局部变量
def enable_debug_wrong():
    config = {"debug": True}  # 这是在创建局部变量 config,全局 config 没被改
    print("函数内:", config)

enable_debug_wrong()          # 函数内: {'debug': True}
print(config)                 # {'debug': False}  —— 全局没变

# 写入全局: 声明 global 后才会修改全局
def enable_debug_right():
    global config             # 声明 config 指向全局
    config = {"debug": True}  # 改的是全局 config
    print("函数内:", config)

enable_debug_right()          # 函数内: {'debug': True}
print(config)                 # {'debug': True}  —— 全局被改
```

**核心规律**:读全局靠 LEGB 自然穿透,写全局必须 `global` 声明。这条规律覆盖了 90% 的 `global` 使用场景,也是本篇要反复强调的主线。

### 1.3 最小语法形式

`global` 的语法非常简单:关键字 `global` 后跟一个或多个名字,用逗号分隔。这条语句必须放在函数体内部(顶层模块写 `global` 没有意义,因为模块顶层本来就是全局作用域)。

```python
# 语法形式
# global <名字1>
# global <名字1>, <名字2>, ...
# global <名字1>, <名字2>, ..., <名字N>

# 单个名字
def func1():
    global x
    x = 10

# 多个名字(一行声明多个)
def func2():
    global a, b, c
    a, b, c = 1, 2, 3

# 多个名字(分多行声明,效果一样)
def func3():
    global a
    global b
    global c
    a, b, c = 1, 2, 3
```

`global` 后面跟的是**名字(标识符)**,不是对象。它没有返回值,本身不创建变量,只是在编译期给名字打上"全局"的标记。这个标记只对当前函数有效,不会影响其他函数,也不会影响嵌套函数里的同名变量(嵌套函数有自己独立的作用域分析)。

### 1.4 global 在 Python 中的作用域体系中的位置

Python 的作用域体系由 LEGB 规则描述,`global` 和 `nonlocal` 是这个体系的两个"显式跳层"机制。理解 `global` 的定位,要先看全貌:

| 机制           | 作用的层级         | 关键字       | 适用场景                     |
| -------------- | ------------------ | ------------ | ---------------------------- |
| 局部赋值(默认) | 当前函数局部       | 无           | 函数内的临时变量             |
| `global`       | 模块全局层         | `global x`   | 函数内修改模块级变量         |
| `nonlocal`     | 外层函数(闭包)局部 | `nonlocal x` | 闭包内修改外层函数的局部变量 |

`global` 只能指向**模块全局层**,不能跨模块、不能指到外层函数。如果你在嵌套函数里写 `global x`,它指向的是整个模块的全局变量,而不是离你最近的外层函数的局部变量——要指后者,用 `nonlocal`。这条区分在写闭包和装饰器时尤其重要,混淆 `global` 和 `nonlocal` 是闭包代码出 bug 的常见根源。

---

## 2. 核心内容

本章详解 `global` 的完整用法:从"读不写"的反例讲起,到单变量声明、多变量声明、遮蔽问题、与可变对象配合、声明位置规则,再到反模式与替代方案。每节遵循"规则说明 → demo 演示 → 运行结果分析 → 陷阱提示"展开。

### 2.1 不声明 global 的后果:写入创建局部变量

先彻底搞清"不声明 `global` 时函数内赋值会发生什么",这是理解 `global` 存在意义的基础。

**规则**:在函数体内,只要出现对某名字的赋值(或 `del`、`for`、`with as`、`except as`、增强赋值 `+=` 等),且没有 `global`/`nonlocal` 声明,Python 就在编译期把这个名字标记为**局部变量**。这个标记发生在编译期,与赋值语句在函数里的位置无关——即便赋值在分支里没执行到,名字也已经被标记为局部。

```python
level = "INFO"

def set_level():
    level = "DEBUG"    # 编译期 level 被标记为局部
    print("函数内:", level)

set_level()             # 函数内: DEBUG
print("函数外:", level)  # 函数外: INFO  —— 全局 level 没被动
```

这里的 `level = "DEBUG"` 不是"修改全局 level",而是"新建局部变量 level 并赋值"。函数执行完毕,局部 `level` 随栈帧销毁,全局 `level` 纹丝不动。这和 C/Java 的行为不同——在那些语言里,函数内直接写 `level = "DEBUG"`(无声明)默认会改全局(除非被局部声明遮蔽)。Python 的默认是"函数内赋值即局部",这是一个有意的设计,目的是让函数尽量自包含,减少隐性副作用。

**陷阱:以为改了全局,其实只改了局部**。最常见的 bug 模式是:开发者以为在函数里 `x = ...` 就改了全局 `x`,结果外面读 `x` 发现没变,百思不解。解决方法就是加 `global` 声明——但更好的方法通常是"把状态收进类里",后面会详谈。

### 2.2 声明 global:让赋值指向模块全局

加了 `global` 声明后,该名字在当前函数内的所有读取和写入都会指向模块全局层。这是 `global` 的核心作用。

**规则**:`global x` 告诉编译器,当前函数内的 `x` 是全局名字。编译器据此把对 `x` 的访问编译成 `LOAD_GLOBAL`/`STORE_GLOBAL` 字节码(而非 `LOAD_FAST`/`STORE_FAST`),运行时直接去模块的 `__dict__` 读写。

```python
level = "INFO"

def set_level():
    global level       # 声明 level 为全局
    level = "DEBUG"    # STORE_GLOBAL: 改的是模块全局 level
    print("函数内:", level)

set_level()             # 函数内: DEBUG
print("函数外:", level)  # 函数外: DEBUG  —— 全局被修改
```

一条 `global level`,整个函数体里所有 `level` 都指向全局。声明只需要写一次,不用每个用到 `level` 的地方都重复声明。声明后,即便你只是 `print(level)`,读的也是全局的 `level`——虽然读取本来就能靠 LEGB 找到全局,但有了 `global` 声明后就更"直截了当",字节码层面直接走全局表。

**声明 global 只影响当前函数**。`global` 的作用域是"当前函数体",不会传染到别的函数,也不会传染到嵌套函数(嵌套函数有自己的独立分析)。

```python
level = "INFO"

def outer():
    global level       # outer 内 level 是全局
    level = "DEBUG"

    def inner():
        # inner 没声明 global level,这里对 level 的赋值创建的是 inner 的局部
        level = "WARN"
        print("inner 内:", level)

    inner()
    print("outer 内:", level)

outer()
print("模块级:", level)
# 输出:
# inner 内: WARN
# outer 内: DEBUG
# 模块级: DEBUG
```

`outer` 里的 `global level` 只对 `outer` 生效;`inner` 有自己独立的作用域分析,它的 `level = "WARN"` 是局部变量,既不动全局,也不动 `outer` 的"全局视角"(因为 `outer` 看到的 `level` 就是全局,而全局被 `outer` 改成了 `DEBUG`,被 `inner` 改成 `WARN` 的只是 `inner` 的局部副本)。如果想让 `inner` 也改全局,`inner` 里也要单独写 `global level`。

### 2.3 读全局不需要 global,但有个坑:UnboundLocalError

前面说过,读全局靠 LEGB 自然穿透,不需要 `global`。但有一个**经典陷阱**:在同一个函数里,既读取又赋值同一个全局名字,且没声明 `global`。编译器看到有赋值,会把名字标记为局部;于是读取时也去局部找,但赋值还没执行,就触发 `UnboundLocalError`。

```python
counter = 0

def bad_increment():
    print(counter)      # 意图读全局 counter
    counter += 1        # 这行让编译器把 counter 标记为局部
    print(counter)

bad_increment()
# UnboundLocalError: local variable 'counter' referenced before assignment
```

很多人以为这会先打印 `0`,再把全局 `counter` 加 1。实际却报错。原因:**整个函数的 `counter` 在编译期就被标记为局部**(因为 `counter += 1` 等价于 `counter = counter + 1`,有赋值),于是 `print(counter)` 也去局部找——但那时局部 `counter` 还没赋值,就报"引用了未绑定的局部变量"。

这个错误是 `global` 最常被"逼出来"使用的场景。修复有两种方式:

```python
counter = 0

# 方式一:用 global 声明,让 counter 指向全局
def good_increment_global():
    global counter
    print(counter)      # 读全局 counter
    counter += 1        # 改全局 counter
    print(counter)

good_increment_global()
# 输出:
# 0
# 1

# 方式二(更推荐): 不用全局可变状态,用返回值传递
counter = 0

def good_increment_return(c):
    return c + 1

counter = good_increment_return(counter)
print(counter)          # 1
```

方式二把"计数器"作为参数传入、把新值作为返回值传出,这是函数式风格——无副作用、易测试。能用方式二就别用方式一,这是本篇后面"最佳实践"要强调的核心建议。

### 2.4 global 声明多个名字

`global` 可以一次声明多个名字,用逗号分隔。这在需要同时修改多个全局配置时很方便。

**语法**:`global a, b, c` 等价于 `global a` + `global b` + `global c`,效果完全一致。选择哪种写法是风格问题,通常变量少时一行写完,变量多时分多行更清晰。

```python
# 模拟一个全局配置开关
debug = False
verbose = False
log_level = "INFO"

def enable_full_logging():
    # 一次声明三个全局变量
    global debug, verbose, log_level
    debug = True
    verbose = True
    log_level = "DEBUG"

enable_full_logging()
print(debug, verbose, log_level)   # True True DEBUG
```

```python
# 分多行声明,效果与一行完全相同
debug = False
verbose = False
log_level = "INFO"

def enable_full_logging_v2():
    global debug
    global verbose
    global log_level
    debug = True
    verbose = True
    log_level = "DEBUG"

enable_full_logging_v2()
print(debug, verbose, log_level)   # True True DEBUG
```

**注意**:被声明为 global 的名字如果在该函数调用前不存在于模块全局,调用函数后会被创建到模块全局(因为 `STORE_GLOBAL` 会写入 `globals()` 字典)。但如果只声明不赋值就尝试读取,会抛 `NameError`。

```python
def create_global():
    global new_flag       # 声明,但此时全局还没有 new_flag
    new_flag = True       # 赋值后才真正写入模块全局

# print(new_flag)         # NameError: 调用前访问,全局还不存在
create_global()
print(new_flag)           # True —— 函数调用后全局有了

# 只声明不赋值,读取会报错
def declare_only():
    global not_assigned
    print(not_assigned)   # 函数被调用时才报 NameError(编译期不报)

# declare_only()          # NameError: name 'not_assigned' is not defined
```

### 2.5 同名局部与全局的遮蔽

当模块全局有名字 `x`,函数内又(不声明 `global`)对 `x` 赋值时,局部 `x` 会**遮蔽**(shadow)全局 `x`。这意味着函数内看到的 `x` 是局部那份,全局那份在函数内不可见(除非用 `globals()` 显式访问)。理解遮蔽,有助于解释"为什么 `global` 必要"以及"何时会出现意外遮蔽"。

```python
x = "全局"

def shadow_demo():
    x = "局部"          # 局部 x 遮蔽全局 x
    print("函数内:", x)  # 读的是局部 x

shadow_demo()            # 函数内: 局部
print("函数外:", x)      # 函数外: 全局  —— 全局没被改
```

遮蔽本身不是错误,它是作用域规则的正常表现。但它容易和"意图改全局却忘了 `global`"的 bug 混在一起——表象都是"外面读到全局没变",但一个是"故意遮蔽,本就不该改全局",另一个是"本想改全局,误成了局部"。区分清楚目的,才能正确选用 `global`。

**显式访问全局的那份(绕过遮蔽)**。即便有局部遮蔽,也可以通过 `globals()` 字典显式访问全局那份,但这通常意味着设计有问题,更该重构。

```python
x = "全局"

def access_global_explicitly():
    x = "局部"                       # 局部遮蔽
    print("局部:", x)
    print("全局:", globals()["x"])   # 显式从 globals() 字典取全局那份

access_global_explicitly()
# 输出:
# 局部: 局部
# 全局: 全局
```

`globals()["x"]` 在任何作用域都能拿到模块全局的 `x`,即便有局部遮蔽。这是"逃生舱中的逃生舱",能帮你调试时确认"全局到底是几",但生产代码里看到这种写法,通常说明应该用 `global` 声明或重构掉全局状态。

### 2.6 global 与可变对象:原地修改不需要 global

一个常被搞混的点:如果全局变量是**可变对象**(list、dict、set),你在函数里对它做**原地修改**(in-place mutation)——比如 `config["debug"] = True`、`cache.append(x)`、`flags.add(n)`——**不需要 `global`**。原因:原地修改改的是对象内部,不是对名字重新赋值;名字仍然指向同一个对象,LEGB 找到它就能用。

```python
config = {"debug": False, "level": "INFO"}

def toggle_debug():
    # 没有 global config,但这里能改 config 的内容
    config["debug"] = True       # 原地修改 dict,不涉及名字重新绑定
    config["level"] = "DEBUG"

toggle_debug()
print(config)                    # {'debug': True, 'level': 'DEBUG'}
```

这条规律经常让新手困惑:"明明改了全局,为什么不用 `global`?" 因为这里没有对 `config` 这个名字赋值,只是通过 `config` 这个名字找到对象,再修改对象内部。LEGB 规则只管"名字解析",不管"对象内部修改";`global` 只在"对名字重新赋值"时才需要。

**对比:原地修改 vs 重新赋值**。

```python
config = {"debug": False}

# 原地修改: 不需要 global
def mutate_inplace():
    config["debug"] = True       # 改的是 config 指向的 dict 的内容
    config["level"] = "DEBUG"

mutate_inplace()
print(config)                    # {'debug': True, 'level': 'DEBUG'}

# 重新赋值: 需要 global
def reassign_global():
    global config                # 不声明就只会创建局部变量
    config = {"debug": True, "level": "DEBUG"}   # 重新绑定名字

reassign_global()
print(config)                    # {'debug': True, 'level': 'DEBUG'}
```

两种写法最终结果一样,但机制不同:`mutate_inplace` 是"通过名字找到对象,改对象内部",名字指向的对象没变(还是原来那个 dict,只是内容变了);`reassign_global` 是"让名字指向一个全新的 dict",原来的 dict 被丢弃。前者不需要 `global`,后者需要。

**陷阱:增强赋值 `+=` 对不可变对象需要 global**。`counter += 1` 看起来像"原地修改",但对 int(不可变对象)等价于 `counter = counter + 1`,是重新赋值,需要 `global`。对可变对象(如 list 的 `+=`,等价于 `extend`)则是原地修改,不需要 `global`——但要注意 `+=` 对 list 仍会触发 `STORE` 字节码,在函数内对全局 list 用 `+=` 其实需要 `global`!这是个微妙陷阱,下一节细说。

### 2.7 增强赋值与 global 的微妙关系

增强赋值运算符(`+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `&=`, `|=`, `^=`, `<<=`, `>>=`, `@=`)的语义是"读取-运算-赋值"。它对名字既有读取也有赋值,因此在函数内对全局名字用增强赋值,会被编译期标记为局部变量(如果有赋值则标记为局部),从而触发 `UnboundLocalError`(因为读取时局部还没绑定)。

**对不可变对象(int、str、tuple):增强赋值是重新赋值,需要 global**。

```python
counter = 0

def bad_increment():
    counter += 1     # 等价于 counter = counter + 1,有赋值 → 编译期标记为局部
                    # 读取 counter 时局部未绑定 → UnboundLocalError
# bad_increment()    # Uncomment: UnboundLocalError

def good_increment():
    global counter   # 声明为全局
    counter += 1     # 读取全局 counter,加 1,再写回全局

good_increment()
print(counter)       # 1
```

**对可变对象(list、dict、set):原地增强赋值仍需小心**。以 list 为例,`lst += [x]` 对 list 是原地扩展(等价于 `lst.extend([x])`),但**语法上它仍是增强赋值,有赋值动作**。在函数内对全局 list 用 `lst += [x]`,编译器仍会把 `lst` 标记为局部,从而报 `UnboundLocalError`。

```python
queue = []

def bad_append():
    queue += [1]     # 增强赋值,有赋值动作 → 编译期标记为局部 → UnboundLocalError
# bad_append()       # Uncomment: UnboundLocalError: local variable 'queue' ...

def good_append_inplace():
    queue.append(1)  # 方法调用,不是赋值 → 不需要 global,原地修改

def good_append_global():
    global queue
    queue += [1]     # 声明 global 后,增强赋值走全局

good_append_inplace()
good_append_global()
print(queue)         # [1, 1]
```

**结论**:对全局可变对象,优先用方法(`.append`, `.extend`, `.update`, `.add`)做原地修改,**不要用 `+=`**;`+=` 即便能工作(声明了 `global` 后),也比分点方法更易踩坑、更难一眼看出意图。对全局不可变对象,只能用 `global` + `+=`(或 `global` + 重新赋值)。

### 2.8 global 声明的位置规则:在使用前

`global` 声明必须出现在对该名字的**使用之前**。这里的"使用"包括读取和赋值。如果先用了名字再声明 `global`,Python 会报 `SyntaxError`。

**规则**:`global` 声明在编译期处理,它影响整个函数体内对该名字的解析。但语法上要求声明必须出现在使用之前——这是为了代码可读性,让读者在读到名字使用前就知道它是全局的。

```python
x = 10

# 正确: 声明在使用前
def ok():
    global x
    print(x)
    x = 20

# 错误: 先使用后声明
def bad():
    print(x)        # 先使用了 x
    global x        # SyntaxError: name 'x' is used prior to global declaration
    x = 20
```

实际运行上面 `bad()` 的定义就会在编译期报 `SyntaxError`,函数根本定义不出来。这条规则很硬:无论"先使用"是读取还是赋值,都算违规。

**惯例:把 `global` 声明放在函数体第一行**。这是最安全的写法,也是社区约定俗成的风格(类似把 `import` 放文件顶部)。放第一行既满足"在使用前",又让读者一进门就知道这个函数会动哪些全局状态。

```python
# 推荐风格: global 声明放在函数体开头
def update_config():
    global debug, level     # 开门见山: 本函数会改 debug 和 level 两个全局
    # ... 其他逻辑 ...
    debug = True
    level = "DEBUG"
```

### 2.9 global 在类方法中的表现

`global` 指向的是**模块全局**,不是"类全局"或"实例属性"。Python 没有"类全局"这个概念——类的属性挂在类对象上,通过 `self.x` 或 `cls.x` 访问,不通过 `global`。在类的方法里用 `global`,声明的是模块级变量,与类本身无关。

```python
module_count = 0

class Counter:
    total = 0           # 类属性,不是模块全局

    def increment_module(self):
        global module_count      # 指向模块全局 module_count
        module_count += 1

    def increment_class(self):
        Counter.total += 1       # 改类属性,不需要 global

    def increment_instance(self):
        self.count = 0           # 实例属性
        self.count += 1          # 改实例属性,不需要 global

c = Counter()
c.increment_module()
c.increment_class()
c.increment_instance()
print("模块全局:", module_count)   # 1
print("类属性:", Counter.total)     # 1
print("实例属性:", c.count)         # 1
```

**常见误解**:有人以为 `global` 可以在方法里访问"类的属性"或"实例的属性"。它不能。`global` 永远指向模块全局层,与 `self`/`cls` 毫无关系。类属性用 `类名.属性` 或 `cls.属性`(类方法内),实例属性用 `self.属性`。如果想在方法里共享"类级状态",用类属性而非模块全局,这是更内聚的设计。

### 2.10 global 与 import 的名字

模块级 `import` 进来的名字也是模块全局变量,在函数里想重新绑定它们(比如替换为另一个对象)同样需要 `global`。但如果只是读取或调用,不需要。

```python
import json

# 读取/调用:不需要 global
def parse(s):
    return json.loads(s)      # 读取全局 json,调用其方法

# 重新绑定:需要 global
def replace_json():
    global json               # 不声明只会创建局部 json
    import simplejson as json # 把全局 json 替换为 simplejson
```

这种"运行时替换模块"的做法极少用,主要在测试或兼容层里偶尔出现(比如某些库的 monkey patch)。绝大多数情况下,`import` 进来的名字当作"只读引用"即可。

### 2.11 global 与嵌套函数:global 不等于 nonlocal

在嵌套函数(闭包)场景,`global` 和 `nonlocal` 指向完全不同的层级。`global` 指向模块全局,`nonlocal` 指向外层函数的局部。混用两者是闭包代码出 bug 的常见根源。

```python
x = "模块全局"

def outer():
    x = "outer 局部"

    def use_local():
        x = "use_local 局部"    # 局部遮蔽,不动任何外层
        print("use_local:", x)

    def use_nonlocal():
        nonlocal x              # 指向 outer 的局部 x
        x = "被 nonlocal 改"
        print("use_nonlocal:", x)

    def use_global():
        global x                # 指向模块全局 x(跳过 outer 的局部)
        x = "被 global 改"
        print("use_global:", x)

    use_local()
    print("use_local 后 outer.x:", x)   # outer 局部 — use_local 没动它
    use_nonlocal()
    print("use_nonlocal 后 outer.x:", x) # 被 nonlocal 改
    use_global()
    print("use_global 后 outer.x:", x)   # 仍是 "被 nonlocal 改" — use_global 改的是模块全局

outer()
print("模块全局:", x)             # 被 global 改
# 输出:
# use_local: use_local 局部
# use_local 后 outer.x: outer 局部
# use_nonlocal: 被 nonlocal 改
# use_nonlocal 后 outer.x: 被 nonlocal 改
# use_global: 被 global 改
# use_global 后 outer.x: 被 nonlocal 改
# 模块全局: 被 global 改
```

这段代码把三种声明的效果对比得很清楚:

- `use_local` 既不声明 `global` 也不声明 `nonlocal`,它的 `x` 是纯局部,不动任何外层。
- `use_nonlocal` 声明 `nonlocal x`,改的是最近一层外层函数(`outer`)的局部 `x`。
- `use_global` 声明 `global x`,直接跳过 `outer` 的局部,改的是模块级 `x`。

**关键认知**:`global` 永远跳到模块顶层,哪怕中间隔了多层函数;`nonlocal` 只跳到最近一层有该名字的外层函数。要改"外层函数的局部",用 `nonlocal`;要改"模块全局",用 `global`。两者不可混淆。

---

## 3. 最佳实践

`global` 是一把双刃剑:它能让函数突破默认的"局部封闭",但也引入了隐性耦合和难以测试的副作用。本章讲清何时该用、何时不该用、以及如何替代。

### 3.1 能不用 global 就不用

**原则:函数应该尽量是"输入→输出"的纯计算,避免隐性副作用。** 每一个 `global` 声明都在告诉读者"这个函数会动外面的状态",这破坏了函数的自包含性——你光看函数签名不知道它依赖什么、会改什么,得读完函数体、甚至读完整个模块才能理解。

**不推荐:用 global 维护共享状态**。

```python
total = 0

def add_to_total(x):
    global total
    total += x

def get_total():
    return total

add_to_total(10)
add_to_total(20)
print(get_total())   # 30
```

这段代码的问题:

1. **测试困难**。要测 `add_to_total`,得先知道它依赖全局 `total`,并在测试前重置它。如果多个测试不重置,会相互污染。
2. **并发不安全**。多线程同时调 `add_to_total`,`total += x` 不是原子操作(`+=` 是"读-算-写"三步),会丢更新。
3. **难以追踪**。`total` 可能被任意函数改,没有任何"门禁"——谁都能动,出了 bug 不知道是哪改的。

**推荐:用返回值传递状态**。

```python
def add_to_total(current, x):
    return current + x

total = 0
total = add_to_total(total, 10)
total = add_to_total(total, 20)
print(total)   # 30
```

这样 `add_to_total` 是纯函数,易测试、线程安全(不共享可变状态)、意图清晰。状态由调用方持有,函数只负责计算。

### 3.2 如果必须共享状态,优先用类封装

当多个函数确实需要共享状态时,把状态收进类里,用实例属性或类属性组织,比散落的模块全局更内聚、更可控。

**不推荐:散落的模块全局**。

```python
user_id = None
user_name = None
user_role = None
logged_in = False

def login(uid, name):
    global user_id, user_name, logged_in
    user_id = uid
    user_name = name
    logged_in = True

def logout():
    global user_id, user_name, user_role, logged_in
    user_id = None
    user_name = None
    user_role = None
    logged_in = False

def set_role(role):
    global user_role
    user_role = role
```

四个全局变量被三个函数分别动,没有"门禁",任何代码都能直接改 `user_id`,状态容易混乱。

**推荐:用类封装状态**。

```python
class UserSession:
    def __init__(self):
        self.user_id = None
        self.user_name = None
        self.user_role = None
        self.logged_in = False

    def login(self, uid, name):
        self.user_id = uid
        self.user_name = name
        self.logged_in = True

    def logout(self):
        self.user_id = None
        self.user_name = None
        self.user_role = None
        self.logged_in = False

    def set_role(self, role):
        self.user_role = role

session = UserSession()
session.login(1, "alice")
session.set_role("admin")
print(session.user_id, session.user_name, session.user_role, session.logged_in)
# 输出: 1 alice admin True
```

类把相关状态和方法绑在一起,状态有明确的所有者(`session` 实例),方法通过 `self` 访问,不再需要 `global`。好处:可以创建多个会话(多个实例),状态隔离;测试时直接 new 一个实例,不污染全局;状态变更都经过方法,有"门禁"。

### 3.3 模块级配置:用模块属性而非 global

有一类场景特别适合模块全局:**只读配置**(一次设定后整个程序运行期间不变)。这种场景下,模块级变量当配置用是被广泛接受的,但**读取时不需要 `global`**(只读不写),`global` 只在你想"运行时改配置"时才出现——而"运行时改配置"往往不是好设计,更该用配置对象。

**不推荐:运行时用 global 改模块级配置**。

```python
# config 模块
DEBUG = False
TIMEOUT = 30

def enable_debug():
    global DEBUG
    DEBUG = True

def set_timeout(t):
    global TIMEOUT
    TIMEOUT = t
```

每次改配置都要 `global`,且任意代码都能随时改,配置的"可变性"成了隐患。

**推荐:用配置对象(类或 dataclass)**。

```python
from dataclasses import dataclass

@dataclass
class Config:
    debug: bool = False
    timeout: int = 30

config = Config()

# 需要改时,直接改 config 的属性,不需要 global
config.debug = True
config.timeout = 60
```

`config.debug = True` 是修改对象的属性,不是对名字重新赋值,所以不需要 `global`;而且配置集中在 `config` 对象里,便于传递、序列化、测试。

### 3.4 合理的 global 用法:模块级单例与缓存

并非所有 `global` 都是坏味道。有几个场景下 `global` 是合理甚至必要的:

**场景一:模块级单例的懒加载**。当某个对象应当全局唯一且懒加载(首次用到时才创建),用模块全局 + `global` 是简洁做法。

```python
_db_connection = None

def get_db():
    global _db_connection
    if _db_connection is None:
        # 首次调用时创建连接(真实代码会传连接参数)
        _db_connection = {"host": "localhost", "port": 5432, "connected": True}
    return _db_connection

print(get_db())   # {'host': 'localhost', 'port': 5432, 'connected': True}
print(get_db())   # 第二次调用返回同一个对象,不重复创建
```

这种"懒加载单例"在库代码里很常见。当然,更现代的做法是用 `functools.lru_cache` 或依赖注入容器,但 `global` + `None` 哨兵的方式足够简单,在中小项目里完全可接受。

**场景二:全局计数器/统计(单线程)**。当统计量确实属于"整个模块的全量计数",且不在多线程环境,用 `global` 计数器比分装一个类简单。

```python
_call_count = 0

def api_call(endpoint):
    global _call_count
    _call_count += 1
    # ... 调用 API ...
    return {"endpoint": endpoint, "ok": True}

api_call("/users")
api_call("/orders")
api_call("/users")
print("总调用次数:", _call_count)   # 3
```

注意:多线程下 `_call_count += 1` 不安全,要加锁或用 `itertools.count`(仍是全局,但 `count` 的 `__next__` 是原子的)。生产环境更推荐用 `collections.Counter` 或专门的指标库。

**场景三:全局特性开关(开发期临时调试)**。开发调试时加一个全局 `DEBUG` 开关,在关键函数里 `if DEBUG: print(...)` 打日志,是常见做法。注意发布前要清理这类临时全局。

```python
DEBUG = False

def process(data):
    if DEBUG:
        print("processing:", data)
    # ... 处理 ...

def enable_debug():
    global DEBUG
    DEBUG = True

enable_debug()
process("hello")   # processing: hello
```

这种用法在脚手架、原型代码里可以接受;但在正式库里,调试开关应该走日志模块(`logging.getLogger().setLevel(logging.DEBUG)`),而不是自定义全局。

### 3.5 多线程下的 global 陷阱

`global` 维护的是模块级可变状态,而多线程共享同一个模块全局。如果多个线程同时读写同一个全局变量,会出现数据竞争。`+=` 这类增强赋值对线程不安全,因为它本质是"读-算-写"三步,中间可能被打断。

```python
import threading

counter = 0

def unsafe_increment():
    global counter
    for _ in range(100000):
        counter += 1      # 不安全: 多线程下会丢更新

threads = [threading.Thread(target=unsafe_increment) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("期望 400000, 实际:", counter)   # 实际值远小于 400000,每次运行还不同
```

修复方式:用锁。

```python
import threading

counter = 0
lock = threading.Lock()

def safe_increment():
    global counter
    for _ in range(100000):
        with lock:
            counter += 1    # 加锁后原子

threads = [threading.Thread(target=safe_increment) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("期望 400000, 实际:", counter)   # 400000
```

即便加了锁,这也不是最优解——更现代的做法是用 `queue.Queue` 传递任务、用 `concurrent.futures` 管理并行、用 `threading.local()` 给每个线程独立状态,把共享可变状态降到最低。`global + lock` 是"能用"但"不优雅"的方案,只在简单脚本里可接受。

### 3.6 global 声明的可读性建议

如果决定要用 `global`,遵循以下可读性建议:

**建议一:把所有 `global` 声明放在函数体开头**。不要散落在函数中间。开头集中声明,读者一眼能看到"这个函数会动哪些全局"。

```python
# 推荐: 开头集中声明
def handle_request():
    global request_count, error_count, last_error
    # ... 逻辑 ...
    request_count += 1
    # ...
    if failed:
        error_count += 1
        last_error = "timeout"

# 不推荐: 散落声明
def handle_request_bad():
    # ... 一堆逻辑 ...
    global request_count
    request_count += 1
    # ... 又一堆逻辑 ...
    global error_count
    error_count += 1
```

**建议二:给全局变量加下划线前缀**。按 Python 约定,`_x` 表示"模块内私有",`x`(无前缀)表示"公开 API"。用 `_` 前缀能提示读者"这是内部状态,别从别处直接改"。

```python
# 约定: 模块内部状态用 _ 前缀
_internal_cache = {}
_internal_counter = 0

def get_cache(key):
    global _internal_cache, _internal_counter
    _internal_counter += 1
    return _internal_cache.get(key)
```

**建议三:一个函数的 `global` 声明不宜过多**。如果一个函数要改三四个以上全局,通常说明这个函数职责过重,或状态应该被封装。这是"代码异味",提示你重构。

### 3.7 测试中的 global:记得重置

测试涉及 `global` 的函数时,务必在每个测试前后重置全局状态,否则测试之间会相互污染。`unittest` 的 `setUp`/`tearDown` 或 `pytest` 的 fixture 适合做这件事。

```python
# 被测模块: mymod.py
# total = 0
# def add(x):
#     global total
#     total += x

# 测试: test_mymod.py
import unittest
import mymod

class TestAdd(unittest.TestCase):
    def setUp(self):
        # 每个测试前重置全局,避免相互污染
        mymod.total = 0

    def test_add_once(self):
        mymod.add(5)
        self.assertEqual(mymod.total, 5)

    def test_add_twice(self):
        mymod.add(3)
        mymod.add(7)
        self.assertEqual(mymod.total, 10)

if __name__ == "__main__":
    unittest.main()
```

如果没有 `setUp` 里的 `mymod.total = 0`,"先跑 `test_add_once` 再跑 `test_add_twice`"时,`total` 会从 5 开始累加,断言 `10` 失败。这正是全局可变状态让测试脆弱的典型例证——一旦涉及全局,测试就得操心执行顺序和状态重置。

---

## 4. 原理

本章深入 `global` 的底层机制:它在编译期如何影响字节码、被声明名字走的是什么指令、模块全局存于何处、以及为什么"先使用后声明"会报 `SyntaxError`。理解这些,才能从根上明白 `global` 为什么"声明即影响整个函数"。

### 4.1 global 是编译期指令,不是运行时语句

`global` 之所以能"声明一次影响整个函数",是因为它**在编译期就被处理**,不是运行时执行的语句。当 Python 编译器扫描函数定义时,它会做一遍"名字分析":收集函数体内对每个名字的读取和赋值,据此决定每个名字是局部的还是全局的。`global` 声明就是在这个阶段起作用——它告诉编译器"把这个名字归为全局类"。

一旦编译完成,每个名字的"局部/全局"属性就固定在字节码里了:局部的用 `LOAD_FAST`/`STORE_FAST`,全局的用 `LOAD_GLOBAL`/`STORE_GLOBAL`。运行时不再检查 `global` 声明——它已经体现在字节码指令的选择上了。

可以用 `dis` 模块查看这种区别:

```python
import dis

x = 0

def without_global():
    x = 1          # x 是局部
    print(x)

def with_global():
    global x       # x 是全局
    x = 1
    print(x)

print("=== without_global 字节码 ===")
dis.dis(without_global)
print("=== with_global 字节码 ===")
dis.dis(with_global)
```

关键差异:`without_global` 里 `x = 1` 编译成 `STORE_FAST`,读 `x` 编译成 `LOAD_FAST`,这两个指令操作的是栈帧的"快速局部数组";`with_global` 里 `x = 1` 编译成 `STORE_GLOBAL`,读 `x` 编译成 `LOAD_GLOBAL`,这两个指令操作的是模块的 `__dict__`(即 `globals()` 返回的字典)。

```python
# without_global 的核心字节码(示意,具体偏移随版本不同)
#   LOAD_CONST  1 (1)
#   STORE_FAST  0 (x)     ← 局部: 存到栈帧的 fastlocals 数组
#   LOAD_GLOBAL 0 (print)
#   LOAD_FAST   0 (x)     ← 局部: 从 fastlocals 读
#   CALL_FUNCTION 1

# with_global 的核心字节码(示意)
#   LOAD_CONST  1 (1)
#   STORE_GLOBAL 0 (x)    ← 全局: 存到模块 __dict__
#   LOAD_GLOBAL 0 (print)
#   LOAD_GLOBAL 0 (x)     ← 全局: 从模块 __dict__ 读
#   CALL_FUNCTION 1
```

`LOAD_FAST`/`STORE_FAST` 是按数组下标访问,非常快(几乎是数组索引操作);`LOAD_GLOBAL`/`STORE_GLOBAL` 要做字典查找,稍慢。这也是 Python 默认让函数内赋值创建局部变量的一个性能考量——局部访问比全局访问快得多。

### 4.2 模块全局存于模块的 **dict**

模块的全局变量存放在模块对象的 `__dict__` 属性里,这个字典也就是 `globals()` 返回的对象。`LOAD_GLOBAL`/`STORE_GLOBAL` 操作的就是这个字典。

```python
x = 10

def show_globals():
    global x
    print("globals() is module __dict__:", globals() is __dict__)   # True(模块顶层)
    print("'x' in globals():", 'x' in globals())                    # True
    print("globals()['x']:", globals()['x'])                        # 10

show_globals()

# 可以直接通过 globals() 字典读写全局(不推荐日常用,但能验证机制)
globals()['x'] = 99
print(x)   # 99 —— globals()['x'] = 99 等价于模块顶层 x = 99
```

`globals()` 返回的字典就是模块 `__dict__`,对它的修改会立即反映到全局变量,反之亦然。`STORE_GLOBAL x` 在字节码层面做的就是 `globals()['x'] = <值>`,`LOAD_GLOBAL x` 做的就是 `globals()['x']`(带 `KeyError` 时回退到 `builtins` 的逻辑)。

**这也解释了为什么 `global` 只能指向模块全局**:`STORE_GLOBAL`/`LOAD_GLOBAL` 写死的操作目标是当前模块的 `__dict__`。它没有"指向其他模块"或"指向外层函数"的能力——要指外层函数,得用 `nonlocal`(走的是另一套 `LOAD_DEREF`/`STORE_DEREF` 闭包单元机制)。

### 4.3 编译期名字分析:为什么赋值让名字变局部

Python 编译器对函数体做名字分析的规则可以概括为:

1. 扫描函数体,收集所有对每个名字的**绑定操作**(赋值 `=`、增强赋值 `+=`、`del`、`for` 循环变量、`with ... as`、`except ... as`、函数/类定义、`import`)。
2. 如果一个名字有绑定操作,且没有 `global`/`nonlocal` 声明,标记为**局部**。
3. 如果有 `global` 声明,标记为**全局**,走 `LOAD_GLOBAL`/`STORE_GLOBAL`。
4. 如果有 `nonlocal` 声明,标记为**自由变量**(闭包),走 `LOAD_DEREF`/`STORE_DEREF`。
5. 如果没有绑定操作也没声明,名字是**全局/内置引用**(读取时走 LEGB 找)。

这个分析在编译期一次性完成,结果固化在字节码里。这就是为什么"函数体内只要有赋值,整个函数里该名字都是局部"——标记发生在编译期,与赋值在哪行无关。

```python
x = 10

def read_then_assign():
    print(x)      # 这行在运行时执行,但 x 已被编译期标记为局部
    x = 20        # 这行让 x 在编译期被标记为局部
    print(x)

# read_then_assign()   # UnboundLocalError: local variable 'x' referenced before assignment
```

`print(x)` 在第一行,但它执行的瞬间,局部 `x` 还没被赋值(赋值在下一行),于是 `LOAD_FAST x` 取到的是"未绑定的局部",抛 `UnboundLocalError`。这正是编译期分析的副作用:一旦标记为局部,所有读取都走 `LOAD_FAST`,不会再回退到 LEGB 找全局。

加 `global x` 声明后,`x` 被标记为全局,`print(x)` 走 `LOAD_GLOBAL`,从模块 `__dict__` 取到 `10`;`x = 20` 走 `STORE_GLOBAL`,把 `20` 写回模块 `__dict__`。整个流程顺畅。

### 4.4 为什么"先使用后声明 global"会报 SyntaxError

前面提过,先使用名字再声明 `global` 会在编译期报 `SyntaxError`。原因是:名字分析需要先知道"这个名字是全局还是局部",才能确定用哪条字节码。如果在使用后才声明,编译器在遇到使用时还不知道这个名字的类别,无法决定用 `LOAD_FAST` 还是 `LOAD_GLOBAL`。

Python 的规则是:`global` 声明必须出现在对该名字的**任何使用**之前。这里的"使用"包括读取、赋值、`del` 等。如果不满足,编译器直接拒绝编译,报:

```
SyntaxError: name 'x' is used prior to global declaration
```

```python
x = 10

def bad():
    print(x)       # 使用在前
    global x       # 声明在后 —— SyntaxError
# 即便定义这个函数也会报错,因为 SyntaxError 在编译期就触发
```

这条规则本质上是"前向声明"要求——编译器要在一遍扫描里完成名字分析,不能回头。把 `global` 放函数开头是唯一既正确又清晰的做法。

### 4.5 LOAD_GLOBAL 的查找路径:全局 → 内置

`LOAD_GLOBAL` 的查找不只是查 `globals()` 字典,它还有一条"回退到内置"的路径。具体逻辑(以 CPython 3.10+ 优化后的 `_PyObject_LoadGlobalViaBuiltins` 为例):

1. 先在 `globals()`(模块 `__dict__`)里查名字。
2. 如果没找到,继续在 `builtins` 模块的 `__dict__` 里查。
3. 都没找到,抛 `NameError`。

这就是为什么你在函数里写 `print(...)`,即便没 `import print` 也没定义 `print`,也能调用——`print` 是内置函数,`LOAD_GLOBAL print` 先查 `globals()`(没找到),再查 `builtins`(找到 `builtins.print`),于是拿到内置 `print`。

```python
def use_builtin():
    print("hello")    # print 走 LOAD_GLOBAL,在 builtins 里找到

use_builtin()

# 但如果你在模块全局定义了同名 print,会遮蔽内置 print
print = lambda *a: None    # 模块全局多了个 print(掩盖内置)

def use_shadowed():
    print("hello")         # 现在 LOAD_GLOBAL print 先在 globals 找到,拿到的是 lambda

use_shadowed()             # 无输出(lambda 返回 None)
```

最后那段示范了一个危险现象:在模块全局放一个和内置同名的变量,会遮蔽内置。这也是为什么不要用 `list`、`dict`、`str`、`id`、`type`、`print` 等内置名作变量名——你遮蔽了内置,后续代码用到内置时行为就错了。`global` 声明并不改变这条规则,因为 `LOAD_GLOBAL` 的查找路径是固定的(全局先,内置后)。

### 4.6 模块顶层写 global 的特殊情况

在模块顶层(函数外)写 `global x`,Python 不报错,但也没任何效果——因为模块顶层本来就是全局作用域,名字本来就是全局的。这条语句会被编译器接受,但不会生成任何字节码。

```python
# 模块顶层
global x      # 合法但无意义
x = 10
```

Python 允许这么写是为了简化代码生成(有些工具生成的代码可能在顶层也带上 `global`,避免特殊处理),但手写代码里绝不应该出现——它没有任何效果,只会让读者困惑。

### 4.7 global 与函数属性的交互

函数对象本身有一个 `__globals__` 属性,指向定义该函数时所在的模块的 `__dict__`。这就是 `LOAD_GLOBAL`/`STORE_GLOBAL` 操作的目标。即便你把函数对象传到别的模块去执行,它的 `__globals__` 仍指向**定义它的模块**的全局,不是调用方模块的全局。

```python
# 模块 a.py
# x = 10
# def get_x():
#     global x
#     return x

# 模块 b.py
# import a
# x = 999
# print(a.get_x())   # 10 —— get_x 的 __globals__ 是 a 的 __dict__,不是 b 的
```

`a.get_x.__globals__` 是模块 `a` 的 `__dict__`,所以即便在 `b` 里调用 `a.get_x()`,它读到的 `x` 还是 `a` 模块里的 `x`(值 10),不是 `b` 里的 `x`(值 999)。这条规律对理解跨模块的全局变量行为很重要:`global` 永远绑定到"函数出生地"的模块,与"函数被调用的地方"无关。

---

## 5. 总结

### 5.1 本文内容要点

- **`global` 是编译期声明**,告诉解释器函数内某名字指向模块全局层,对其赋值会修改全局而非创建局部。
- **读全局不需要 `global`,写全局必须声明**。读取靠 LEGB 自然穿透到全局;赋值(以及 `+=`、`del`、`for`、`with as` 等)会触发编译期"名字分析"把名字标记为局部,从而需要在写入时显式 `global`。
- **`global` 可一次声明多个名字**:`global a, b, c`,等价于分多行声明。
- **同名局部与全局的遮蔽**:函数内不声明 `global` 直接赋值,会创建局部变量遮蔽全局,全局不受影响。
- **可变对象的原地修改不需要 `global`**:`config["k"] = v`、`lst.append(x)` 等通过名字找到对象再改对象内部,不涉及名字重新绑定。但 `+=` 对全局可变对象仍会触发"赋值动作",在函数内需谨慎。
- **`global` 声明必须在使用前**,否则编译期报 `SyntaxError`;惯例放在函数体第一行。
- **`global` 指向模块全局**,不指向类属性、实例属性、外层函数局部。改外层函数局部用 `nonlocal`,改模块全局用 `global`,两者不可混淆。
- **合理使用场景**:模块级单例懒加载、单线程计数器、开发期调试开关;但正式代码里优先用类、配置对象、依赖注入替代。
- **底层机制**:`global` 声明的名字编译成 `LOAD_GLOBAL`/`STORE_GLOBAL`,操作模块 `__dict__`;未声明的局部名字编译成 `LOAD_FAST`/`STORE_FAST`,操作栈帧的 fastlocals 数组。`LOAD_GLOBAL` 有"全局→内置"的回退查找路径。

### 5.2 读完本文你应能掌握

- 能准确判断"读取某个全局变量是否需要 `global`""修改某个全局变量是否需要 `global`",并能解释为什么。
- 能识别 `UnboundLocalError` 的成因,知道它是编译期名字分析导致的,能用 `global` 或"改用返回值"修复。
- 能区分"原地修改可变全局"与"重新赋值全局"在是否需要 `global` 上的差异,正确处理 `+=` 增强赋值的全局场景。
- 能正确使用 `global a, b, c` 声明多个全局变量,并把声明放在函数体开头的合规位置。
- 能区分 `global` 与 `nonlocal` 的指向层级,在闭包场景选用正确的关键字。
- 能识别 `global` 的反模式(散落的可变状态、多线程不安全、测试困难),并用类封装、配置对象、返回值传递等替代方案重构。
- 能用 `dis` 查看函数字节码,验证 `global` 声明是否生效(`STORE_GLOBAL`/`LOAD_GLOBAL` vs `STORE_FAST`/`LOAD_FAST`)。
- 能说明 `global` 声明如何改变字节码:被声明名字用 `LOAD_GLOBAL`/`STORE_GLOBAL` 操作模块 `__dict__`,未声明名字用 `LOAD_FAST`/`STORE_FAST` 操作栈帧局部数组,`global` 是编译期指令,模块全局存于模块 `__dict__`。
