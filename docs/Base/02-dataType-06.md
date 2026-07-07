---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 6
title: bool类型与短路逻辑
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 bool 类型

`bool` 是 Python 中表示真值(truth value)的内置类型——它只有两个实例:`True`(真)和 `False`(假)。`bool` 用于一切"非此即彼"的判断:开关是否打开、用户是否登录、列表是否为空、文件是否存在、密码是否正确。`if`/`while`/`and`/`or`/`not` 等所有条件逻辑,最终都归结为对 `bool` 值的求值。

```python
flag = True
done = False
print(type(flag))          # <class 'bool'>
print(isinstance(True, int))  # True —— bool 是 int 的子类,见 1.4
```

`bool` 看似简单(只有两个值),但它承载着两个易被低估的特性,理解它们是写好 Python 条件逻辑的关键:

**第一,真相值测试(truthiness)——任何对象都能被判真假。** 在 Python 里,`if`/`while` 的条件不要求是 `bool`,任何对象都能放进布尔语境被判真假。`if [1,2]:`(非空列表为真)、`if "name":`(非空字符串为真)、`if 0:`(0 为假)都合法。Python 定义了一套"什么算真、什么算假"的规则,这是 `bool` 类型向整个对象体系的延伸,使得条件判断极其灵活。

**第二,短路逻辑(short-circuit evaluation)——`and`/`or` 不一定返回 bool。** `a and b`、`a or b` 这两个运算符不仅在"决定真假的逻辑",还在"返回哪个操作数",且会按需短路(不评估多余的操作数)。`x or default`、`x and y` 返回的是 `x` 或 `y` 本身,不一定是 `True`/`False`。这是 Python 条件表达式最强大也最易踩坑的特性——`or` 常用于设默认值、`and` 用于链式调用前置条件。

本篇要系统讲透 `bool`(作为类型)与布尔运算(短路、真值测试、比较)的全部内容:`True`/`False` 字面量、`bool()` 显式构造、真相值测试规则、`and`/`or`/`not` 的短路行为与返回值、比较运算符(含 `==` vs `is`、链式比较)、`bool` 是 `int` 子类的全部后果,以及实战中的惯用法与陷阱。这是写好 Python 条件逻辑的根基。

### 1.2 真值测试:Python 条件逻辑的核心

要理解 `bool`,首先要理解"真值测试"(truth value testing)——Python 在需要真值的地方(如 `if`/`while` 条件、`and`/`or`/`not` 操作数)如何把任意对象转成真/假。

**核心规则**:以下值被判定为**假(falsy)**,其余全部为**真(truthy)**:

- 常量:`False`、`None`。
- 数值零:`0`(int)、`0.0`(float)、`0j`(complex)、`0`(其他数值类型)。
- 空容器/序列:`''`(空字符串)、`[]`(空列表)、`{}`(空字典)、`()`(空元组)、`set()`(空集合)、`range(0)`。

```python
# 这些为假(falsy)
print(bool(False))      # False
print(bool(None))       # False
print(bool(0))          # False
print(bool(0.0))        # False
print(bool(0j))         # False
print(bool(''))         # False —— 空字符串
print(bool([]))         # False —— 空列表
print(bool({}))         # False —— 空字典
print(bool(()))         # False —— 空元组
print(bool(set()))      # False —— 空集合

# 这些为真(truthy)
print(bool(True))       # True
print(bool(1))          # True —— 非0
print(bool(-1))         # True —— 负数也真(非0即真)
print(bool(0.001))      # True
print(bool('hello'))    # True —— 非空字符串
print(bool([0]))        # True!非空列表,哪怕元素是0
print(bool([False]))    # True!非空,哪怕元素是 False
print(bool({'a': 0}))   # True —— 非空字典
```

⚠️ **最重要的易错点**:容器只看"空/非空",不看元素内容。`bool([0])` 为 `True`(列表非空),`bool([False])` 也为 `True`(列表非空)——哪怕元素本身是假值。新手常误以为"`[0]` 含 0 应该为假",正确答案是:容器非空即真。同理 `bool('0')` 为 `True`(字符串 `'0'` 非空,字符 `'0'` 不是数字零)。

这条规则让条件判断极其简洁优雅:

```python
# 判断列表是否非空,直接 if lst,不用 if len(lst) > 0
def process(items):
    if items:              # 非空才处理(比 if len(items) > 0 简洁)
        ...

# 判断字符串非空
if name:                   # name 非空字符串
    print(name)

# 判断是否为 None 或空,合二为一
def greet(name=None):
    if not name:           # name 是 None 或 '' 都为假
        name = "陌生人"
```

`if items:`、`if name:`、`if not name:` 这种写法是 Python 的惯用法,比 `if len(items) > 0`、`if name != ''`、`if name is not None and name != ''` 简洁得多。但要注意 `if not name:` 会把 `None` 和 `''` 一起判假——若你只想判 `None` 不想判空串,要用 `if name is None:`(语义不同,见 §3)。

### 1.3 布尔运算符:and、or、not

Python 有三个布尔运算符:`and`(与)、`or`(或)、`not`(非)。它们的基础逻辑符合直觉,但有两个关键特性:短路求值、返回操作数本身(非 bool)。

```python
print(True and False)    # False
print(True and True)     # True
print(True or False)     # True
print(False or False)    # False
print(not True)          # False
print(not False)         # True
print(not 0)             # True —— not 也接受任意对象,0 为假故 not 0 为真
```

**`not`**:一元运算符,返回**真正的 bool**(`True`/`False`),是唯一保证返回 bool 的布尔运算符。`not x` 等价于 `not bool(x)`——把 x 判真假后取反。`not` 优先级最高,低于比较运算符。

**`and`/`or`**:二元运算符,**短路求值**且**返回操作数本身**(不一定是 bool)。这是它们最需要透彻理解的特性,§2 会详述。简言之:

- `a and b`:若 `a` 为假,返回 `a`(短路,不评估 `b`);若 `a` 为真,返回 `b`。
- `a or b`:若 `a` 为真,返回 `a`(短路,不评估 `b`);若 `a` 为假,返回 `b`。

```python
print(0 and 5)           # 0 —— 0 为假,短路返回 0,不评估 5
print(3 and 5)           # 5 —— 3 为真,返回 5
print(3 or 5)            # 3 —— 3 为真,短路返回 3,不评估 5
print(0 or 5)            # 5 —— 0 为假,返回 5
print('' or 'default')   # 'default' —— '' 为假,返回 'default'
```

`and`/`or` 返回操作数本身而非 bool,这一特性催生了 Python 最优雅的惯用法:`a or default`(设默认值)、`a and b`(链式前置条件)。§2.3 会展开这些惯用法。

**优先级**:`not` > `and` > `or`,都低于比较运算符(`==`/`<`/`in` 等)。故 `a == b and c == d` 不需括号(比较优先于 and)。但复杂表达式仍建议括号明确:

```python
print(not True or False)     # False —— (not True) or False = False or False
print(True and not False)    # True
print(1 < 2 and 3 > 1)       # True —— 比较优先,and 最后算
```

### 1.4 bool 是 int 的子类

`bool` 是 `int` 的子类,`True == 1`、`False == 0`。这是 Python 沿袭 C 语言"真值即整数(0/1)"约定的设计,理解它才能理解许多 bool 行为:

```python
print(True == 1)          # True
print(False == 0)         # True
print(isinstance(True, int))  # True —— bool 是 int 子类
print(issubclass(bool, int))  # True
print(True + True)        # 2 —— bool 当 int 参与算术
print(True * 5)           # 5
print(sum([True, True, False, True]))  # 3 —— 计数为真的项
```

这条继承关系的影响:

- **bool 可参与 int 算术**:`True + 1 == 2`、`sum([True, False, True]) == 2`。这让"统计满足条件项数"极简洁:`sum(n > 0 for n in nums)`(详见 §2.7)。
- **类型判断的陷阱**:`isinstance(True, int)` 为 `True`,故 `if isinstance(x, int)` 会把 `True`/`False` 也判为 int。需区分时要先判 bool(详见 §3、§4.4)。
- **索引/切片可用 bool**:`lst[True]` 等价 `lst[1]`(因 True==1),虽合法但极不推荐——可读性差,易混淆。
- **`True`/`False` 是单例**:全解释器只有一个 `True`、一个 `False`,可用 `is` 判(`x is True`)。

这条"`bool` 即 `int`"的设计,是 Python 类型系统的一个有意选择,带来便利(True 可当 1 算)也带来陷阱(isinstance 渗透)。§4 会详述其内部实现与设计取舍。

理解了真值测试、短路逻辑、bool 即 int 这三点,Python 的条件逻辑就掌握了。后续章节逐一展开每个 API 的细节与场景。

---

## 2. 核心内容

本章详解 `bool` 类型与布尔运算的全部用法。每节遵循"规则 → demo → 陷阱 → 场景"展开。短路逻辑与返回值、比较运算符、`bool` 即 int 的后果是重点,因为它们的细节最易踩坑。

### 2.1 True、False 字面量与 bool() 构造

`True`/`False` 是两个特殊的常量字面量——它们看着像标识符,实则是语言保留的关键字常量,值与类型固定。

```python
print(True)            # True
print(type(True))      # <class 'bool'>
print(False)           # False
print(type(False))     # <class 'bool'>
```

⚠️ **大小写必须严格**:`True` 不能写 `true`/`TRUE`,`False` 不能写 `false`。C/Java/JavaScript 背景的人极易写 `true`/`false`,在 Python 里全部是 `NameError`(被当成未定义的变量名):

```python
# print(true)        # NameError: name 'true' is not defined
# print(false)       # NameError
# print(NULL, null)  # NameError(None 是 Python 的,不是 null)
print(True, False)    # ← 正确写法,首字母大写
```

`True`/`False` 是单例常量,不可被赋值覆盖(Python 3 中它们是关键字):

```python
# True = 1           # SyntaxError: 不能给关键字赋值
# False = 0          # SyntaxError
print(True is True)   # True —— 单例,身份比较
```

**`bool()` 构造函数**:把任意对象转为 `True`/`False`,等价于"对该对象做真值测试":

```python
print(bool(0))          # False —— 0 为假
print(bool(42))         # True —— 非0为真
print(bool(""))         # False —— 空字符串为假
print(bool("hi"))       # True —— 非空为真
print(bool([]))         # False —— 空列表为假
print(bool([0]))        # True —— 非空为真
print(bool(None))       # False
print(bool(0.0))        # False
print(bool(object()))   # True —— 任意自定义对象默认为真
```

`bool(x)` 就是把 x 按 §1.2 的规则判真假,返回 `True`/`False`。它常用于"显式"地把对象转 bool(如 `return bool(result)` 明确函数返回 bool),或在需要 bool 值的语境里强制转换。但多数场景下,Python 会**隐式**做真值测试(`if x:` 自动判 x 真假),你不必显式写 `bool(x)`——`if x:` 比 `if bool(x):` 更地道。

**从其他类型构造 bool**:

```python
print(bool(0))          # 从 int
print(bool(0.0))        # 从 float
print(bool(""))         # 从 str
print(bool([]))         # 从 list
print(bool(None))       # 从 None
# 等价关系
print(bool(x) == (x 的真值))  # bool() 即真值测试
```

注意 `bool(0)` 与 `bool(0.0)`、`bool('')` 都为 `False`——零值、空容器统一为假。这条统一性让"判空"逻辑跨类型一致:`if not container:` 对 list/dict/str/set/tuple 都生效。

### 2.2 真值测试的完整规则与 __bool__/__len__

§1.2 给出了真值测试的规则,这里讲清其**底层实现**——Python 如何决定一个对象为真为假。规则按优先级:

1. 若对象定义了 `__bool__` 方法,真值 = `bool(obj.__bool__())`。这是最直接的"自定义真值"方式。
2. 否则若定义了 `__len__` 方法,真值 = `len(obj) != 0`(长度非0即真,0 即假)。这覆盖所有内置容器(list/str/dict/set/tuple)——它们为空(长度0)即假。
3. 否则,默认为真(任意对象若无 `__bool__`/`__len__`,恒为真)。

```python
# 内置容器靠 __len__:空(长度0)为假
print(bool([]))          # False —— len([])==0
print(bool([1]))         # True —— len==1

# 自定义对象默认为真(无 __bool__/__len__)
class Empty: pass
print(bool(Empty()))     # True —— 默认真

# 定义 __bool__ 自定义真值
class Box:
    def __init__(self, items):
        self.items = items
    def __bool__(self):
        return len(self.items) > 0   # 有内容才为真

print(bool(Box([])))     # False —— __bool__ 返回 False
print(bool(Box([1])))    # True
```

定义 `__bool__` 让自定义类能精确控制"什么情况下算真/假"。常见用途:表示"集合/状态"的类(如 `Box`、`Buffer`、`Connection`)定义 `__bool__` 表"是否有内容/是否激活",这样 `if my_buffer:` 就能简洁判断。

⚠️ **`__bool__` 必须返回 bool**,否则 `bool(obj)` 会抛 `TypeError`:

```python
class Bad:
    def __bool__(self):
        return 1          # 错!必须返回 True/False(bool)
# bool(Bad())            # TypeError: __bool__ should return bool, returned int
class Good:
    def __bool__(self):
        return True       # 正确,返回 bool
```

`__len__` 优先级低于 `__bool__`——若同时定义两者,`__bool__` 生效。这条规则解释了为何"空容器为假"——它们没定义 `__bool__`,但定义了 `__len__`,空时 len==0 故为假。

理解 `__bool__`/`__len__` 的优先级,就理解了真值测试的底层,也能自定义类的真值行为。

### 2.3 短路逻辑:and、or 的返回值与短路(重点)

这是 `bool` 类型的核心难点,也是最强大的特性。`and`/`or` 两个运算符有两个关键行为:**短路求值**(按需评估)、**返回操作数本身**(不一定是 bool)。

**`and`(与)**:

```python
print(0 and 5)           # 0 —— 0 为假,短路返回 0,5 未被评估
print(3 and 5)           # 5 —— 3 为真,返回 5(评估并返回右操作数)
print(3 and 0)           # 0 —— 3 为真,返回 0
print(3 and 5 and 7)     # 7 —— 多个 and,全真返回最后一个
print(0 and 5 and 7)     # 0 —— 遇到第一个假(0)短路,返回 0
```

`a and b` 规则:**若 `a` 为假,返回 `a`(短路,不评估 `b`);若 `a` 为真,返回 `b`**。逻辑是"and 要求全真,遇到假即可定结论,返回那个假值;都真则返回最后一个"。

**`or`(或)**:

```python
print(3 or 5)            # 3 —— 3 为真,短路返回 3,5 未被评估
print(0 or 5)            # 5 —— 0 为假,返回 5
print(0 or '' or 7)      # 7 —— 多个 or,前两个为假,返回第一个真 7
print(3 or 0 or 5)       # 3 —— 遇到第一个真(3)短路,返回 3
```

`a or b` 规则:**若 `a` 为真,返回 `a`(短路,不评估 `b`);若 `a` 为假,返回 `b`**。逻辑是"or 要求任一真,遇到真即可定结论,返回那个真值;都假则返回最后一个"。

**返回操作数本身,而非 bool**——这是 `and`/`or` 与其他语言的最大差异:

```python
print('' or 'default')   # 'default' —— '' 为假,返回 'default'(不是 True!)
print('x' or 'default')  # 'x' —— 'x' 为真,返回 'x'
print(0 or None)         # None —— 0 为假,返回 None
print(1 and 'hello')     # 'hello' —— 1 为真,返回 'hello'
```

`'' or 'default'` 返回 `'default'` 字符串本身,不是 `True`。这一特性是 Python 惯用法的基石:

**惯用法一:`a or default`(设默认值)**——这是 `or` 最常见的用法,极其优雅:

```python
# 传统:if 判断设默认
def greet(name):
    if name is None:
        name = "陌生人"
    return f"Hello, {name}"

# or 惯用法:一行搞定
def greet(name):
    name = name or "陌生人"   # name 为 None/'' 时,用默认值
    return f"Hello, {name}"
print(greet(None))            # Hello, 陌生人
print(greet("Alice"))         # Hello, Alice
print(greet(""))              # Hello, 陌生人('' 也为假,被替换)
```

⚠️ 注意 `name or default` 会把 `None` 和 `''` 都判假替换——若你想"仅 None 替换、空串保留",要用 `if name is None:` 而非 `or`。语义不同,按需选。

**惯用法二:`a and b`(链式前置条件/安全访问)**——`and` 用于"前一个为真才取下一个",常做防御性链:

```python
# 链式安全访问(类似 && )——a 为真才评估 b
obj = None
result = obj and obj.method()    # None 为假短路,返回 None,不调 method(避免 AttributeError)
print(result)                    # None —— 安全,没报错

# 配置存在才用
config = {}
value = config and config.get("key")   # {} 为假?不,非空 dict 为真
# 注意:空 dict {} 为假!故上面的 {} 会短路返回 {}
empty_cfg = {}
val = empty_cfg and empty_cfg.get("key")  # {} 为假,短路返回 {}
print(val)                                 # {}
```

⚠️ 上例揭示一个陷阱:**空容器 `{}`、`[]`、`''` 为假**,故 `config and config.get(...)` 在 config 为空容器时会短路返回空容器本身(而非进入 get)。`and` 安全访问只对"None 或 falsy 但非容器"的对象可靠;对可能为空容器的对象,更稳妥的是显式 `if config is not None:` 或用 `getattr`/`.get` 等无副作用访问。这条要警惕。

**惯用法三:三目运算符 `a if cond else b`**——当 `or`/`and` 不够清晰时,用显式三目:

```python
# 三目运算符(Python 的条件表达式)
label = "成年" if age >= 18 else "未成年"
# 比 or 链清晰,推荐用于"二选一"
```

`a if cond else b` 是 Python 的条件表达式(三目),比 `cond and a or b`(旧式技巧,有 cond 为假时 a 为假值的陷阱)更清晰可靠,**优先用三目而非 `and/or` 模拟三目**。

**短路求值的副作用价值**——短路不只是"返回值",还"不评估多余操作数",这能避免副作用(如避免对 None 调方法、避免昂贵的计算):

```python
# 短路避免副作用:None.method() 会报错,短路让 None 不被评估
data = None
if data is not None and data.ready():   # data 为 None 时短路,不调 ready()
    process(data)

# 短路避免昂贵计算
def expensive_check():
    print("昂贵检查执行了")
    return True
cheap = False
if cheap and expensive_check():   # cheap 为 False 短路,expensive_check 不执行
    ...
# 不会打印"昂贵检查执行了" —— 短路省掉了开销
```

把"廉价检查放前、昂贵检查放后"是利用短路的性能优化技巧。理解短路"不评估多余操作数",就能用它规避副作用与省性能。

### 2.4 not 运算符

`not` 是一元布尔运算符,取反。它有两个与 `and`/`or` 不同的关键特性:**始终返回真正的 bool**、**优先级最高**。

```python
print(not True)          # False
print(not False)         # True
print(not 0)             # True —— 0 为假,not 0 为真
print(not 1)             # False —— 1 为真,not 1 为假
print(not []))           # False —— [] 非空为真,not 为假
print(not "")            # True —— 空串为假,not 为真
```

`not x` 等价于 `not bool(x)`——先把 x 判真假,再取反,结果恒为 `True`/`False`(bool)。这与 `and`/`or` 返回操作数本身不同——`not` 是唯一保证返回 bool 的布尔运算符。

**`not` 优先级高于 `and`/`or`**,但低于比较运算符:

```python
print(not True or False)      # False —— (not True) or False = False or False
print(not (True or False))    # False —— 括号先算 or 得 True,not 得 False
print(not 1 == 1)             # False —— 1==1 先算得 True,not 得 False(等价 not (1==1))
print(True and not False)     # True —— not False 得 True,True and True
```

`not 1 == 1` 是 `not (1 == 1)`(比较优先),不是 `(not 1) == 1`。这条优先级让人偶尔困惑,复杂表达式建议加括号。

**`not` 的常见用法**——判"为空/为假":

```python
# 判空:not items(等价 not bool(items))
if not items:           # items 为空(None/[]/'' 等都触发)
    print("无数据")

# 判不存在
if key not in d:        # not in 是组合运算符
    d[key] = default

# 取反布尔变量
done = False
if not done:            # 未完成
    ...
```

⚠️ **避免 `if not x == y`** 这种写法,易读错(是 `not (x==y)` 还是 `(not x)==y`?)。要判"不等于"直接用 `if x != y:`,要判"取反比较"用括号 `if not (x == y):`。可读性优先,别让 `not` 与比较运算符混排。

### 2.5 比较运算符与布尔结果

比较运算符(`==`/`!=`/`<`/`>`/`<=`/`>=`/`is`/`in`)的求值结果是**真正的 `bool`**:`True`/`False`。它们是 `if` 条件最直接的来源。

```python
print(3 > 2)             # True
print(3 == 3)            # True
print(3 != 4)            # True
print(3 <= 3)            # True
print('a' in 'abc')      # True —— in 成员判断
print('x' not in 'abc')  # True —— not in
print([1,2] == [1,2])    # True —— 值相等
print([1,2] is [1,2])    # False —— 不同对象(详见 2.6)
print(None is None)      # True
```

**比较运算符的结果是 bool**,可放心用于条件:

```python
if age >= 18:            # age>=18 求值为 True/False
    print("成年")
```

**链式比较**——Python 独有的优雅特性,多个比较可链式书写:

```python
# 链式:等价 1 < x and x < 10,但只评估 x 一次
x = 5
print(1 < x < 10)        # True —— 1 < x 且 x < 10
print(1 < x < 3)         # False
# 等价的传统写法(评估 x 两次)
print(1 < x and x < 10)  # True

# 也可混用运算符
print(0 <= x < 100)      # True
print(1 < x != 5)        # True —— x>1 且 x!=5
# 多个相等判断
print(1 == 1 == 1)       # True
```

链式比较 `1 < x < 10` 比 `1 < x and x < 10` 更简洁(且只评估 x 一次,避免 x 是有副作用的表达式时重复触发)。这是 Python 相对多数语言的语法优势,**判断区间优先用链式比较**。

⚠️ **链式比较的解析**:`a < b < c` 等价 `a < b and b < c`,**不是** `(a < b) < c`。这避免了"`(a<b)` 得 True(=1),再 `1 < c`"的荒谬链。Python 的链式比较是数学直觉的,符合理预期。

**不同类型比较**:同类型比较规则清晰(数字按值、字符串按字典序),跨类型有些限制:

```python
print(3 < 5)             # True —— 数字按值
print('a' < 'b')         # True —— 字符串字典序
print('abc' < 'abd')     # True
print([1,2] < [1,3])     # True —— 列表逐元素比
print((1,2) < (1,3))     # True —— 元组同理
# print(3 < '5')         # TypeError(Python 3):数字与字符串不能直接比较
```

⚠️ Python 3 禁止数字与字符串直接比较(`3 < '5'` 抛 `TypeError`),Python 2 则按类型名某种规则排序(混乱)。这是 Python 3 的改进——比较应在语义同类的对象间进行。跨类型比较要么显式转换(`str(3) < '5'`),要么用 key 函数。

### 2.6 == 与 is:值相等与身份相同

理解 `==` 与 `is` 的区别,是布尔比较的关键——它们常被混淆,导致隐蔽 bug。

- **`==` (值相等)**:比较两个对象的**值**是否相等,调用 `__eq__` 方法。
- **`is` (身份相同)**:比较两个对象是否是**同一个对象**(id 相同,即同一内存地址)。

```python
a = [1, 2]
b = [1, 2]
print(a == b)        # True —— 值相等(两个列表内容相同)
print(a is b)        # False —— 不是同一对象(两个独立列表,id 不同)
print(id(a), id(b))  # 不同地址
c = a
print(a is c)        # True —— c 和 a 指向同一对象
```

`a == b` 看"内容是否一样",`a is b` 看"是不是同一个"。两个独立创建但内容相同的列表,`==` 为 True、`is` 为 False;赋值共享(`c = a`)则 `is` 也为 True。

**`is` 的正当用法——判单例**:`is` 最可靠的用途是与单例比较,尤其 `None`:

```python
x = None
print(x is None)         # True —— 判 None 用 is,规范且可靠
print(x is not None)     # True —— 判非 None
# 也可判 True/False/... 单例(但通常 if x: / if not x: 更地道)
print(x is True)         # False —— None 不是 True
flag = True
print(flag is True)      # True
```

⚠️ **判 `None` 必须用 `is`,不用 `==`**。原因:`None` 是单例,`is` 判身份最直接高效;`==` 会调 `__eq__`,某些自定义类可能把 `__eq__` 实现成"和任意值都相等"或抛异常,导致 `x == None` 行为不可控。`is None` 永远只判身份,可靠:

```python
# 推荐
if x is None: ...
if x is not None: ...
# 不推荐
if x == None: ...     # 可能被自定义 __eq__ 改写,不可靠
```

**`is` 与小整数缓存的陷阱**(见《int 类型详解》《变量赋值机制》):CPython 缓存 -5~256,导致 `is` 对小整数/短字符串常返回 True,产生"`is` 能比整数"的假象:

```python
a = 256
b = 256
print(a is b)        # True —— 256 在缓存范围,同一对象
a = 1000000
b = 1000000
print(a is b)        # 不保证 True(交互式常为 False)—— 大整数未必缓存
```

⚠️ 这造成"`a is b` 对小整数总 True"的假象,但这是实现优化,不可依赖。**值相等永远用 `==`,不用 `is`**:

```python
# 危险:依赖缓存比整数,大数会失效
# if a is b: ...    # 大整数可能 False!
# 正确
if a == b: ...      # 始终可靠
```

**`==` 与 `is` 决策表**:

| 需求 | 用 |
|------|-----|
| 判值相等 | `==` |
| 判是否同一对象 | `is` |
| 判 None | `is None` / `is not None` |
| 判 True/False 单例(精确) | `is True` / `is False` |
| 判真值/假值 | `if x:` / `if not x:` |
| 比数字/字符串值 | `==`(绝不用 is) |

记住口诀:**"值比用 `==`,单例判用 `is`"**。绝大多数场景用 `==`,`is` 专留给 `None` 等单例。判真值用 `if x:`/`if not x:`,不用 `if x == True:`(会把 1 也当 True,语义偏)。

### 2.7 bool 即 int 的算术与计数

§1.4 提到 `bool` 是 `int` 子类,`True==1`/`False==0`。这让 bool 能参与 int 算术,催生优雅的计数惯用法。

```python
print(True + True)           # 2
print(True + False)          # 1
print(True * 5)              # 5
print(False * 100)           # 0
print(sum([True, True, False, True]))  # 3 —— sum 计数为 True 的项
```

**惯用法:用 sum 统计满足条件的项数**——这是 bool 即 int 最实用的场景:

```python
# 统计列表中偶数的个数
nums = [1, 2, 3, 4, 5, 6]
# 写法一:显式计数
even_count = sum(1 for n in nums if n % 2 == 0)
# 写法二:利用 bool 即 int(True 当 1 求和)
even_count2 = sum(n % 2 == 0 for n in nums)
print(even_count, even_count2)   # 3 3

# 统计合格人数
scores = [85, 90, 55, 78, 92]
pass_count = sum(score >= 60 for score in scores)   # 4
```

`sum(score >= 60 for score in scores)` 中,`score >= 60` 求值为 `True`/`False`(bool),`sum` 把它们当 1/0 求和,得到满足条件的项数。这种写法极其简洁地道,Python 代码里常见。缺点是可读性略降(需知 bool 即 int),团队不熟时 `sum(1 for ... if 条件)` 更显式。

**bool 索引(不推荐)**:因 True==1/False==0,bool 可当索引,但极不推荐:

```python
lst = ['a', 'b', 'c']
print(lst[True])        # 'b' —— True 当 1,极易出错,别这么写
print(lst[False])       # 'a'
```

`lst[True]` 等价 `lst[1]`,看似能用实则混淆——真要表达"索引1"就写 `1`,别用 `True`。这条"能用≠该用",可读性优先。

**bool 与 int 的整体算术提升**:bool 参与 int 算术时被当 0/1,结果 int:

```python
print(True + 1)         # 2 —— bool 提升为 int
print(type(True + 1))   # <class 'int'> —— 结果是 int 不是 bool
print(True + 1.0)       # 2.0 —— 进一步提升为 float
```

`True + 1` 结果是 `int`(2),不是 `bool`——算术运算把 bool 提升为更宽的 int/float。bool 仅在纯粹的布尔运算(`and`/`or`/`not`/比较)里保持 bool 性质。

### 2.8 综合示例:bool 与短路逻辑实战

下面这个片段综合演示真值测试、短路逻辑、bool 即 int 在实战中的协作:

```python
# 1. 真值测试:简洁的判空
def first_or_default(items, default=None):
    # items 非空返回第一个,否则返回 default
    if items:                       # 真值测试:非空即真
        return items[0]
    return default
print(first_or_default([1, 2, 3]))  # 1
print(first_or_default([]))         # None
print(first_or_default([], "空"))   # 空

# 2. or 设默认值
def greet(name):
    name = name or "陌生人"          # None/'' 都用默认
    return f"Hello, {name}"
print(greet(None), greet(""), greet("Alice"))

# 3. and 短路避免副作用
config = None
version = config and config.get("version")   # config 为 None 短路,不调 get
print(version)                               # None,安全
# 注意:若 config 可能是空 dict(为假),会短路返回空 dict,需警惕

# 4. 短路省性能:廉价检查在前
def is_valid_user(user):
    # user 不为 None 才查 .active(避免 None.active 报错)+ active 才查昂贵权限
    return user is not None and user.get("active") and check_expensive_permission(user)
def check_expensive_permission(u):
    print("昂贵权限检查执行")
    return True
class U(dict):
    def __getattr__(self, k): return self.get(k)
print(is_valid_user(None))          # False,短路,未执行昂贵检查

# 5. 链式比较:区间判断
age = 25
if 18 <= age < 60:                  # 链式,比 18<=age and age<60 简洁
    print("适龄劳动力")

# 6. 三目运算符(优先于 and/or 模拟)
status = "成年" if age >= 18 else "未成年"
print(status)

# 7. == vs is
a = [1,2]; b = [1,2]
print(a == b, a is b)              # True False
n = None
print(n is None)                    # True(判 None 用 is)

# 8. bool 即 int:计数
nums = [1, 2, 3, 4, 5, 6, 7, 8]
print("偶数个数:", sum(n % 2 == 0 for n in nums))   # 4
print("大于5的个数:", sum(n > 5 for n in nums))      # 3
```

跑一遍这段示例,对照输出:真值测试判空、or 设默认、and 短路防副作用、链式比较、三目、`==`/`is` 区分、bool 计数——bool 类型与短路逻辑的实战全貌就清晰了。核心:**真值测试让条件简洁、短路逻辑既返回值又省副作用、bool 即 int 让计数优雅**。

---

## 3. 最佳实践

### 3.1 判空用真值测试,不用 len()>0 或 != ''

```python
# 推荐(Python 惯用法)
if items:           # 非空
    ...
if not items:       # 为空
    ...
if name:            # 非空字符串
    ...
# 不推荐(啰嗦)
if len(items) > 0: ...
if items != []: ...
if name != '': ...
```

`if items:` / `if not items:` 是 Python 判空的惯用法,对所有容器/字符串统一适用,比 `len()>0`/`!= []` 简洁得多。养成 `if items:` 的习惯。

### 3.2 判 None 用 is None,不用 == None 也不用 if not x

```python
# 推荐
if x is None: ...
if x is not None: ...
# 不推荐
if x == None: ...          # 可能被 __eq__ 改写
if not x: ...              # 会把 0/[]/'' 也判为"空",语义错位
```

`None` 是单例,`is None` 判身份最可靠。注意 `if not x:` 与 `if x is None:` 语义不同——前者判"假值"(含 0/空),后者仅判 None。要"是否为 None"用 is,要"是否为假值"用 not。别混用。

### 3.3 判布尔值用 if x:,不用 if x == True:

```python
# 推荐
if active:          # active 为真(True 或真值)
    ...
# 不推荐
if active == True:  # 会把 1 也判为 True(1==True),语义偏
    ...
if active is True:  # 仅当 active 恰为 True 单例,过严(若 active 可能是 1 会漏)
```

判"是否为真"用 `if x:`(真值测试);仅当需精确判"是不是 True 这个单例"才用 `is True`(罕见)。`== True` 既不可靠(1==True)又啰嗦,避免。

### 3.4 or 设默认值,但注意 falsy 的覆盖范围

```python
# 推荐:None 或空都用默认
name = name or "匿名"
# 注意:若想"仅 None 替换、空串保留",or 不合适
name = name if name is not None else "匿名"   # 仅 None 替换
```

`x or default` 简洁,但会把所有 falsy(None/0/''/[]/)都替换。若你的语义是"仅 None 替换",要用 `x if x is not None else default` 或 `if x is None:`。明确 falsy 范围再选用。

### 3.5 优先用三目 a if cond else b,而非 and/or 模拟

```python
# 推荐(清晰可靠)
label = "成年" if age >= 18 else "未成年"
# 不推荐(旧式 and/or 模拟,有陷阱)
# label = (age >= 18) and "成年" or "未成年"   # cond 为真时若 "成年" 本身为假值会出错
```

三目 `a if cond else b` 是 Python 条件表达式的标准写法,清晰且无 `and/or` 模拟的陷阱(cond 为假但 a 为假值时,`cond and a or b` 会错误返回 b)。二选一用三目。

### 3.6 区间判断用链式比较

```python
# 推荐(链式,简洁且只评估一次)
if 18 <= age < 60: ...
# 不推荐
if age >= 18 and age < 60: ...   # 评估 age 两次,啰嗦
```

链式比较 `a < x < b` 是 Python 的优雅特性,符合数学习惯。区间判断、范围校验优先链式。

### 3.7 and 链把廉价检查放前、昂贵检查放后

```python
# 推荐:短路省开销
if cheap_check() and expensive_check(): ...
# 不推荐:昂贵检查总执行
if expensive_check() and cheap_check(): ...
```

`and` 短路——前为假则不评估后。把"大概率失败/廉价的检查"放前面,昂贵检查放后面,能省下大量计算。同理 `or` 把"大概率成功"的放前面。利用短路优化条件顺序。

### 3.8 避免空容器被 and 短路误用

```python
# 危险:空 dict/[]/'' 为假,and 会短路返回它们本身
cfg = {}
val = cfg and cfg.get("key")   # {} 为假,短路返回 {}(不是 None,不是 get 结果)
# 稳妥:显式判 None 或直接用 get
val = cfg.get("key") if cfg is not None else None
val = cfg.get("key")           # 若 cfg 一定非 None,直接 get(空 dict 也不报错)
```

`and` 安全访问(`obj and obj.method`)只对 None/falsy-非容器对象可靠。对可能为空容器的对象,空容器会短路返回自身而非进入方法。空 dict 调 `.get` 本就不报错,直接用更稳。警惕这条陷阱。

### 3.9 not 与比较运算符别混排,用 != 或括号

```python
# 推荐
if x != y: ...
if not (x == y): ...
# 不推荐(易读错)
if not x == y: ...
```

`not x == y` 是 `not (x==y)`(比较优先),但易读成 `(not x) == y`。要"不等于"用 `!=`,要"取反比较"加括号。可读性优先,别让 `not` 与 `==` 紧挨。

### 3.10 利用 bool 即 int 计数,但团队不熟用显式写法

```python
# 简洁(地道,利用 bool 即 int)
count = sum(score >= 60 for score in scores)
# 显式(可读性更好)
count = sum(1 for score in scores if score >= 60)
```

`sum(条件 for ...)` 简洁,但需知 bool 即 int。团队/读者不熟时,`sum(1 for ... if 条件)` 更直白。按团队习惯与可读性权衡,两者都对。

### 3.11 bool 索引、bool 算术细节避免歧义

```python
# 避免:bool 当索引
# lst[True]   # 虽合法(=lst[1]),但极易出错,直接写 1
# 适度:bool 计数(sum)是地道的,True+1 算术则少见
```

bool 即 int 的"计数"用法(sum)值得推广;但 bool 当索引、bool 参与复杂算术会引人困惑。用于计数 OK,其他场景用明确的 int/bool,避免歧义。

### 3.12 True/False/None 严格大写,别用其他语言写法

```python
# Python 正确
flag = True
value = None
# 错误(C/Java/JS 习惯)
# flag = true    # NameError
# value = null   # NameError
```

`True`/`False`/`None` 首字母大写,不是 `true`/`false`/`null`。建立 Python 拼写习惯。判这些单例用 `is`。

---

## 4. 原理

本章讲清 `bool` 与布尔运算的底层机制:`bool` 为何是 `int` 子类及其内部实现、真值测试的 `__bool__`/`__len__` 优先级、`and`/`or` 短路与返回值的字节码本质、链式比较的求值方式、`True`/`False` 单例与关键字常量。这些是"bool 为何如此"的根基。

### 4.1 bool 为何是 int 的子类:继承与内部表示(需理解,详述)

`bool` 继承自 `int`,这不是偶然——是 Python 沿袭 C 语言"真值即整数(0/1)"约定的设计选择。在 CPython 源码层(`boolobject.c`),`bool` 大致是:

```python
# 概念性伪代码
class bool(int):
    """bool 是 int 的子类,值固定 0 或 1,仅重写了字符串表示。"""
    def __repr__(self):
        return 'True' if self else 'False'
    def __str__(self):
        return 'True' if self else 'False'
    # 算术行为完全继承 int:True 当 1,False 当 0

True = bool(1)    # 单例
False = bool(0)   # 单例
```

`bool` 内部就是一个 int——`True` 的 int 值是 1、`False` 是 0,只是:

- **固定取值范围**:只能是 0 或 1。构造 `bool(x)` 时,把 x 判真假,真则 True(=1)、假则 False(=0)。
- **重写显示**:`repr`/`str` 显示为 `True`/`False` 而非 `1`/`0`,让调试输出可读。
- **算术完全继承 int**:`True + True` 走 int 加法(1+1=2),`True * 5` 走 int 乘法。bool 没重写任何算术方法。

`bool.__mro__` 揭示继承链:

```python
print(bool.__mro__)
# (<class 'bool'>, <class 'int'>, <class 'object'>)
```

`bool → int → object`,故 `isinstance(True, int)` 为 True(True 沿 MRO 是 int)、`type(True) is int` 为 False(精确类型是 bool)。这解释了 §1.4 的所有现象。

**为何如此设计?** 兼容性与简洁。Python 早期(bool 在 2.3 才引入,之前真值直接用 0/1 int)许多代码用 0/1 当布尔、与整数混算。让 bool 成为 int 子类,旧代码 `if x:`、`x + 1`、`sum([1,0,1])` 等混合用法都能无缝工作,True/False 与 1/0 互通。代价是"`isinstance(x, int)` 会吃掉 bool"这一需注意的陷阱(实践中先判 bool 短路)。这是"兼容性优先"的典型设计取舍。

**`__bool__` vs 父类 int**:有趣的是,`True`/`False` 的 `__bool__` 返回自身——`bool(True)` 是 `True`。而 `int.__bool__`(其实 int 没定义 `__bool__`,靠 §4.2 的默认规则:0 为假、非 0 为真)让 `bool(0)=False`、`bool(5)=True`。bool 子类继承这套规则,但因 bool 值只能是 0/1,结果稳定。理解 bool 内部是 int,就理解了它所有算术与类型行为。

### 4.2 真值测试的 __bool__/__len__ 机制(需理解,详述)

§2.2 讲了真值测试的 `__bool__`/`__len__` 优先级规则,这里讲清其底层调用链。当 Python 在布尔语境(`if`/`while`/`and`/`or`/`not`/`bool(x)`)需要对象的真值时,内部步骤:

1. 调用 `type(obj).__bool__(obj)`(若定义),用其返回值(必须是 bool)。
2. 否则调用 `type(obj).__len__(obj)`(若定义),真值 = `(len != 0)`。
3. 否则真值 = `True`(默认,任意对象为真)。

```python
# 验证调用链:定义带日志的 __bool__/__len__
class Tracer:
    def __bool__(self):
        print("__bool__ called")
        return False
    def __len__(self):
        print("__len__ called")
        return 0

t = Tracer()
print(bool(t))   # __bool__ called / False —— __bool__ 优先
```

```python
class LenOnly:
    def __len__(self):
        print("__len__ called")
        return 0    # 长度0 → 假
print(bool(LenOnly()))   # __len__ called / False
class LenNonZero:
    def __len__(self):
        return 5
print(bool(LenNonZero()))   # True —— len≠0 即真
```

内置容器(list/dict/str/set/tuple)都定义了 `__len__` 但没 `__bool__`,故走 `__len__`:空(长度0)为假,非空为真。这就是 `if not []:`、`if "hi":` 的底层依据。

**`__bool__` 必须返回 bool**:

```python
class Broken:
    def __bool__(self):
        return 1    # 不是 bool
# bool(Broken())   # TypeError: __bool__ should return bool
```

CPython 严格检查 `__bool__` 返回类型为 bool,否则 `TypeError`。这条约束保证真值测试结果确定(True/False),不会因自定义类返回奇怪值破坏布尔逻辑。

**`__bool__` 优先于 `__len__`** 的原因:`__bool__` 是更明确、更直接的"我说是真是假",`__len__` 是间接的(靠长度推断,适合"集合类"语义)。若类同时定义两者,`__bool__` 更精确的表达应胜出。这条优先级让你能精确控制真值:集合类用 `__len__`(自动空即假),状态类用 `__bool__`(显式条件)。

理解这套 `__bool__`→`__len__`→默认真的链,就理解了真值测试对所有对象的统一处理,也能自定义类的真值语义(如让 `if my_buffer:` 表"是否非空")。

### 4.3 and/or 短路与返回值的字节码本质(需理解,详述)

`and`/`or` 的"短路求值"与"返回操作数本身"这两个特性,从字节码看最清楚。`and` 的本质是"条件跳转":

```python
import dis
dis.dis(compile("a and b", "", "eval"))
# LOAD_NAME a
# JUMP_IF_FALSE_OR_POP label    —— 若 a 为假,跳到 label(且不弹出 a,直接作为结果)
# LOAD_NAME b                   —— a 为真才加载 b
# label:
# RETURN_VALUE
```

`JUMP_IF_FALSE_OR_POP` 是关键:**若栈顶(a)为假,保留 a 在栈上,跳过 b 的加载,直接返回 a**(短路,返回操作数本身);若 a 为真,弹出 a(POP),继续加载 b,b 成为结果。这正是 `a and b` 的"假则返回 a、真则返回 b"逻辑。

`or` 类似,用 `JUMP_IF_TRUE_OR_POP`:

```python
dis.dis(compile("a or b", "", "eval"))
# LOAD_NAME a
# JUMP_IF_TRUE_OR_POP label     —— 若 a 为真,保留 a,跳过 b,返回 a
# LOAD_NAME b                   —— a 为假才加载 b
# label:
# RETURN_VALUE
```

`JUMP_IF_TRUE_OR_POP`:**a 为真则保留 a 跳过 b 返回 a;为假则弹出 a 加载 b 返回 b**。即 `a or b` 的"真则返回 a、假则返回 b"。

**这两条字节码揭示了两个特性的源头**:

- **短路**:`JUMP_IF_*_OR_POP` 在判定第一个操作数即可定结论时,跳过第二个操作数的 `LOAD`(及其所有副作用)。所以 `0 and expensive()` 中 `expensive()` 完全不执行。
- **返回操作数本身**:跳转时"保留栈顶(第一个操作数)作为结果",而非转成 bool。所以 `'' or 'x'` 返回 `'x'`、`3 and 5` 返回 `5`——返回的是操作数对象,不是 True/False。

这也解释了为何 `and`/`or` 不返回 bool——它们在字节码层就是"选择保留哪个操作数",没有 `bool(...)` 转换步骤。而 `not x` 不同,它有显式的取真值 + 反转,故返回 bool:

```python
dis.dis(compile("not x", "", "eval"))
# LOAD_NAME x
# UNARY_NOT                     —— 取反(内部:取真值后反转)
# RETURN_VALUE
```

`UNARY_NOT` 把 x 判真假后反转,结果恒为 bool。这就是 `not` 总返回 bool 而 `and`/`or` 不返回 bool 的字节码根源。

**短路的语义保证**:由于短路在字节码层是确切的跳转,`a and b` 中 `b` 仅在 `a` 为真时求值——这是语言保证,而非优化。因此 `x is not None and x.method()` 这种"靠短路保证安全"的写法是可靠的(只要 a 为假,b 必不评估,不会触发 b 的副作用/错误)。

### 4.4 链式比较的求值方式

链式比较 `a < b < c` 的求值,与直觉的"逐个比较"不同——它等价 `a < b and b < c`,且**每个操作数只求值一次**(b 不会算两次),但有短路:

```python
dis.dis(compile("a < b < c", "", "eval"))
# LOAD_NAME a
# LOAD_NAME b
# DUP_TOP            —— 复制 b(供第二个比较用,避免重新求值)
# ROT_THREE
# COMPARE_OP <       —— a < b
# JUMP_IF_FALSE_OR_POP label   —— 短路:a<b 为假则跳过后续
# LOAD_NAME c
# COMPARE_OP <       —— b < c(用之前复制的 b)
# label:
# RETURN_VALUE
```

`DUP_TOP` 复制 b 的值,让两次比较(b 在 `a<b` 和 `b<c` 中)用同一个 b 值——若 b 是有副作用的表达式(如函数调用),只执行一次。且 `a < b` 为假时短路,不评估 c。这保证了 `1 < x() < expensive()` 中 x() 只调一次、expensive() 在 1<x() 为假时不调。

**关键:链式比较是 `and` 语义,不是数学意义上的传递**。`a < b < c` 是 `a < b and b < c`,要求两个都真。它**不是**"a<b 且 b<c 推出 a<c"的逻辑传递——那是不需要的,因为若前两个真,传递性自动保证 a<c,但代码只检查前两个。理解这点就理解链式比较的精确语义。

**链式比较的陷阱**:与 `==`/`is` 混用时需注意解析:

```python
print(1 == 1 == 1)    # True —— 1==1 and 1==1
print(1 == 1 == 2)    # False
# 但 is 不能这样链(语义怪异):
a = b = c = [1]
print(a is b is c)    # True —— a is b and b is c(都同一对象)
# 链式比较主要用于 < > <= >= ==,is/in 链式少见且易混淆,慎用
```

链式比较主要用于数值区间的 `<`/`>`/`<=`/`>=` 与 `==`,`is`/`in` 链式虽语法合法但易读混,实战避免。

### 4.5 True/False 单例与关键字常量

`True`/`False` 在 Python 3 是**关键字常量**(keyword constants),不是普通标识符。两个含义:

- **不可赋值**:`True = 1` 是 `SyntaxError`(编译期拒绝),不是运行时错误。
- **值在编译期固定**:字节码里 `LOAD_CONST` 加载常量,不是 `LOAD_NAME` 查名字空间。

```python
import dis
dis.dis(compile("x = True", "", "exec"))
# LOAD_CONST 0 (True)   —— 直接加载常量对象 True
# STORE_NAME 0 (x)
```

若是普通标识符,会是 `LOAD_NAME True` 去名字空间查;而 `True` 是 `LOAD_CONST`,加载解释器内置的单例常量。这与"无法赋值覆盖"一体两面:True/False/None 不是名字空间条目,是固定常量。

**单例**:全解释器只有一个 `True`、一个 `False`、一个 `None` 对象。所有写 `True` 的地方都引用同一对象,故 `True is True` 恒为真:

```python
a = True
b = (1 == 1)        # 比较结果也是那同一个 True 单例
print(a is b)       # True —— 都是单例 True
```

`True`/`False` 的单例性让 `is` 判身份可靠(`x is True` 精确判"是不是 True 单例")。但注意 `1 is True` 为 `False`(1 和 True 是不同对象,虽 `1 == True`);`is True` 比"是否为真值"严格(仅判 True 单例)。

**历史**:Python 2 早期,`True`/`False` 是内置名字空间的标识符(可被赋值覆盖,造成灾难,如 `True = False`)。Python 3 把它们升格为关键字常量,杜绝覆盖。`None` 在 2.4 也成为关键字。这是 Python 进化中"防止误用"的改进。理解这些是关键字常量、单例,就理解了为何用 `is` 判它们可靠、为何赋值报错。

---

## 5. 总结

### 5.1 本文内容回顾

- **bool 定义**:Python 真值类型,两实例 `True`/`False`(首字母大写,非 true/false),用于一切条件逻辑。
- **真值测试**:任何对象在布尔语境被判真假;假值=`False`/`None`/数值零/空容器,其余为真;容器只看空非空不看元素(`[0]` 为真);`if items:` 是判空惯用法。
- **真值测试底层**:`__bool__` 优先(须返回 bool)→ `__len__`(len≠0 为真)→ 默认真;自定义类可定义 `__bool__` 控制真值。
- **布尔运算符**:`and`/`or` 短路求值且返回操作数本身(非 bool);`not` 一元、总返回 bool、优先级最高。
- **短路逻辑**:`a and b` 假则返回 a 短路、真则返回 b;`a or b` 真则返回 a 短路、假则返回 b;短路省副作用与开销(廉价检查放前)。
- **and/or 惯用法**:`a or default` 设默认值(注意 falsy 覆盖范围)、`a and b` 链式前置条件(`None and None.method` 防错,但空容器会误短路);三目 `a if cond else b` 优先于 and/or 模拟。
- **not**:取反,总返回 bool,优先级低于比较;避免 `not x == y` 混排。
- **比较运算符**:`==`/`!=`/`</>`/`is`/`in` 结果为 bool;链式比较 `a < x < b` 等价 `a<x and x<b` 且只评估 x 一次;跨类型比较 Python 3 限制(数字与字符串不可比)。
- **== vs is**:`==` 比值(调 `__eq__`),`is` 比身份(同一对象);判 None 用 `is None`,判值用 `==`(勿用 is 比值,小整数缓存陷阱)。
- **bool 即 int**:True==1/False==0,isinstance(True,int) 为 True(需先判 bool 短路);`sum(条件)` 计数;bool 参与算术提升为 int。
- **原理**:bool 继承 int(值 0/1、重写显示、算术继承,MRO bool→int→object);真值测试 `__bool__`→`__len__`→默认真链;and/or 用 `JUMP_IF_*_OR_POP` 字节码实现短路与返回操作数(故不返回 bool),not 用 UNARY_NOT 故返回 bool;链式比较 `DUP_TOP` 复制操作数只求值一次且有短路;True/False/None 是关键字常量+单例(LOAD_CONST 非 LOAD_NAME,不可赋值)。
- **最佳实践**:判空用真值测试、判 None 用 is、判布尔用 if x:、or 设默认注意 falsy、三目优先、链式比较区间、and 廉价在前、防空容器误短路、not 不与比较混排、bool 计数权衡可读性、True/None 大写。

### 5.2 读完本文你应能掌握

- 说明 `bool` 的定义与 `True`/`False`(首字母大写,非 true/false),指出它们是单例关键字常量。
- 复述真相值测试规则(假值集合),指出容器只看空非空(`[0]` 为真),用 `if items:` 惯用法判空。
- 阐述真值测试的 `__bool__`/`__len__` 优先级链,用 `__bool__` 自定义类的真值。
- 说明 `and`/`or` 的短路求值与返回操作数本身的特性,预判 `0 and 5`、`'' or 'x'` 的返回值。
- 用 `a or default` 设默认值、`a and b` 链式前置条件,指出前者 falsy 覆盖范围、后者空容器误短路陷阱。
- 用三目 `a if cond else b`,说明为何优先于 and/or 模拟。
- 说明 `not` 总返回 bool、优先级,避免 `not x == y` 混排。
- 用链式比较判断区间,说明其等价 `and` 语义与"只求值一次"特性。
- 区分 `==`(值)与 `is`(身份),用 `is None` 判 None,避免用 `is` 比值(缓存陷阱)。
- 说明 bool 是 int 子类的后果(True+True==2、isinstance 渗透),用 `sum(条件)` 计数。
- 阐述 bool 继承 int、真值测试链、and/or 字节码短路本质、链式比较求值、True/False 单例等原理。

### 5.3 延伸方向

- **int 类型详解**:bool 作为 int 子类的更多算术行为、bool/int 类型判断的 isinstance 陷阱,见《int 类型详解》。
- **None 类型详解**:None 单例的完整语义、`is None` 规范、None 作函数默认哨兵,见《None 类型详解》。
- **类型判断与 type 系统**:`isinstance` 与 `type() is` 的差异、bool/int 继承链判定,见《类型判断与 type 系统》。
- **变量赋值机制**:小整数缓存导致 `is` 对小整数/True 误判、`==` vs `is` 的引用模型,见《变量赋值机制》。
- **运算符与表达式**:运算符优先级全表、表达式求值顺序,见《运算符与表达式》大章节。
