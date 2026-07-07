---
group:
  title: 【02】基础数据类型和类型系统
  order: 2
order: 3
title: 类型判断与type系统
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 为什么需要类型判断

Python 是动态类型语言——变量没有类型,对象才有类型。一个名字 `x` 可以先后指向 `int`、`str`、`list` 等任意类型的对象,这在带来灵活的同时,也带来一个问题:**当你在运行时拿到一个对象,如何知道它到底是什么类型?** 这正是"类型判断"要解决的需求。

类型判断在真实开发中无处不在:

- **处理多态输入**:一个函数可能收到 `int` 也可能收到 `str`,需要按类型分支处理(虽然更 Pythonic 的做法是用协议/EAFP,但分支判断仍常见)。
- **防御性编程**:外部数据(JSON 解析、用户输入、第三方接口)类型不可控,处理前先校验类型,避免 `AttributeError`。
- **序列化/反序列化**:把对象转成 JSON 时,要区分它是 dict 还是 list、是 str 还是 number。
- **调试与日志**:打印对象类型辅助排查"`为什么这个值的操作不对`"。
- **库的 API 设计**:对传入参数做类型校验,给出清晰的错误提示而非让错误在深层爆发。

Python 提供了一整套观察和判断类型的工具,核心是三个:`type()`(取对象的精确类型)、`isinstance()`(判断对象是否属于某类型,含继承链)、`issubclass()`(判断类与类的继承关系)。围绕它们,还有 `type` 本身(一切类的元类)、`object`(所有类的根基类)、抽象基类(ABC)构成的一套"类型系统"。

本篇要系统讲清这套体系:如何正确地判断类型、`type()` 与 `isinstance()` 的本质差异、`type` 与 `object` 的关系、继承链条上的类型判定、抽象基类与"鸭子类型"的取舍,以及运行时类型信息(RTTI)的使用。这是理解 Python 类型模型、也是后续类型注解/静态类型检查(本大章节第 9~13 篇)的运行时根基。

### 1.2 type、object 与"一切皆对象"的类型观

要理解 Python 的类型系统,先建立两个核心对象的认知:`type` 和 `object`。

**`object`** 是所有类的**根基类**(root base class)。Python 里每一个类(无论是内置的 `int`/`str` 还是你自定义的 `class Foo`)都直接或间接继承自 `object`。因此任何对象都"是一个 object",`isinstance(任何对象, object)` 恒为 `True`。

**`type`** 是所有类的**类型**——即"类的类",称为**元类(metaclass)**。每一个类对象本身的类型都是 `type`:`type(int)` 是 `type`、`type(str)` 是 `type`、`type(你的自定义类)` 也是 `type`。而 `type` 自己也是对象,它的类型是它本身。

```python
print(type(42))          # <class 'int'>     —— 42 的类型是 int
print(type(int))         # <class 'type'>    —— int 这个类的类型是 type
print(type(type))        # <class 'type'>    —— type 的类型还是 type(自举)
print(type(object))      # <class 'type'>    —— object 这个类的类型也是 type
```

这两条规则组合,构成了一个精妙的闭环:

- **从"实例→类"看**:`42` 是 `int` 的实例,`int` 是 `type` 的实例。
- **从"继承"看**:`int` 继承 `object`,`type` 也继承 `object`(所以 `type` 是个"类")。
- **特例**:`type` 的类型是 `type` 自己,`object` 的类型是 `type`。

```python
print(isinstance(42, int))           # True   —— 42 是 int 实例
print(isinstance(int, type))         # True   —— int 是 type 的实例(类也是对象)
print(isinstance(int, object))       # True   —— int 继承 object
print(isinstance(type, object))      # True   —— type 也继承 object
print(isinstance(object, type))      # True   —— object 自身也是 type 的实例
print(issubclass(int, object))       # True   —— int 是 object 的子类
print(issubclass(type, object))      # True   —— type 是 object 的子类
```

这个"`type` 和 `object` 互相引用、自洽"的结构看似烧脑,但它就是 Python"一切皆对象"的数学骨架:**每个对象都有类型(指向某类),每个类最后都收束到 `object`,而所有类的类型都收束到 `type`**。日常编码不必时刻推演这个闭环,但建立"`type` 是造类的类、`object` 是所有类的根"的认知,是理解后续 `type()`、`isinstance()`、自定义元类的钥匙。

### 1.3 判断类型的三大工具速览

讲清核心机制前,先给出三个最常用的判断工具,建立全局印象:

- **`type(obj)`**:返回 `obj` 的**精确类型**(类对象)。如 `type(42)` 返回 `int`。它只给精确类型,不看继承链。
- **`isinstance(obj, cls)`**:判断 `obj` 是否 `cls` 的实例(含父类)。`isinstance(True, int)` 为 `True`(`bool` 是 `int` 子类)。是判断类型的首选。
- **`issubclass(cls, parent)`**:判断类 `cls` 是否 `parent` 的子类(含自身)。`issubclass(bool, int)` 为 `True`。注意两个参数都必须是类对象,不是实例。

```python
# type():取精确类型
print(type(42))              # <class 'int'>
print(type("hi"))            # <class 'str'>

# isinstance():按继承链判断(推荐)
print(isinstance(42, int))   # True
print(isinstance(True, int)) # True —— bool 是 int 子类,type(True) is int 为 False
print(isinstance(42, object))# True —— 万物皆 object

# issubclass():类与类的继承关系
print(issubclass(bool, int)) # True
print(issubclass(int, object)) # True
# isinstance(42, int) 等价于 issubclass(type(42), int)
```

三者关系:`isinstance(x, C)` 本质等价于 `type(x) is C or issubclass(type(x), C)`——即 `isinstance` 会沿着继承链查找,而 `type(x) is C` 只判精确相等。这个差异(尤其在有继承、有 `bool` 这种子类时)决定了"为什么判断类型该用 `isinstance` 而非 `type() is`"。

### 1.4 类型判断的两种哲学:静态判断 vs 鸭子类型

在深入 API 前,先建立类型判断的两种哲学,它决定了你"是否、何时、如何"判断类型。

**静态类型判断**(nominal typing,名义类型):看对象"它声明自己是什么类"——`isinstance(x, list)` 问的是"x 是不是 list 类(或其子类)的实例"。这是 C/Java 的思路,按"类名义"判断。

**鸭子类型**(duck typing):不看对象的类,看它"能做什么"——"走起来像鸭子、叫起来像鸭子,那它就是鸭子"。即按**对象提供的方法/属性**判断,而非按类判断:

```python
# 鸭子类型:不问"是不是 list",只问"能不能迭代"
def print_all(items):
    for x in items:          # 只要 items 能迭代就行,list/tuple/set/str/生成器都可
        print(x)
```

`print_all` 不检查 `items` 是不是 `list`,直接 `for` 迭代——任何可迭代对象都能用,这是 Python 高度推崇的风格。它的好处是"接口契约用行为定义,而非用类定义",代码通用性强;代价是"如果传入的对象不能迭代,错误要到运行时才暴露"。

Python 同时支持这两种哲学,且历史上偏重鸭子类型("EAFP"—请求原谅比许可容易)。现代 Python(3.5+ 类型注解 + ABC)则引入了"结构化类型"(structural typing,介于两者间:按"有没有实现某协议方法"判类型,但用类型注解声明)——这属于类型注解专题。本篇聚焦运行时的 `type`/`isinstance`/`issubclass` 判断,以及何时该用判断、何时该用鸭子类型。

---

## 2. 核心内容

本章详解类型判断的全部 API:三个核心函数的完整用法、`type()` 的三参数动态建类形式、`isinstance`/`issubclass` 的多类型与继承链判定、用 ABC 做结构化判断、`__class__` 与 `type()` 的细微差异、运行时类型信息的获取。每节遵循"作用 → 用法 → 陷阱 → 场景"展开。

### 2.1 type():取对象的精确类型

`type(obj)` 单参数形式返回 `obj` 的精确类型(类对象)。这是最直接的"看类型"方式:

```python
print(type(42))           # <class 'int'>
print(type(3.14))         # <class 'float'>
print(type("hi"))         # <class 'str'>
print(type([1, 2]))       # <class 'list'>
print(type(None))         # <class 'NoneType'>
print(type(True))         # <class 'bool'> —— 注意是 bool 不是 int
```

返回值是个**类对象**本身(不是字符串),可以直接比较或进一步操作:

```python
t = type(42)
print(t is int)           # True —— type(42) 返回的就是 int 这个类对象
print(t(3.9))             # 3 —— 类对象可调用,int() 截断小数
print(t.__name__)         # 'int' —— 取类型名字符串
```

`type(42) is int` 的比较用 `is`(身份比较)而非 `==`,因为类对象是单例——全解释器只有一个 `int` 类对象,`is` 既正确又高效。`t.__name__` 取类型的名字字符串,做日志/显示时常用(比直接 `print(type(x))` 得到 `<class 'int'>` 更干净)。

⚠️ **`type()` 只给精确类型,不看继承链**——这是它与 `isinstance` 的根本差异,也是其最大的限制:

```python
print(type(True))         # <class 'bool'> —— 精确类型是 bool
print(type(True) is int)  # False!虽然 bool 是 int 子类,但 True 的精确类型是 bool
print(type(True) is bool) # True
```

`True` 的精确类型是 `bool`,即便 `bool` 继承 `int`,`type(True) is int` 仍为 `False`。若你的逻辑是"True 也算整数",用 `type() is` 会判错。这就是为何**判断"是否某类型(含子类)"该用 `isinstance`,而非 `type() is`**。

`type()` 适合的场景是:**需要精确类型本身**(如取类对象来调用、取 `__name__` 做日志),或**确需排除子类**(罕见,如要区分"真 list 还是 list 子类")。判断"对象属于某类型吗"几乎总该用 `isinstance`。

### 2.2 type() 的三参数形式:动态建类

`type()` 还有个鲜为人知但强大的**三参数形式**:`type(name, bases, dict)`——动态创建一个新类。这是 Python 元类机制的入口,理解它才能理解"类也是对象、可运行时构造"。

```python
# 动态创建一个类,等价于 class Dog: ...
Dog = type("Dog", (), {"bark": lambda self: print("汪!")})

d = Dog()
print(type(d))            # <class 'Dog'>
d.bark()                  # 汪!
```

三个参数:

1. **`name`**:类名字符串,会成为 `__name__`。
2. **`bases`**:父类元组(空元组 `()` 默认继承 `object`)。
3. **`dict`**:类的命名空间字典,含方法/类属性。

它等价于 `class` 语句,只是把"写死的类定义"变成"运行时动态构造":

```python
# 这两种写法等价
class Cat:
    species = "猫科"
    def meow(self):
        return "喵"

Cat2 = type("Cat2", (object,), {
    "species": "猫科",
    "meow": lambda self: "喵",
})
```

带继承与多方法的更完整示例:

```python
class Animal:
    def __init__(self, name):
        self.name = name

# 动态创建 Animal 的子类,带自定义方法
def fetch(self):
    return f"{self.name} 叼回球"

Dog = type("Dog", (Animal,), {"fetch": fetch})

d = Dog("旺财")
print(d.name)             # 旺财 —— 继承了 Animal.__init__
print(d.fetch())          # 旺财 叼回球
print(isinstance(d, Animal))  # True —— 真的是 Animal 子类
```

三参数 `type()` 何时用?**当你需要"根据运行时数据决定类的结构"时**。典型场景:ORM 框架根据数据库表结构动态生成模型类、序列化库根据 schema 生成数据类、插件系统动态装载类。日常业务代码极少直接用——`class` 语句更清晰。但理解它能运行时造类,是理解"类是 `type` 的实例、元类可定制类创建"的关键,第 4 章原理会展开。

### 2.3 isinstance():按继承链判断类型(首选)

`isinstance(obj, cls)` 判断 `obj` 是否 `cls` 的实例——沿继承链向上查找,匹配任意祖先类即 `True`。这是判断类型的首选方式。

```python
print(isinstance(42, int))         # True
print(isinstance(42, object))      # True —— int 继承 object,万物皆 object
print(isinstance("hi", str))       # True
print(isinstance(True, int))       # True —— bool 是 int 子类,这正是期望语义
print(isinstance(True, bool))      # True
print(isinstance(42, str))         # False
print(isinstance(None, type(None)))# True —— NoneType 的实例
```

注意 `isinstance(True, int)` 为 `True`——这与 `type(True) is int` 为 `False` 形成对比。`isinstance` 尊重继承关系("True 是一种 int"符合直觉),`type() is` 只看精确类型。**当你的判断语义是"是不是某类(含其子类)"时,`isinstance` 才是正确的工具。**

**第二个参数可传元组**——判断"是否属于多个类型之一",任一匹配即 `True`:

```python
def describe(x):
    if isinstance(x, (int, float, complex)):
        return "数字"
    elif isinstance(x, (str, bytes)):
        return "文本"
    elif isinstance(x, (list, tuple, set)):
        return "容器"
    return "其他"

print(describe(42))        # 数字
print(describe("hi"))      # 文本
print(describe([1, 2]))    # 容器
print(describe(True))      # 数字 —— bool 也是 int,会匹配!注意
```

⚠️ 注意最后一个 `describe(True)` 返回"数字"——因为 `True` 是 `int` 子类实例,匹配了 `(int, float, complex)`。若你要"严格区分 boolean 与数字",需把 `bool` 判断放前面(短路):

```python
def describe_strict(x):
    if isinstance(x, bool):           # 先排除 bool
        return "布尔"
    if isinstance(x, (int, float)):   # 再判数字,这样 True 不会落进来
        return "数字"
    return "其他"
print(describe_strict(True))   # 布尔
print(describe_strict(42))     # 数字
```

`bool` 作为 `int` 子类的这一"渗透"特性,是 `isinstance` 判断里最需要注意的陷阱:凡是用 `isinstance(x, int)` 的地方,`bool` 都会匹配进来。明确不要 bool 时,先判 bool 短路排除。

**判断"是不是 None"用 isinstance 也行,但更规范的是 `is None`**:

```python
x = None
print(isinstance(x, type(None)))   # True,可行但啰嗦
if x is None:                      # ✅ 规范写法
    ...
```

`None` 是单例,`is None` 比 `isinstance(x, NoneType)` 更直接高效,且 `NoneType` 这个名字需 `type(None)` 获取(它没内置名)。判 None 一律用 `is`。

### 2.4 issubclass():判断类与类的继承关系

`issubclass(cls, parent)` 判断**类** `cls` 是否 `parent` 的子类(含自身)。注意两个参数都必须是**类对象**,不能是实例:

```python
print(issubclass(bool, int))     # True  —— bool 是 int 子类
print(issubclass(int, object))   # True  —— 所有类都是 object 子类
print(issubclass(int, int))      # True  —— 类是自身的子类
print(issubclass(str, int))      # False
print(issubclass(list, object))  # True
```

⚠️ **`issubclass` 的参数是类,不是实例**——这是与 `isinstance` 的关键区别:

```python
# 正确:两参数都是类
print(issubclass(bool, int))     # True
# 错误:第一个参数传了实例
# print(issubclass(True, int))   # TypeError: issubclass() arg 1 must be a class
# 错误:第二个参数传了实例
# print(issubclass(bool, 42))    # TypeError
```

`issubclass(True, int)` 报错,因为 `True` 是实例不是类。若你拿到的是实例,要先 `type()` 取类:`issubclass(type(x), int)`——但这其实就是 `isinstance(x, int)` 做的事,**判断实例类型用 `isinstance`,判断类间关系才用 `issubclass`**。

**第二个参数也可传元组**:

```python
print(issubclass(bool, (int, float, str)))  # True —— 匹配任一
```

`issubclass` 何时用?**当你操作的是"类对象"本身,而非实例时**。典型:写装饰器/框架,要在类上判断"它是否某基类的子类";或检查动态加载的类是否符合预期父类:

```python
def register_plugin(cls):
    if not issubclass(cls, PluginBase):
        raise TypeError(f"{cls.__name__} 必须是 PluginBase 子类")
    _plugins.append(cls)
```

### 2.5 isinstance 与 type() is 的完整对比

把两者的差异系统对比,这是本篇最该记牢的决策点:

| 维度 | `type(x) is C` | `isinstance(x, C)` |
|------|----------------|---------------------|
| 是否看继承链 | 否(只精确类型) | 是(沿继承链向上找) |
| `bool` 对 `int` | `type(True) is int` → **False** | `isinstance(True, int)` → **True** |
| 子类实例对父类 | False | True |
| 第二参数多类型 | 不支持 | 支持元组 `(A, B)` |
| 性能 | 略快(直接身份比较) | 略慢(沿 MRO 查找) |
| 适用场景 | 需精确类型、排除子类(罕见) | 判断"是否某类型"(首选) |

```python
class Animal: pass
class Dog(Animal): pass
d = Dog()

print(type(d) is Dog)        # True
print(type(d) is Animal)     # False —— 精确类型是 Dog 不是 Animal
print(isinstance(d, Dog))    # True
print(isinstance(d, Animal)) # True —— 沿继承链,也是 Animal
```

`type(d) is Animal` 为 `False`,但语义上"一只狗是一种动物"是成立的——`isinstance(d, Animal)` 正确返回 `True`。这就是"判断类型用 isinstance"的核心理由:它符合继承语义,而面向对象代码里继承是常态。

**何时反该用 `type() is`?** 极少。一种情况:你确需"严格只接受 list,不接受 list 的子类"(怕子类改写了方法行为)。但即便如此,更 Pythonic 的做法往往是接受任何"行为像 list"的对象(鸭子类型),而非卡死精确类。所以实践经验几乎总是:**判断类型用 `isinstance`,需要精确类对象本身(而非判断)时用 `type()`**。

### 2.6 用抽象基类(ABC)做结构化判断

`isinstance` 不仅能判具体类,还能判**抽象基类(Abstract Base Class, ABC)**——这是 Python 类型系统的高级能力,让你按"对象所属的抽象类别"而非具体类判断。

Python 内置一批 ABC,位于 `collections.abc`,代表了对象的"行为分类":

```python
from collections.abc import Iterable, Sequence, Mapping, Sized, Hashable

print(isinstance([1, 2], Iterable))     # True —— 列表可迭代
print(isinstance("hi", Iterable))       # True —— 字符串也可迭代
print(isinstance(42, Iterable))         # False —— 整数不可迭代
print(isinstance([1, 2], Sequence))     # True —— 列表是序列
print(isinstance((1, 2), Sequence))     # True —— 元组也是序列
print(isinstance("hi", Sequence))       # True —— 字符串也是序列
print(isinstance({"a": 1}, Mapping))    # True —— 字典是映射
print(isinstance([1, 2], Sized))        # True —— 列表有长度(len 可用)
print(isinstance(42, Hashable))         # True —— int 可哈希
print(isinstance([1, 2], Hashable))     # False —— list 不可哈希
```

ABC 判断的价值在于:**它问的不是"你是哪个具体类",而是"你属于哪个行为类别"**。`isinstance(x, Iterable)` 判断"x 能不能迭代",无论它是 list/tuple/set/str/生成器/自定义可迭代类——这正是介于"静态精确类判断"和"纯鸭子类型"之间的好工具:有类型检查的清晰,又有行为分类的通用。

**Sequence vs Iterable 的层次**:`Iterable`(可迭代,只要有 `__iter__`)是更宽的类别;`Sequence`(序列,有 `__getitem__` 按下标 + 长度 + 可迭代)是更窄的类别。序列一定是可迭代的,反之不然(如 set 可迭代但不是序列,因无下标):

```python
from collections.abc import Iterable, Sequence
print(isinstance({1, 2}, Iterable))   # True —— set 可迭代
print(isinstance({1, 2}, Sequence))   # False —— 但不是序列(无下标)
print(isinstance("abc", Sequence))    # True —— str 是序列
```

**常用 ABC 速查**:

| ABC | 代表的行为 | 典型实例 |
|-----|-----------|---------|
| `Iterable` | `__iter__`,可迭代 | list/tuple/str/set/dict/生成器 |
| `Sequence` | 可迭代 + 下标 + 长度 | list/tuple/str |
| `Mapping` | 键值映射,`__getitem__`/keys/values | dict |
| `Set` | 集合运算 | set/frozenset |
| `Sized` | `__len__`,有长度 | 几乎所有容器 |
| `Hashable` | `__hash__`,可哈希能做键 | int/str/tuple(元素可哈希) |
| `Container` | `__contains__`,支持 `in` | 所有容器 |
| `Callable` | `__call__`,可调用 | 函数/类/有 `__call__` 的对象 |

用 ABC 判断比判断具体类更稳健:你的函数若只需"可迭代",判 `Iterable` 就能让所有可迭代对象(含未来新增类型)都通过,而非写死 `isinstance(x, (list, tuple, set, str, ...))`。ABC 的实现原理(虚拟子类注册、`__subclasshook__`)在第 4 章展开。

### 2.7 __class__ 属性与 type() 的细微差异

每个对象都有 `__class__` 属性,指向它的类——它通常等价于 `type(obj)`:

```python
print((42).__class__)         # <class 'int'>
print((42).__class__ is int)  # True
print(type(42) is int)        # True —— 两者通常一致
```

99% 的情况 `obj.__class__ is type(obj)`。但有一个细微差异:**`__class__` 可被实例重写,`type()` 不会被蒙蔽**:

```python
class Foo: pass
f = Foo()
f.__class__ = int            # 改 f 的 __class__ 指向 int(合法但诡异)
print(f.__class__)           # <class 'int'> —— __class__ 显示 int
print(type(f))              # <class 'int'> —— type() 也跟随 __class__
print(isinstance(f, int))   # True —— isinstance 也看 __class__
```

实际上现代 CPython 里 `type(obj)` 直接读 `obj->ob_type`,而 `isinstance` 也基于此,二者与 `__class__` 基本一致。`__class__` 的可写特性主要用于**实例的动态"类切换"**(罕见高级技巧,如代理模式),日常不会用。实践中 `type(x)` 和 `x.__class__` 等价,选哪个看风格——`type(x)` 是函数调用更显式、`x.__class__` 更"属性访问"风格。

`__class__` 还常用于**取实例的类再调用**(工厂模式、复制同类):

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def clone(self):
        return self.__class__(self.x, self.y)   # 用自身类构造,子类克隆也正确

class Point3D(Point):
    def __init__(self, x, y, z):
        super().__init__(x, y)
        self.z = z

p = Point3D(1, 2, 3)
q = p.clone()              # 子类实例的 clone 返回 Point3D,因 __class__ 是 Point3D
print(type(q))             # <class 'Point3D'> —— 而非 Point
```

`self.__class__(...)` 比 `Point(...)` 更稳健——它在子类调用时自动用子类构造,体现"多态构造"。这是 `__class__` 的实用价值。

### 2.8 运行时类型信息:__mro__ 与继承链

类的 `__mro__`(Method Resolution Order,方法解析顺序)记录该类的**完整继承链**——从自身到 `object` 的所有祖先类,按查找顺序排列。`isinstance`/`issubclass` 实质就是沿 MRO 查找:

```python
class A: pass
class B(A): pass
class C(B): pass
print(C.__mro__)
# (<class 'C'>, <class 'B'>, <class 'A'>, <class 'object'>)
```

`C.__mro__` 是个元组,`isinstance(c, X)` 等价于"`X` 在 `type(c).__mro__` 中"。理解 MRO 就理解了 `isinstance` 的工作方式:沿这个顺序找,匹配即 `True`。

`bool` 的 MRO 揭示它为何既是 bool 又是 int:

```python
print(bool.__mro__)
# (<class 'bool'>, <class 'int'>, <class 'object'>)
```

`bool` 的 MRO 是 `bool → int → object`,所以 `isinstance(True, int)` 为 `True`——`int` 在链上。

**多继承与 MRO** 的复杂场景(菱形继承),MRO 用 C3 线性化算法保证顺序一致性(详见面向对象专题)。本篇理解"`__mro__` 是继承链元组,`isinstance` 沿它查找"即可。查看一个类的 MRO 是排查"为什么 isinstance 返回这个值"的直接手段:

```python
from collections.abc import Iterable
print(list.__mro__)
# (<class 'list'>, <class 'object'>) —— list 直接是 object,没显式继承 Iterable
# 那为何 isinstance([], Iterable) 为 True?见第 4 章 ABC 虚拟子类
```

注意 `list.__mro__` 里没有 `Iterable`!但 `isinstance([], Iterable)` 为 `True`——这是因为 ABC 的"虚拟子类"机制(§4.4),`Iterable` 通过 `__subclasshook__` 声明"任何实现了 `__iter__` 的类都算我的子类",绕过了真实继承。这条机制让 ABC 能对内置类型生效,是 Python 类型系统精妙之处。

### 2.9 综合示例:一个类型分发器

下面这个片段综合运用三个核心函数 + ABC,实现一个根据输入类型分发的处理器,体现各类判断的取舍:

```python
from collections.abc import Iterable, Mapping, Sequence

def process(data):
    """根据输入类型分发处理,演示类型判断的各类用法。"""
    # 1. 精确判断 None 与 bool(用 is,因 None/True/False 是单例)
    if data is None:
        return "空值"
    if data is True or data is False:
        return "布尔: " + str(data)

    # 2. 用 isinstance + 元组判数字(注意 bool 已在上面短路排除)
    if isinstance(data, (int, float, complex)):
        return f"数字: {data} (类型 {type(data).__name__})"

    # 3. 用 ABC 判行为类别(比判具体类更通用)
    if isinstance(data, Mapping):               # 优先判映射(键值)
        return f"映射: {len(data)} 个键"
    if isinstance(data, str):                    # str 也是 Sequence,需先判出
        return f"字符串: 长度 {len(data)}"
    if isinstance(data, Sequence):              # 列表/元组等序列
        return f"序列: {len(data)} 个元素"
    if isinstance(data, Iterable):              # 更宽,生成器等
        return f"可迭代(非序列)"

    return f"未知类型: {type(data).__name__}"

# 测试各类型
for item in [None, True, 42, 3.14, "hello", [1,2,3], (1,2), {"a":1}, {1,2}, iter([1])]:
    print(f"{str(item):20} -> {process(item)}")
```

阅读这段示例,注意几个判断决策:

1. **`None`/`True`/`False` 用 `is`**——单例,`is` 最规范。
2. **`bool` 在 `int` 之前短路**——否则 `True` 会落进数字分支(`bool` 是 `int` 子类)。
3. **`Mapping` 优先于 `Sequence`/`Iterable`**——dict 是 Mapping 不是 Sequence,先判 Mapping 避免误归类;`str` 也是 Sequence,若想区分串与列表,`str` 分支要在通用 `Sequence` 前。
4. **用 ABC(`Mapping`/`Sequence`/`Iterable`)而非判具体类**——让任何符合行为的对象都正确归类,未来扩展类型无需改代码。

这个示例集中体现了"何时用 is、何时用 isinstance、何时用 ABC、如何处理 bool/str 这类既是子类又是独立类型"的实战取舍。

---

## 3. 最佳实践

### 3.1 判断"是否某类型"用 isinstance,不用 type() is

```python
# 推荐
if isinstance(x, int): ...
# 不推荐
if type(x) is int: ...
```

`isinstance` 尊重继承链(`bool` 是 `int`、子类是父类),符合面向对象语义;`type() is` 只判精确类型,会把子类实例误排除。除非你确需"严格排除子类"(极罕见),否则一律 `isinstance`。

### 3.2 判断 None/True/False 用 is,不用 == 或 isinstance

```python
# 推荐
if x is None: ...
if x is True: ...
# 不推荐
if x == None: ...           # 可能被自定义 __eq__ 改写,不可靠
if x is None or x is False or x is True: ...   # 啰嗦
```

`None`/`True`/`False` 是单例,`is` 判身份最直接可靠。`== None` 隐患在于 `__eq__` 可能被改写。注意判"是否为假值"用 `if not x:`,判"是否就是 None"用 `if x is None:`——二者语义不同别混。

### 3.3 用 isinstance 的元组语法判断多类型,而非多个 or

```python
# 推荐
if isinstance(x, (int, float, complex)): ...
# 不推荐
if isinstance(x, int) or isinstance(x, float) or isinstance(x, complex): ...
```

元组参数一次判多个类型,简洁且高效(只沿一次 MRO)。这是 `isinstance` 相对 `type() is` 的另一优势。

### 3.4 处理 bool 与 int 时,先判 bool 短路

```python
# 推荐:bool 先判,避免它落进 int 分支
if isinstance(x, bool):
    handle_bool(x)
elif isinstance(x, int):
    handle_int(x)
# 不推荐:bool 会被 int 分支吃掉
if isinstance(x, int):     # True/False 也会进来!
    handle_int(x)
```

`bool` 是 `int` 子类,凡 `isinstance(x, int)` 处 `bool` 都匹配。需区分时把 `bool` 判断放前。这条陷阱在数字处理逻辑里高频出现。

### 3.5 行为判断优先用 ABC,而非枚举具体类

```python
# 推荐:用 ABC,任何可迭代对象都适用
from collections.abc import Iterable
def process(items):
    if not isinstance(items, Iterable):
        raise TypeError("需要可迭代对象")
    ...
# 不推荐:枚举具体类,新增类型要改代码
if isinstance(items, (list, tuple, set, str, dict, ...)):
    ...
```

ABC(`Iterable`/`Sequence`/`Mapping`/`Sized`/`Hashable`)按行为类别判断,比枚举具体类更通用、更不易遗漏。函数需要"可迭代"就判 `Iterable`,而非写死一串具体类。

### 3.6 能用鸭子类型/EAFP,就不预先判类型

```python
# 推荐(EAFP:请求原谅比许可容易)
def avg(values):
    return sum(values) / len(values)   # 任何"可求和、有长度"的对象都行
# 不推荐(LBYL:预先检查,过度限制)
def avg(values):
    if not isinstance(values, list):
        raise TypeError("必须传 list")
    return sum(values) / len(values)   # 限制死了,元组/生成器都不行
```

Python 风格倾向 EAFP(直接尝试,出错再处理)而非 LBYL(.lookup before you leap,先检查再做)。若你的函数只需对象有某行为,直接用该行为、捕获 `TypeError`/`AttributeError`,比预判类型更灵活。类型判断用于"确需按类型分支不同逻辑"或"防御不可控外部输入",不是默认选项。

### 3.7 取类型名用 __name__,别直接 str(type(x))

```python
# 推荐
name = type(x).__name__     # 'int' 'list',干净
# 不推荐
name = str(type(x))         # "<class 'int'>",带杂信息
```

`type(x).__name__` 给纯类型名,适合日志/错误消息/显示。`str(type(x))` 带 `<class '...'>` 噪音。调试时打印 `type(x)` 可看全,做文案用 `__name__`。

### 3.8 issubclass 的参数必须是类,判实例用 isinstance

```python
# 类与类:issubclass
if issubclass(MyClass, BaseClass): ...
# 实例与类:isinstance(别误用 issubclass(type(x), C),那就是 isinstance 的事)
if isinstance(x, BaseClass): ...
```

记住分工:`isinstance` 判实例、`issubclass` 判类。`issubclass(type(x), C)` 等价 `isinstance(x, C)`,但后者更直接,别绕弯。

### 3.9 判断"是不是某具体容器"仍可用 type(),但慎用

```python
# 偶尔合理:函数语义上只接受真 list(如要就地修改并返回它)
def dedup_inplace(lst):
    if type(lst) is not list:
        raise TypeError("仅接受 list")
    ...
```

少数场景你确实只要"真 list"(不接受 list 子类、不接受 tuple),可用 `type(lst) is list`。但多数情况接受任何 Sequence 更好。用 `type() is` 前自问:我是真的只要精确 list,还是"行为像 list 即可"?后者用 ABC。

### 3.10 动态建类用 class 语句,三参数 type() 仅限框架场景

```python
# 推荐:静态类用 class 语句
class Dog(Animal):
    def bark(self): ...
# 框架/动态场景才用 type()
def make_model(table_name):
    return type(table_name.capitalize(), (BaseModel,), {"__table__": table_name})
```

三参数 `type()` 动态建类威力大但可读性差,日常写死类用 `class`。只有"类结构由运行时数据决定"(ORM、schema 生成、插件)才用 `type()` 动态构造,且需配文档说明。

### 3.11 自定义类若用于 isinstance 判断,继承关系要正确

```python
class Plugin: ...
class AuthPlugin(Plugin): ...     # 显式继承,isinstance(auth, Plugin) 才为 True
# 不要:不继承又想被当作 Plugin(Abc 注册例外)
```

若你的类要被 `isinstance(x, SomeBase)` 判定,必须真正继承 `SomeBase`(或用 ABC 的 `register`)。别指望"我没继承但想被认作某类"——名义类型按继承判定,不继承就不算。

---

## 4. 原理

本章讲清类型系统的底层机制:`type` 与 `object` 自洽关系、`isinstance`/`issubclass` 如何沿 MRO 查找、`type()` 单参/三参的内部差异、ABC 虚拟子类与 `__subclasshook__` 如何让行为判断生效、元类如何定制类的创建。这些是"为什么这样判断有效"的根基。

### 4.1 type 与 object 的自洽关系(需理解,详述)

`type` 与 `object` 的互相引用是 Python 类型系统的基石,要彻底讲清。两条核心事实:

**事实一:`object` 是所有类的根基类。** 每个类(含 `type` 自身)都继承 `object`。所以 `issubclass(int, object)`、`issubclass(type, object)` 都为 `True`——`object` 处于继承链的顶端,万物皆 `object` 子类。

**事实二:`type` 是所有类的类型(元类)。** 每个类对象本身的"类型"是 `type`。所以 `type(int) is type`、`type(object) is type`——连 `object` 这个根基类,它自身的类型也是 `type`。`type` 处于"实例→类"链的顶端,所有类都是 `type` 的实例。

这两个事实看似循环(`type` 继承 `object`、`object` 类型是 `type`),实则在解释器启动时就被 hardcoded 建立为自洽的初始结构:

```python
print(type(object))      # <class 'type'>   —— object 的类型是 type
print(type(type))        # <class 'type'>   —— type 的类型是 type 自己
print(issubclass(type, object))  # True      —— type 继承 object
print(issubclass(object, type))  # False     —— object 不继承 type(它不是元类的子类)
```

用一张"两个维度"的图理解:

```
   继承维度(is a subclass of,向上指父类):
        object  ←── int, str, list, ..., 自定义类
          ↑
         type  ←── (type 也是 object 的子类,特例)

   实例维度(is an instance of,指向类型):
        int 的类型 → type        (类是 type 的实例)
        type 的类型 → type       (type 自举)
        object 的类型 → type    (连 object 也是 type 的实例)
        42 的类型 → int          (普通实例的类型是它的类)
```

关键洞察:

- **`type` 是个"类"**(它继承 `object`),所以 `isinstance(type, object)` 为 `True`、"type 是一个 object"。
- **`type` 又是"造类的类"**(元类),所有类的类型是 `type`,所以 `isinstance(int, type)` 为 `True`、"int 是 type 的实例"。
- **`object` 也是 `type` 的实例**(类是对象,object 这个类也是 type 造的),但 `object` 不是 `type` 的父类——它是 `type` 的祖先类(`type` 继承 `object`)。

这个自洽结构的意义:它让"一切皆对象"在类型层面闭环——任何对象(含类本身)都有类型(指向 `type`),任何类都收束到 `object`。日常不必推演,但理解它能解释:

- 为何 `isinstance(任意对象, object)` 恒 `True`(万物继承 object)。
- 为何 `isinstance(任意类, type)` 恒 `True`(所有类都是 type 的实例)。
- 为何能用 `type(name, bases, dict)` 动态造类(type 是造类的类,调用它就是"让 type 造一个类")。
- 后续元类编程(自定义 `metaclass`)为何继承 `type`——因为 type 就是默认元类,自定义元类是 type 的子类。

### 4.2 isinstance/issubclass 如何沿 MRO 查找(需理解,详述)

`isinstance(x, C)` 与 `issubclass(D, C)` 的实现本质,是沿**方法解析顺序(MRO)**查找,理解它就理解了类型判定的运行机制。

**`issubclass(D, C)` 的判定**:检查 `C` 是否出现在 `D.__mro__` 中。`__mro__` 是 D 的继承链元组(含 D 自己到 object)。`C` 在链上则 `True`。

```python
class A: pass
class B(A): pass
class C(B): pass
print(C.__mro__)          # (C, B, A, object)
print(issubclass(C, A))   # True  —— A 在 C.__mro__ 里
print(issubclass(C, int)) # False —— int 不在链里
```

**`isinstance(x, C)` 的判定**:等价于 `issubclass(type(x), C)`,即取 x 的精确类型,再沿该类型的 MRO 找 C。故 `bool` 实例对 `int` 为 `True`:bool 的 MRO 含 int。

```python
print(type(True).__mro__)        # (bool, int, object)
print(isinstance(True, int))     # True —— int 在 bool 的 MRO 里
print(issubclass(type(True), int))  # True —— 等价写法
```

这个机制解释了之前所有现象:

- `isinstance(True, int)` 为 `True`:bool 的 MRO `(bool, int, object)` 含 int。
- `type(True) is int` 为 `False`:`is` 比的是精确类型(bool ≠ int),不查 MRO。
- `isinstance(d, Animal)` 对 `Dog()` 为 `True`:Dog 的 MRO `(Dog, Animal, object)` 含 Animal。
- `isinstance(42, object)` 恒 `True`:任何类的 MRO 末尾都是 object。

**性能**:沿 MRO 查找是线性的(链长度通常很短,大多数类继承链 2~4 层),故 `isinstance` 比 `type() is`(一次身份比较)略慢,但差异在纳秒级,可忽略。判断类型时正确性优先,用 `isinstance`。

**MRO 的算法**:多继承时 MRO 用 C3 线性化算法计算,保证"子类在父类前、多个父类顺序保留、无矛盾"。菱形继承(`D→B→A`,`D→C→A`)MRO 为 `(D, B, C, A, object)`——B、C 都在 A 前,且 B 在 C 前(按声明顺序)。MRO 不一致会 `TypeError`(无法一致线性化),这是 Python 对多继承冲突的保护。详见面向对象专题,本篇理解"MRO 是继承链元组,isinstance/issubclass 沿它查找"即可。

### 4.3 type() 单参与三参的实现差异

`type()` 既是"取类型"的函数,又是"造类"的元类,这两种身份对应单参与三参两套实现,实为 `type` 作为元类的 `__call__` 行为。

**单参 `type(obj)`**:返回 `obj` 的类型,本质读 `obj` 的 `ob_type` 指针(CPython 内部每个对象头部的类型指针)。这是 O(1) 的字段读取,极快。

**三参 `type(name, bases, dict)`**:这是**调用 `type` 元类来构造新类**。`type(name, bases, dict)` 触发 `type.__call__`,后者执行类创建流程:

1. 调用 `type.__new__(type, name, bases, dict)`:分配新类对象,设置 `__name__`、`__bases__`、`__dict__`,计算 MRO,处理继承的类属性。
2. 调用 `type.__init__(新类, name, bases, dict)`:初始化。

```python
# type("Dog", (), {"bark": lambda self: "汪"}) 的内部流程(简化)
# 1. type.__new__ 创建 Dog 类对象,设置:
#    __name__ = "Dog"
#    __bases__ = ()  → 实际默认 (object,)
#    __dict__ = {"bark": <函数>, ...}
#    __mro__  = (Dog, object)
# 2. type.__init__ 初始化
# 3. 返回 Dog 类对象
```

**为何用 `type` 既能查类型又能造类?** 因为 `type` 是默认元类,类本身就是 `type` 的实例。调用一个类(如 `int(42)`)是"造一个 int 实例";调用 `type(name, bases, dict)` 就是"造一个 type 的实例",而 type 的实例正是"类"——所以三参 `type` 造出来的是类。这是"类是对象、由 type 制造"理念的直接体现。

**与 `class` 语句的关系**:`class Dog(Animal): ...` 在编译期会被翻译为对 `type`（或指定元类）的调用——先用 `type.__prepare__` 准备命名空间,执行类体把名字填进命名空间,最后 `type(name, bases, namespace)` 造类。所以 `class` 语句是三参 `type` 的语法糖,两者等价。理解这点,就能理解"元类可以通过继承 type 并重写 `__new__`/`__init__` 来定制类的创建"——这是 §4.5 元类的基础。

### 4.4 ABC 虚拟子类与 __subclasshook__(需理解,详述)

§2.6 提到一个谜:`list.__mro__` 里没有 `Iterable`,但 `isinstance([], Iterable)` 为 `True`。这背后是 ABC 的**虚拟子类(virtual subclass)**机制——`isinstance`/`issubclass` 不仅查真实 MRO,还会查 ABC 的"虚拟注册"关系。

**虚拟注册 `register`**:ABC 允许把一个类"登记"为它的虚拟子类,无需真实继承:

```python
from abc import ABC
class MyABC(ABC): pass

class Foo: pass          # 不继承 MyABC

MyABC.register(Foo)     # 把 Foo 注册为 MyABC 的虚拟子类
print(issubclass(Foo, MyABC))  # True!但 Foo.__mro__ 里没有 MyABC
print(isinstance(Foo(), MyABC)) # True
```

`register` 后 `Foo` 不是真正继承 `MyABC`(MRO 不变、`Foo` 拿不到 `MyABC` 的方法),但 `issubclass`/`isinstance` 认它。这让 ABC 能"事后"把已有类纳入自己的子类范畴,常用于"让旧类符合新抽象"。

**`__subclasshook__`:更强大的"行为判定"**。`collections.abc` 的内置 ABC 没有用 `register` 逐个注册所有容器类型(那不现实),而是用类方法 `__subclasshook__` 实现"按行为判子类":

```python
# collections.abc.Iterable 的 __subclasshook__ 大致逻辑(简化):
@classmethod
def __subclasshook__(cls, C):
    if cls is Iterable:
        # 任何类只要定义了 __iter__ 方法,就当作 Iterable 的(虚拟)子类
        if any("__iter__" in B.__dict__ for B in C.__mro__):
            return True
    return NotImplemented
```

`issubclass(list, Iterable)` 时,`Iterable.__subclasshook__(list)` 检查 `list` 的 MRO 里有没有 `__iter__`——`list` 实现了 `__iter__`,返回 `True`。这就是"list 没继承 Iterable,却被判为 Iterable 子类"的原因。

这套机制的价值:让"鸭子类型"获得类型判断能力——你不用 `register` 每个类型,ABC 凭"有没有实现协议方法"自动判定。`isinstance(x, Iterable)` 实质就是"检查 x 的类有没有 `__iter__`",比纯鸭子类型(直接 `iter(x)` 试)更前置、更显式,又比枚举具体类更通用。

**自定义 ABC 的 `__subclasshook__`**:你自己的 ABC 也可定义 `__subclasshook__` 实现结构化判子类:

```python
import abc

class Drawable(abc.ABC):
    @classmethod
    def __subclasshook__(cls, C):
        if cls is Drawable:
            if any("draw" in B.__dict__ for B in C.__mro__):
                return True
        return NotImplemented

class Circle:               # 不继承 Drawable
    def draw(self): return "画圆"

print(isinstance(Circle(), Drawable))  # True —— 有 draw 方法即为 Drawable
```

这让 `Drawable` 成为"结构化类型":任何有 `draw` 方法的类都算 `Drawable`,无需继承。这是 Python"结构化类型"在运行时的体现(类型注解的 `Protocol` 是其在静态层的对应,见类型注解专题)。

### 4.5 元类:定制类的创建(简述)

三参 `type` 是默认元类,而**自定义元类**(metaclass)通过继承 `type` 并重写 `__new__`/`__init__`,可以介入"类的创建过程",在类被定义时自动改造它。

```python
# 一个简单元类:自动给所有类加一个 created_by 属性
class MyMeta(type):
    def __new__(mcs, name, bases, namespace):
        namespace["created_by"] = "MyMeta"      # 偷偷加属性
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

class Foo(metaclass=MyMeta):    # 指定元类
    pass

print(Foo.created_by)          # MyMeta —— 元类在创建 Foo 时加的
print(type(Foo))               # <class 'MyMeta'> —— Foo 的类型是 MyMeta 不是 type
print(isinstance(Foo, MyMeta)) # True
```

`class Foo(metaclass=MyMeta)` 时,Python 不用 `type` 而用 `MyMeta` 来造 `Foo` 类:`MyMeta.__new__` 被调用,可修改命名空间、加属性、甚至换基类。造出来的 `Foo` 的类型是 `MyMeta`(而非 `type`)——因为它是 `MyMeta` 的实例。

元类的典型应用:ORM(根据类属性自动生成数据库表映射)、Django/SQLAlchemy 的模型类、自动注册插件、强制接口规范。日常业务极少写元类——它是最强大也最易过度使用的特性,多数"想在类创建时做点事"的需求用 `__init_subclass__` 或类装饰器更简单。元类的深度内容(执行顺序、`__prepare__`、元类冲突)在面向对象专题展开,本篇确立"元类继承 type、可定制类创建、类是元类的实例"的认知即可。

理解元类后,回头再看 `type` 与 `object` 的关系就完整了:`type` 是默认元类,`object` 是默认根基类;自定义元类继承 `type`,自定义类继承 `object`;所有类都是某元类(默认 `type`)的实例,所有类都是 `object` 的子类。这就是"一切皆对象"在类型系统层面的完整图景。

---

## 5. 总结

### 5.1 本文内容回顾

- **类型判断的必要性**:动态类型下需运行时知对象类型,场景含多态输入、防御外部数据、序列化、调试、API 校验。
- **type 与 object**:object 是所有类根基类(万物是 object 子类),type 是所有类的类型/元类(所有类是 type 实例);两者自洽闭环(type 继承 object、type 类型是自身)。
- **三大工具**:`type(obj)` 取精确类型(只精确、不看继承链);`isinstance(obj, cls)` 沿继承链判断(首选);`issubclass(cls, parent)` 判类间继承关系(参数须是类)。
- **type() 用法**:单参取精确类型(`type(True) is int` 为 False),三参 `type(name, bases, dict)` 动态建类;类对象可调用、可取 `__name__`。
- **isinstance()**:沿 MRO 查找,尊重继承(`isinstance(True, int)` 为 True);支持元组多类型;bool 作 int 子类会"渗透"进 int 判断需短路。
- **issubclass()**:判类间关系,参数必须类(传实例报 TypeError);判断实例类型用 isinstance 不用 `issubclass(type(x), C)`。
- **isinstance vs type() is**:前者看继承链(符合 OO 语义、首选),后者只精确类型(罕见用于排除子类)。
- **抽象基类(ABC)**:按行为类别判(`Iterable`/`Sequence`/`Mapping`/`Sized`/`Hashable`),比枚举具体类更通用,介于静态判断与鸭子类型之间。
- **__class__**:通常等价 `type()`,可写(罕见),实用价值在多态构造 `self.__class__(...)`。
- **__mro__**:继承链元组,isinstance/issubclass 沿它查找;bool 的 MRO 含 int 解释其 isinstance 行为。
- **原理**:type/object 自洽关系(实例链收束 type、继承链收束 object);isinstance/issubclass 沿 MRO 线性查找;type 单参读 ob_type、三参是元类 __call__ 造类(class 语句是其语法糖);ABC 虚拟子类靠 register 与 __subclasshook__ 实现行为判定(解释 list 非继承 Iterable 却 isinstance True);元类继承 type 可定制类创建。
- **最佳实践**:判类型用 isinstance、判 None 用 is、多类型用元组、bool 先短路、行为判用 ABC、能 EAFP 就别预判、取类型名用 __name__、issubclass 只判类、type() is 仅限排除子类、动态建类用 class、自定义类要正确继承。

### 5.2 读完本文你应能掌握

- 说明为何动态类型语言仍需运行时类型判断,举出至少三类典型场景。
- 阐述 `type` 与 `object` 的关系:`type` 是元类(所有类的类型)、`object` 是根基类(所有类的祖先),并解释二者的自洽闭环。
- 用 `type()` 单参取对象精确类型,说明其"只精确不看继承"的特性,解释 `type(True) is int` 为何 False。
- 用 `type()` 三参动态创建类,说明它等价于 `class` 语句,指出适用场景。
- 用 `isinstance()` 判断类型,说明它沿继承链查找,解释 `isinstance(True, int)` 为何 True,用元组语法判断多类型,处理 bool 渗透 int 的陷阱。
- 用 `issubclass()` 判断类间继承,说明其参数必须类、判实例用 isinstance。
- 对比 `isinstance` 与 `type() is`,说明何时用哪个、为何 isinstance 是首选。
- 用 `collections.abc` 的 ABC(Iterable/Sequence/Mapping/Sized/Hashable)按行为类别判断,说明其相对枚举具体类的优势。
- 用 `__class__` 做多态构造,说明它与 `type()` 通常等价。
- 用 `__mro__` 查看继承链,解释 isinstance/issubclass 的查找机制。
- 阐述 ABC 虚拟子类(register 与 `__subclasshook__`)如何让"行为判定"生效,解释 list 非继承 Iterable 却 isinstance 为 True。
- 简述元类如何继承 type 定制类创建,指出"类是元类的实例"。

### 5.3 延伸方向

- **抽象基类(ABC)深水区**:`abc.ABC`/`abc.abstractmethod` 定义抽象方法强制子类实现、`register` 虚拟子类、自定义 `__subclasshook__`,见面向对象专题。
- **元类与类创建机制**:`__init_subclass__`、类装饰器、`__prepare__`、元类冲突,以及何时该用元类何时该用更简单手段,见《面向对象 OOP 全套》。
- **协议类型(Protocol)与结构化类型**:类型注解中用 `typing.Protocol` 实现"静态层的鸭子类型",与本篇运行时 ABC `__subclasshook__` 对应,见《类型注解基础》《Union 与 Any 类型》。
- **类型注解与静态检查**:把运行时类型判断延伸到开发期静态保障(`mypy`),见本大章节第 9~13 篇。
- **运行时类型内省**:`typing.get_type_hints`、`inspect` 模块获取函数签名与类型信息,框架/ORM 的类型内省基础。
