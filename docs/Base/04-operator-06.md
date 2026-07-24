---
group:
  title: 【04】运算符和表达式
  order: 4
order: 6
title: 逻辑运算符与短路求值
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是逻辑运算符

逻辑运算符是 Python 中组合布尔条件、进行逻辑判断的运算符,共有三个:`and`(与)、`or`(或)、`not`(非)。当你写 `if age >= 18 and has_id:`、`if is_admin or is_root:`、`if not done:` 时,`and`/`or`/`not` 就是逻辑运算符,它们把多个条件(或真值)组合成一个逻辑结果。逻辑运算符是条件判断的核心——`if`/`while` 的条件、过滤条件、守卫语句,几乎都靠它们组合。

```python
age = 20
has_id = True
print(age >= 18 and has_id)   # True —— 两个条件都真

is_admin = False
is_root = False
print(is_admin or is_root)    # False —— 两个都假

done = False
print(not done)               # True —— 取反
```

Python 的逻辑运算符与 C/Java 的逻辑运算符(`&&`、`||`、`!`)有三个本质差异,这三个差异也是本篇要重点讲透的:

- **Python 用单词 `and`/`or`/`not`,不是符号 `&&`/`||`/`!`**。C/Java 用符号,Python 故意用英文单词,可读性更高,且避免了符号与位运算(`&`/`|`/`~`)的混淆。新手从 C 迁来常误写 `a && b`,Python 报错。
- **`and`/`or` 返回的是操作数本身,不一定是 `bool`**(短路求值 + 返回值规则)。`a and b` 不返回 `True`/`False`,而是返回 `a` 或 `b` 中的一个。`x or default` 在 `x` 为假时返回 `default`(可能是任意类型),这是 Python 设默认值的惯用法。C/Java 的 `&&`/`||` 严格返回布尔。
- **基于真值测试(truthiness),不只接 bool**。Python 的 `and`/`or`/`not` 接受任何对象,按"真值测试规则"判真假(0、空容器、`None` 为假,其余为真),而非要求操作数必须是 `bool`。这让 `if lst and lst[0]:` 这种"列表非空才取首元素"的写法自然成立。

```python
# 三大差异直观对比
# 1. 单词 vs 符号
print(True and False)         # False(Python 用 and)
# print(True && False)        # Python 报错!没有 &&

# 2. 返回操作数本身,不一定是 bool
print(0 or "default")         # 'default' —— 0 为假,or 返回 "default"(不是 True)
print(5 and "yes")            # 'yes' —— 5 为真,and 返回 "yes"(不是 True)

# 3. 基于真值测试,不只接 bool
print([] and "never")         # [] —— 空列表为假,and 短路返回 [](不用转成 bool)
print([1] or "default")       # [1] —— 非空列表为真,or 返回 [1]
```

这三个特性里,最强大也最易踩坑的是第二条——**短路求值与返回值规则**。`and`/`or` 不只是"算逻辑真假",它们"返回哪个操作数"的行为,催生了 Python 一系列惯用法:`x or default`(设默认值)、`x and x.method()`(空值守卫)、`a and b or c`(条件表达式雏形,但有陷阱)。理解短路求值和返回值,是掌握 Python 逻辑运算符的核心。

本篇要系统讲透:`and`/`or`/`not` 三个运算符的完整语义、短路求值机制、返回值规则(返回操作数而非 bool)、真值测试(truthiness)如何与逻辑运算符配合、逻辑运算符的优先级与结合性、与位运算符 `&`/`|` 的区别、`and`/`or` 的惯用法与陷阱、如何用 `and`/`or` 模拟条件表达式(及为何优先用 `x if cond else y`),以及背后的求值原理。这是「运算符与表达式」大章节的第六篇,与《bool 类型与短路逻辑》(讲 bool 类型和真值测试规则本身)互为补充——本篇聚焦"逻辑运算符的运算机制",该篇聚焦"bool 类型和真值体系"。

### 1.2 逻辑运算符全表

下面这张表是本篇的总纲,后续每节逐一展开。先建立全局认知。

| 运算符 | 名称 | 语义 | 返回值 | 示例 |
|--------|------|------|--------|------|
| `and` | 逻辑与 | 两操作数都真则真 | 返回第一个假值,都真则返回最后一个 | `True and 5` → `5` |
| `or` | 逻辑或 | 任一操作数为真则真 | 返回第一个真值,都假则返回最后一个 | `0 or "d"` → `"d"` |
| `not` | 逻辑非 | 取反(单目) | 返回 `bool`(`True`/`False`) | `not 0` → `True` |

核心认知三点:

1. **`and`/`or` 返回操作数本身**(经由真值测试决定走哪个,但返回的是原对象,不是 `bool`)。
2. **`not` 永远返回 `bool`**(`not x` 必为 `True`/`False`,这是 `not` 与 `and`/`or` 的关键区别)。
3. **短路**:`and` 遇假即停(返回那个假值),`or` 遇真即停(返回那个真值),后续操作数不求值。

⚠️ 表里"返回值"列是 Python 逻辑运算符最反直觉、也最该牢牢记住的特性。`True and 5` 返回 `5`(不是 `True`)、`0 or "default"` 返回 `"default"`(不是 `True`)——它们返回的是参与运算的**操作数对象**,类型可以是任何东西。只有 `not` 把结果强制成 `bool`。这一条贯穿全篇,后续每节都会展开。

### 1.3 逻辑运算符与位运算符的区别

在深入 `and`/`or` 前,先厘清它们与位运算符 `&`/`|`/`~` 的区别——这是新手(尤其从 C 迁来)极易混淆的一组。Python 里逻辑运算和位运算是**两套完全独立**的运算符,符号和语义都不同。

| 方面 | 逻辑运算符 | 位运算符 |
|------|-----------|---------|
| 符号 | `and` `or` `not`(单词) | `&` `\|` `~` `^` `<<` `>>`(符号) |
| 语义 | 布尔逻辑(基于真值测试) | 整数按位运算 |
| 短路 | ✅ `and`/`or` 短路 | ❌ 不短路(两操作数都求值) |
| 返回 | 操作数本身(`and`/`or`)、bool(`not`) | int(位运算结果) |
| 操作数 | 任意对象(真值测试) | int(或 bool,因 bool 是 int 子类) |

```python
# 逻辑运算符:and/or/not,基于真值测试,短路
print(True and False)         # False
print(0 or 5)                 # 5(or 返回操作数)

# 位运算符:逐位运算,不短路,要求 int
print(5 & 3)                  # 1 (0101 & 0011 = 0001)
print(5 | 3)                  # 7 (0101 | 0011 = 0111)
print(~5)                     # -6 (按位取反)
```

⚠️ **高频混淆陷阱:用 `&` 代替 `and` 做逻辑判断**:

```python
# 危险:用 & 当逻辑与,在布尔上碰巧能用,但语义错误且有坑
a = True
b = False
print(a & b)                  # False —— 碰巧对(bool 是 int,True=1,False=0,1&0=0)
# 但 & 不短路!且对非 bool 会出错或误判
lst = []
# print(lst & [1])            # TypeError!& 要求 int,列表不行
# print(lst and [1])          # [] —— and 基于真值测试,空列表为假短路

# 更危险的:& 优先级高于比较运算符,而 and 低于比较
print(5 > 3 & 2 > 1)          # 实际:5 > (3 & 2) > 1 → 5 > 2 > 1 → True(侥幸)
#                      但意图是 (5>3) and (2>1),碰巧结果对,过程错!
print((5 > 3) & (2 > 1))      # True —— 加括号才是 (True) & (True) = 1 & 1 = 1
print((5 > 3) and (2 > 1))    # True —— 正确写法,and 做逻辑
```

`5 > 3 & 2 > 1` 因 `&` 优先级高于比较运算符,被解析成 `5 > (3 & 2) > 1`(链式比较),而非 `(5>3) and (2>1)`——碰巧结果相同,但语义完全错误,换个数就翻车。**做逻辑判断永远用 `and`/`or`/`not`,不用 `&`/`|`/`~`**;位运算符只用于真正的按位整数运算(标志位、掩码、底层编码)。详见《位运算符》。

`&`/`|` 的"逻辑副效应"仅在 `bool` 上碰巧成立(因 bool 是 int),但它**不短路**且**优先级高**,绝不能当逻辑运算符用。NumPy 等库重载了 `&`/`|` 用于数组逐元素布尔运算(那里 `&`/`|` 是对的,且有特殊规则),但纯 Python 逻辑判断用 `and`/`or`。这条区分是写正确 Python 逻辑代码的底线。

---

## 2. 核心内容

本章详解 `and`/`or`/`not` 的完整用法,每节遵循"规则 → demo → 陷阱 → 场景"展开。重点是短路求值、返回值规则、惯用法与陷阱,因为它们最易在生产代码出问题。

### 2.1 逻辑与 `and`

`and` 运算符要求**两个操作数都为真**时结果才为真。它的求值遵循"遇假即停"的短路规则,且返回的是**操作数本身**(不是 bool)。

**求值与返回规则**:

- 从左到右求值操作数。
- 遇到第一个**假值**,立即返回该假值(短路,后续不求值)。
- 若所有操作数都为真,返回**最后一个**操作数。

```python
print(True and True)          # True —— 都真,返回最后一个 True
print(True and False)         # False —— 遇假,返回 False
print(False and True)         # False —— 第一个就假,短路,返回 False(True 不求值)
print(5 and 3)                # 3 —— 都真(5、3 真值测试为真),返回最后一个 3
print(0 and 5)                # 0 —— 0 为假,短路返回 0(5 不求值)
print(5 and 0)                # 0 —— 5 真,继续,0 假,返回 0
print("a" and "b")            # 'b' —— 都真,返回最后一个 "b"
print("" and "b")             # '' —— 空串为假,短路返回 ""
```

关键认知:`and` 返回的**不是 `True`/`False`,而是参与运算的操作数**。`5 and 3` 返回 `3`(int),`"a" and "b"` 返回 `"b"`(str)。这是因为 `and` 的语义是"返回第一个假值(若有的话),否则返回最后一个值"——它基于真值测试决定走哪条路,但返回的是原对象。

**多操作数 `and`**:

```python
print(1 and 2 and 3)          # 3 —— 全真,返回最后一个
print(1 and 0 and 3)          # 0 —— 遇 0(假)即停,返回 0(3 不求值)
print(0 and 1 and 2)          # 0 —— 第一个就假,返回 0
```

多操作数 `and` 从左到右找第一个假值返回;全真则返回最后一个。短路保证假值后的操作数不求值。

**`and` 的典型用法:前后置条件(都需满足)**:

```python
# 用户必须是管理员 且 已激活
if user.is_admin and user.is_active:
    grant_access()

# 文件存在 且 可读
if os.path.exists(path) and os.access(path, os.R_OK):
    read_file(path)

# 多重校验:年龄、身份、信用(全满足才放行)
if age >= 18 and has_id and credit_ok:
    approve()
```

`and` 用于"多个条件必须同时成立"的场景。注意短路的好处:`os.access` 只在 `os.path.exists` 为真时才调用(文件不存在就不必检查可读性),既高效又避免对不存在文件操作报错。

### 2.2 逻辑或 `or`

`or` 运算符在**任一操作数为真**时结果为真。它的求值遵循"遇真即停"的短路规则,返回的也是**操作数本身**。

**求值与返回规则**:

- 从左到右求值操作数。
- 遇到第一个**真值**,立即返回该真值(短路,后续不求值)。
- 若所有操作数都为假,返回**最后一个**操作数。

```python
print(True or False)          # True —— 第一个真,短路返回 True
print(False or True)          # True —— 第一个假,继续,第二个真,返回 True
print(False or False)         # False —— 都假,返回最后一个 False
print(5 or 3)                 # 5 —— 5 真,短路返回 5(3 不求值)
print(0 or 5)                 # 5 —— 0 假,继续,5 真,返回 5
print(0 or "")                # '' —— 都假,返回最后一个 ""
print("a" or "b")             # 'a' —— 第一个真,返回 "a"
```

与 `and` 对称:`or` 返回第一个真值(若有的话),否则返回最后一个值。`5 or 3` 返回 `5`,`0 or 5` 返回 `5`(0 假,5 真返回 5)。返回的也是原操作数对象,不一定是 bool。

**多操作数 `or`**:

```python
print(0 or 0 or 3)            # 3 —— 前两个假,返回第一个真 3
print(1 or 2 or 3)            # 1 —— 第一个真,短路返回 1
print(0 or "" or None)        # None —— 都假,返回最后一个 None
```

多操作数 `or` 从左到右找第一个真值返回;全假则返回最后一个。

**`or` 的典型用法一:设默认值(Python 最经典惯用法之一)**:

```python
# 用户没传名字,用默认值
name = user_input or "anonymous"
# user_input 为空串/None/0(假)时,name = "anonymous"
# user_input 非空(真)时,name = user_input

# 配置优先级:命令行 > 环境变量 > 默认值
config = cli_arg or env_var or "default"

# 获取列表,若为 None 用空列表(避免 None.append 报错)
items = provided or []
```

`x or default` 是设默认值的标准写法:`x` 为真(有值)用 `x`,为假(空/None)用 `default`。比 `if x: ... else: default = ...` 简洁。注意它对**所有假值**触发默认(`0`、`0.0`、空串、空列表、`None`),若 `0` 是合法值会有坑(见 §2.6 陷阱)。

**`or` 的典型用法二:多选一(任一满足)**:

```python
# 角色为管理员 或 root,放行
if user.is_admin or user.is_root:
    grant()

# 周末 或 节日,放假
if is_weekend or is_holiday:
    rest()

# 任一缓存命中就不用查库
if cache_hit or redis_hit:
    return cached
```

`or` 用于"多条件满足其一即可"。短路的好处:第一个真就停,后续昂贵检查(如查库)可省。

### 2.3 逻辑非 `not`

`not` 是单目运算符,对操作数**取反**。与 `and`/`or` 不同,`not` **永远返回 `bool`**(`True`/`False`),这是它的关键特性。

**求值与返回规则**:

- 对操作数做真值测试。
- 真 → 返回 `False`,假 → 返回 `True`。

```python
print(not True)               # False
print(not False)              # True
print(not 5)                  # False —— 5 真值测试为真,not 返回 False
print(not 0)                  # True —— 0 假,not 返回 True
print(not "hello")            # False —— 非空串真,not 返回 False
print(not "")                 # True —— 空串假,not 返回 True
print(not [1, 2])             # False —— 非空列表真
print(not [])                 # True —— 空列表假
print(not None)               # True —— None 假
```

`not` 把任意对象转成它的真值取反的 `bool`。`not 5` 为 `False`、`not 0` 为 `True`、`not []` 为 `True`。注意 `not` 返回的是**真 bool**(`True`/`False`),不像 `and`/`or` 返回操作数本身。

**`not` 等价于 `bool()` 取反**:`not x` 等价 `not bool(x)`,即先转 bool 再取反。所以 `not` 可看作"对象 → bool → 取反"的一步操作:

```python
print(not 0 == bool(0))       # True == False? 比较:bool(0)=False, not 0=True, True==False→False
# 上面演示易混,简化:
print(not 0)                  # True
print(not bool(0))            # True —— 等价
```

**`not` 的典型用法**:

```python
# 列表为空判断(推荐 not,比 len()==0 更 Pythonic)
if not items:
    print("空列表")
# 等价 if len(items) == 0:,但 not 更简洁,PEP 8 推荐

# 取反布尔条件
if not is_valid:
    reject()

# not in / not is(组合运算符)
if key not in d:              # not in 是合成运算符
    d[key] = default
if x is not None:             # is not 是合成运算符
    use(x)
```

⚠️ **`not` 优先级高于 `and`/`or`**:`not a and b` 解析为 `(not a) and b`,不是 `not (a and b)`:

```python
print(not True and False)     # False —— (not True) and False = False and False = False
print(not (True and False))   # True —— not (False) = True
# 两者不同!not 优先级高,默认只作用于紧跟的操作数
```

要 `not` 作用于整个表达式,加括号 `not (a and b)`。这条优先级规则后续 §2.5 详述。`not in`、`is not` 是**合成的比较运算符**(一个整体),优先级与比较运算符同级,比 `not` 低,不要与逻辑 `not` 混淆。

### 2.4 短路求值详解(重点)

短路求值(short-circuit evaluation)是 `and`/`or` 的核心机制:`and` 遇假即停、`or` 遇真即停,后续操作数**不求值**。这不仅是性能优化,更是 Python 惯用法的根基——它让你能"安全地引用可能不存在的对象"。

**`and` 的短路:遇假即停**

```python
def check_b():
    print("check_b 被调用")
    return True

print(True and check_b())     # check_b 被调用  True(第一个真,继续算 check_b)
print(False and check_b())    # False —— 第一个假,短路,check_b 不调用!(无输出)
```

`False and check_b()` 因第一个 `False` 假,短路返回 `False`,`check_b()` 根本不调用。这让 `and` 能做"前置守卫":

```python
# 守卫:列表非空才取首元素(避免 IndexError)
lst = []
first = lst and lst[0]        # lst 为空(假),短路返回 [],不取 lst[0](否则 IndexError)
print(first)                  # []
lst = [1, 2]
first = lst and lst[0]        # lst 非空(真),返回 lst[0] = 1
print(first)                  # 1

# 守卫:对象非 None 才调方法(避免 AttributeError)
user = None
name = user and user.name     # user 为 None(假),短路返回 None,不取 .name
print(name)                   # None
```

`lst and lst[0]` 是"安全取首元素"的经典守卫:空列表时短路返回 `[]`(不取 `[0]` 避免越界),非空时返回首元素。这种"用 `and` 做空值守卫"的写法,比 `if lst: first = lst[0] else: first = None` 简洁,但要读懂"返回的是 `lst` 或 `lst[0]`"。

**`or` 的短路:遇真即停**

```python
def expensive_default():
    print("expensive 被调用")
    return "default"

print(5 or expensive_default())   # 5 —— 5 真,短路,expensive 不调用
print(0 or expensive_default())   # expensive 被调用  default(0 假,继续算)
```

`5 or expensive_default()` 因 `5` 真,短路返回 `5`,`expensive_default()` 不调用。这让 `or` 设默认值时,有值就不算昂贵的默认:

```python
# 守卫:有缓存就用缓存,没有才查库(昂贵)
result = cache.get(key) or db_query(key)
# cache 命中(真)→ 用缓存,db_query 不调
# cache 未命中(None/假)→ 查库
```

**短路的本质:基于真值测试的提前返回**。短路不是"`and`/`or` 特殊做的优化",而是它们**求值规则的自然结果**:`and` 的结果在"找到第一个假值"时已确定(必为假),继续求值无意义,故停;`or` 的结果在"找到第一个真值"时已确定(必为真),故停。C/Java 的 `&&`/`||` 同样短路,但 Python 额外让短路时**返回那个决定性的操作数**(而非固定 `true`/`false`),这是 Python 的特色。

⚠️ **短路带来的"条件不评估"陷阱**:因短路,某些操作数可能完全不执行(包括副作用)。依赖副作用的逻辑要小心:

```python
# 陷阱:依赖自增副作用,短路导致不执行
i = 0
False and (i := i + 1)        # 短路,i 不自增
print(i)                      # 0 —— 副作用未发生

# 对比:若用 & (不短路),副作用会执行,但 & 不是逻辑运算符(见 1.3)
# 所以:别把有副作用的表达式放 and/or 右侧并依赖其执行
```

不要把"必须执行"的副作用逻辑放在 `and`/`or` 的可能被短路的位置。若副作用必须发生,用显式 `if` 而非 `and`/`or`。

### 2.5 逻辑运算符的优先级与结合性

`and`/`or`/`not` 之间的优先级,以及它们与比较运算符的关系,是写复杂条件时必须厘清的。

**三者优先级(从高到低)**:`not` > `and` > `or`。

```python
# not 高于 and 高于 or
print(not True or False)      # False —— (not True) or False = False or False = False
print(not True and False)     # False —— (not True) and False = False and False = False
print(True or False and False)# True —— True or (False and False) = True or False = True
```

**与比较运算符的关系**:**比较运算符(`<` `>` `==` `<=` `>=` `!=` `is` `in` 等)优先级高于 `not`**,更高于 `and`/`or`。所以 `a < b and c > d` 不用加括号,比较先算:

```python
x, y = 5, 3
print(x > y and y > 0)        # True —— (x>y) and (y>0),比较先算
# 等价 (x > y) and (y > 0),不用括号

# 但 not 与比较结合要注意
print(not x > y)              # False —— not (x > y) = not True = False(not 优先级低于 >)
print((not x) > y)            # False —— (False) > 3?即 0 > 3 = False(通常无意义,别这么写)
```

`not x > y` 等价 `not (x > y)`(因比较优先级高于 not),结果是 `not True` = `False`。这是期望的"对比较结果取反"。但 `(not x) > y` 是 `False > 3`(0 > 3)——无意义,别这么写。要取反比较,直接 `not (x > y)` 或用反向比较 `x <= y`。

**结合性**:`and`/`or` 是**左结合**(`a and b and c` = `(a and b) and c`),`not` 是右结合(`not not a` = `not (not a)`)。但因短路和返回值规则,左结合的实际效果就是"从左到右依次短路"。

```python
# 左结合:从左到右求值短路
print(0 or 0 or 3)            # 3 —— ((0 or 0) or 3) = (0 or 3) = 3
print(1 and 2 and 0)          # 0 —— ((1 and 2) and 0) = (2 and 0) = 0
```

**复杂条件建议加括号**:虽有优先级规则,但生产代码不应让人背优先级。复杂逻辑用括号明确分组:

```python
# 不推荐:依赖优先级,难读
# if a or b and c or d: ...   // 是 a or (b and c) or d,读者要心算

# 推荐:括号明确
if a or (b and c) or d: ...
if (a or b) and (c or d): ...  # 明确"任一A组 且 任一B组"
```

完整优先级(含算术、位运算等)见《运算符优先级完整表》。本篇只关注逻辑运算符内部及与比较的关系。

### 2.6 `and`/`or` 惯用法与陷阱(重点)

`and`/`or` 的返回值特性催生了一系列惯用法,但也藏着陷阱。这是本篇最实战的部分。

**惯用法一:设默认值(`or`)**

```python
name = input_name or "anonymous"     # 空名 → 默认
host = config.host or "localhost"    # 未配置 → 默认
items = data or []                   # None/空 → 空列表(避免 None.append)
```

`x or default` 设默认值,简洁优雅。但见下"假值陷阱"。

**惯用法二:空值守卫(`and`)**

```python
first = lst and lst[0]               # 空列表安全(短路不取 [0])
name = obj and obj.name              # None 安全(短路不取 .name)
# 等价三目:first = lst[0] if lst else None
```

`a and a.x` 做空值守卫,a 为空/None 时短路返回 a(不取 a.x 避免异常)。可读性见仁见智,现代 Python 更推荐三目 `a.x if a else None`(§2.7)。

**惯用法三:链式设默认(`or` 链)**

```python
# 多级回退:第一个真值
value = primary or secondary or fallback or "default"
```

`or` 链找第一个真值,适合多级配置回退(命令行 > 环境变量 > 配置文件 > 默认)。

⚠️ **陷阱一:`or` 设默认值对所有假值触发,`0`/`0.0` 是合法值时出错**

```python
# 危险:0 是合法值,但 or 会把它当假替换掉
count = user_count or 10       # user_count=0 时,count=10!丢了 0
# 期望:user_count 为 None/未设时用 10,0 应保留

# 正确:用 is None 判断(None 才默认,0 保留)
count = user_count if user_count is not None else 10
# 或
count = 10 if user_count is None else user_count
```

`or` 对**所有假值**(0、0.0、空串、空列表、None)触发默认。若 0、空串是合法值(如"数量 0"、"空密码"),`x or default` 会错误替换。这种场景必须用 `is None` 显式判断(只对 None 设默认,保留 0)。

⚠️ **陷阱二:`a and b or c` 当条件表达式,在 b 为假时出错**

```python
# 旧式"条件表达式":a 真则 b,否则 c
# 意图:如果 flag 则选 yes_val 否则 no_val
flag = True
yes_val = "yes"
no_val = "no"
result = flag and yes_val or no_val
print(result)                  # 'yes' —— 似乎对?flag 真时 (flag and yes_val)=yes_val,或 yes_val or no_val=yes_val

# 但 yes_val 为假时出错!
flag = True
yes_val = ""                   # 假值
result = flag and yes_val or no_val
print(result)                  # 'no'! —— flag 真却返回 no,因为 (flag and "")="" 假,空 or no_val=no_val
```

`a and b or c` 在 `b` 为假值时崩溃:`a and b` 得到假值 `b`,再 `假 or c` 得 `c`(而非期望的 `b`)。所以**不要用 `a and b or c` 当条件表达式**——b 可能为假就错。现代 Python 用三目 `b if a else c`(§2.7),无此陷阱。

⚠️ **陷阱三:混淆"返回操作数"与"返回 bool"**

```python
# 误以为 and/or 返回 bool
x = 5 and 3                    # x = 3(int),不是 True!
if x:                          # 但 3 真值测试为真,if 能用
    print("x 真值")

# 需要真 bool 时,用 bool() 显式转换
x = bool(5 and 3)              # True —— 强制 bool
flag = not (5 and 3)           # False —— not 返回 bool
```

`and`/`or` 返回操作数(int/str/list...),不是 bool。多数场景(放 `if` 条件)因真值测试能正常工作,但若你要把结果当**严格 bool** 用(如传给类型注解为 bool 的函数、序列化为 JSON 的布尔字段),需 `bool()` 显式转换。`not` 则天然返回 bool,可作为"对象转 bool"的快捷方式(`not not x` ≡ `bool(x)`)。

### 2.7 用三目表达式替代 `and`/`or` 模拟条件

由于 `and`/`or` 模拟条件表达式有陷阱(§2.6 陷阱二),Python 有专门的**条件表达式(三目运算符)**`x if cond else y`,应优先使用它。

```python
# 三目表达式:cond 真则 x,否则 y
result = "yes" if flag else "no"
# 比 flag and "yes" or "no" 更安全(无 b 为假陷阱)、更清晰

# 设默认值(处理 0 合法的场景)
count = user_count if user_count is not None else 10   # None 才默认,0 保留

# 空值守卫
first = lst[0] if lst else None                        # 空列表返回 None

# 多分支(嵌套三目,慎用,可读性)
grade = 'A' if s >= 90 else 'B' if s >= 80 else 'C'    # 链式三目
```

三目 `b if a else c` 语义清晰:条件真取 `b`,假取 `c`,且**只求值选中分支**(短路)。它避免了 `a and b or c` 的 b-假陷阱,是 Python 表达"条件取值"的推荐方式。详见《三元表达式》。

**何时仍用 `and`/`or`**:

- **设默认值且确认假值都不合法**:`name = input or "default"`(input 为空串/None 时默认,空串本就不合法)。但要警惕 0 陷阱。
- **空值守卫的简写**:`lst and lst[0]`(虽三目更清晰,守卫式 `and` 在简短场景可接受)。
- **真逻辑组合**(不是模拟三目):`if a and b or c:` 这种真布尔逻辑用 `and`/`or`,三目不适用。

原则:**模拟"条件取值"用三目,真布尔逻辑组合用 `and`/`or`**。别用 `and`/`or` 模拟三目(有陷阱),也别用三目做 `and`/`or` 的逻辑组合(冗长)。

### 2.8 综合示例:逻辑运算符实战

下面这个片段集中演示 `and`/`or`/`not` 的典型用法与易错点,阅读时对照每段行为:

```python
# 1. and/or/not 基础与返回值
print("=== 返回值 ===")
print(f"5 and 3 = {5 and 3}")          # 3(返回操作数,非 True)
print(f"0 or 5 = {0 or 5}")            # 5
print(f"not 0 = {not 0}")              # True(not 返回 bool)
print(f"not 5 = {not 5}")              # False
print(f"'a' and 'b' = {'a' and 'b'}")  # 'b'
print(f"'' or 'd' = {'' or 'd'}")      # 'd'

# 2. 短路:遇假/遇真即停
print("=== 短路 ===")
def f(name):
    print(f"  调用 {name}")
    return True
print(False and f("A"))               # False,f("A") 不调用
print(True or f("B"))                 # True,f("B") 不调用
print(True and f("C"))                # 调用 f("C")  True
print(False or f("D"))                # 调用 f("D")  True

# 3. 设默认值(or 惯用法)
print("=== 默认值 ===")
user_input = ""
name = user_input or "anonymous"
print(f"name = {name}")               # anonymous
host = None or "" or "localhost"
print(f"host = {host}")               # localhost(多级回退)

# 4. 空值守卫(and 惯用法)
print("=== 空值守卫 ===")
lst = []
print(f"空列表 lst and lst[0]: {lst and lst[0]}")  # [](安全,不取[0])
lst = [7]
print(f"非空 lst and lst[0]: {lst and lst[0]}")    # 7

# 5. or 设默认的 0 陷阱
print("=== 0 陷阱 ===")
user_count = 0
count_bad = user_count or 10          # 10!丢了 0
count_good = user_count if user_count is not None else 10  # 0(保留)
print(f"or 误设: {count_bad}, is None 正确: {count_good}")

# 6. a and b or c 的 b-假陷阱
print("=== 三目陷阱 ===")
flag, yes_val, no_val = True, "", "no"
bad = flag and yes_val or no_val      # 'no'!flag 真却返 no
good = yes_val if flag else no_val    # ''(正确)
print(f"and/or 模拟(错): {bad!r}, 三目(对): {good!r}")

# 7. 优先级:not > and > or
print("=== 优先级 ===")
print(not True or False)              # False ((not True) or False)
print(True or False and False)        # True (True or (False and False))
print(not 5 > 3)                      # False (not (5>3) = not True)

# 8. 与位运算符区别(别用 & 当 and)
print("=== 位运算区别 ===")
print(5 & 3)                          # 1(位运算,非逻辑)
# 5 > 3 & 2 > 1  侥幸对但语义错,应:
print((5 > 3) and (2 > 1))            # True(正确逻辑)

# 9. 真逻辑组合
print("=== 逻辑组合 ===")
is_admin, is_active = True, True
print(is_admin and is_active)         # True(都真)
print(is_admin or is_active)          # True(任一真)
print(not is_admin)                   # False
```

跑一遍这段示例,对照输出:返回操作数(非 bool)、短路(不调用)、设默认值、空值守卫、0 陷阱、`a and b or c` 的 b-假陷阱、优先级 not>and>or、与位运算 `&` 区别、真逻辑组合——逻辑运算符的完整图景就清晰了。核心结论:**`and`/`or` 返回操作数且短路(`not` 返回 bool);设默认用 `or`(警惕 0 陷阱)、守卫用 `and`;模拟条件取值用三目别用 `and/or`;真布尔逻辑用 `and/or/not`;逻辑判断绝不用 `&`/`|`**。

---

## 3. 最佳实践

### 3.1 条件判断用 `and`/`or`/`not`,绝不用 `&`/`|`/`~`

```python
# 推荐:逻辑运算符(单词),短路,基于真值测试
if is_valid and has_perm: ...
if a or b: ...
if not done: ...

# 危险:位运算符当逻辑用,不短路、优先级高、非 int 报错
# if a & b: ...        // 不短路,5>3 & 2>1 优先级错乱
# if lst & [1]: ...    // TypeError,列表不支持 &
```

逻辑判断一律用 `and`/`or`/`not`(单词)。`&`/`|`/`~` 是位运算符,不短路、优先级高于比较(`5 > 3 & 2 > 1` 解析错乱)、非 int 报错,绝不能当逻辑运算符。两者仅在 bool 操作数上"碰巧"结果一致,但语义和陷阱完全不同。详见《位运算符》。

### 3.2 设默认值用 `or`,但 0/空串合法时改用 `is None`

```python
# 推荐:假值都不合法时,or 简洁
name = input_name or "anonymous"
items = data or []

# 推荐:0/空串是合法值时,用 is None(只对 None 设默认)
count = user_count if user_count is not None else 10   # 0 保留
text = config if config is not None else ""            # 空串保留

# 错误:0 是合法值却用 or,丢 0
# count = user_count or 10  # user_count=0 时变 10!丢了 0
```

`x or default` 对所有假值(0、0.0、空串、空列表、None)触发默认。空名/None 默认时用 `or` 简洁;但 0、空串是合法值时,`or` 会错误替换,必须用 `x if x is not None else default`(只对 None 设默认,保留 0/空串)。判断标准:0/空串是否合法值——合法用 `is None`,不合法用 `or`。

### 3.3 条件取值用三目 `x if cond else y`,别用 `and/or` 模拟

```python
# 推荐:三目,无陷阱,清晰
result = "yes" if flag else "no"
first = lst[0] if lst else None
count = x if x is not None else 10

# 危险:and/or 模拟三目,b 为假时出错
# result = flag and yes_val or no_val  # yes_val="" 时返 no_val(错)
```

模拟"条件取值"(真取 A、假取 B)用三目表达式 `A if cond else B`。`flag and A or B` 在 A 为假值时崩溃(得 B 而非 A),有陷阱。三目只求值选中分支、语义清晰、无陷阱,是标准方式。`and`/`or` 只用于真布尔逻辑组合(都满足/任一满足),不用于模拟条件取值。详见《三元表达式》。

### 3.4 用 `and`/`or` 短路做安全守卫,但保持可读

```python
# 可接受:简短守卫
first = lst and lst[0]               # 空列表安全
name = user and user.name            # None 安全

# 更清晰:三目(复杂场景推荐)
first = lst[0] if lst else None

# 守卫链:多步安全访问
city = user and user.addr and user.addr.city   # 链式守卫,但难读
# 复杂链式用 try/except 或 getattr 更清晰
city = getattr(getattr(user, 'addr', None), 'city', None)
```

`a and a.x` 做空值守卫利用短路避免异常,简短场景可接受。但多步链式(`a and a.b and a.b.c`)难读,复杂场景用三目、`getattr` 链或 `try/except` 更清晰。可读性优先,守卫式 `and` 仅用于一行能看懂的简短情况。

### 3.5 `not` 用于"空/假判断",比 `len()==0` 更 Pythonic

```python
# 推荐:not 判空
if not items: ...                    # 空列表/None
if not name: ...                     # 空串/None
if not user: ...                     # None/假

# 不推荐:len 判空,啰嗦
# if len(items) == 0: ...
# if items == []: ...
```

判空用 `not x`(基于真值测试),比 `len(x) == 0` 或 `x == []` 更简洁、更 Pythonic(PEP 8 推荐)。`not` 适用于所有"空即假"的对象(列表、字典、字符串、None)。但要明确语义:`not items` 对空列表和 None 都为真,若需区分用 `is None`。

### 3.6 复杂逻辑加括号,别依赖优先级记忆

```python
# 推荐:括号明确分组
if (a or b) and (c or d): ...        # 任一A组 且 任一B组
if not (a and b): ...                # 对整体取反

# 不推荐:依赖 not>and>or 优先级,难读
# if a or b and c or d: ...           // a or (b and c) or d,读者要心算
# if not a and b: ...                 // (not a) and b,易误读为 not (a and b)
```

虽有 `not > and > or` 优先级规则,但生产代码不应让读者背优先级。复杂逻辑用括号明确分组意图,尤其 `not` 与 `and`/`or` 混用、`and`/`or` 混用时。可读性优先于简洁。

### 3.7 别把必须执行的副作用放进可能被短路的位置

```python
# 危险:依赖副作用,短路导致不执行
# False and log_event()        # 短路,log_event 不调用
# data or initialize()         # data 真时 initialize 不调用

# 推荐:副作用用显式 if
if not data:
    initialize()               # 明确保证执行
if condition:
    log_event()
```

`and`/`or` 短路会使右侧操作数可能完全不评估(含副作用)。若某操作(日志、初始化、状态更新)必须执行,不要放在 `and`/`or` 的可能被短路位置,改用显式 `if` 保证执行。`and`/`or` 用于"求值取值",不用于"控制副作用执行"。

### 3.8 需要严格 bool 时用 `bool()` 或 `not not`,别直接用 `and`/`or` 结果

```python
# 推荐:需要 bool 显式转换
is_set = bool(value)                 # 任意 → bool
is_set = not not value               # 等价(双 not 转换)

# 陷阱:and/or 结果不一定是 bool
flag = value and other              # 可能是 other(int/str),不是 bool
# 传给要求 bool 的接口可能出问题:API(field: bool)、JSON 序列化
```

`and`/`or` 返回操作数本身(int/str/list...),非 bool。放 `if` 条件没问题(真值测试),但传给类型注解为 bool 的函数、序列化为 JSON 布尔字段、需严格 bool 的接口时,要用 `bool()` 显式转换(`not not x` 是快捷等价)。`not` 天然返回 bool,可用于转换。

### 3.9 `not in`/`is not` 是合成运算符,优先用它们

```python
# 推荐:合成运算符
if key not in d: ...
if x is not None: ...

# 不推荐:拆开
# if not key in d: ...          // 虽等价,但 not in 更清晰(PEP 8)
# if not x is None: ...         // is not 更清晰
```

`not in`、`is not` 是合成的比较运算符(一个整体),比 `not (x in d)`、`not (x is None)` 更清晰,PEP 8 推荐使用。它们优先级与比较运算符同级(高于逻辑 `not`),不要与逻辑 `not` 混淆。

### 3.10 真值测试优先于显式 bool 比较

```python
# 推荐:真值测试
if items: ...                        # 非空
if user: ...                         # 非 None/假
while line: ...                      # 非空行

# 不推荐:显式比 bool
# if items == True: ...              // 几乎总错(列表不等于 True)
# if user is True: ...               // 除非真要严格布尔 True
# if bool(items) == True: ...        // 啰嗦
```

Python 鼓励真值测试(`if items:` 而非 `if bool(items) == True:`),简洁且符合习惯。直接把对象放条件位置,Python 自动真值测试。除非严格需区分 `True` 与其他真值(`1`、非空列表都是真但不是布尔 `True`),否则用真值测试,不与 `True`/`False` 显式比较。

### 3.11 多级回退用 `or` 链,清晰表达优先级

```python
# 推荐:or 链表多级回退
value = cli_arg or env_var or config_val or "default"
# 语义清晰:从前到后找第一个真值

# 不推荐:嵌套三目
# value = cli_arg if cli_arg else (env_var if env_var else (config_val if config_val else "default"))
```

多级配置回退(命令行 > 环境变量 > 配置 > 默认)用 `or` 链最清晰:从左到右找第一个真值。比嵌套三目简洁。但仍要注意 0/空串陷阱(若某级 0 是合法值,改用 `is None` 链)。

---

## 4. 原理

本章讲清逻辑运算符背后的机制:短路求值的实现、`and`/`or` 为何返回操作数而非 bool、真值测试如何参与、优先级的语法依据、与位运算符的本质区别。这些是"逻辑运算符为何如此"的根基。

### 4.1 短路求值与返回值的实现:`and`/`or` 的求值规则

`and`/`or` 的"短路 + 返回操作数"行为,源于它们在 Python 求值模型里的定义——它们是**控制流运算符**,不只是"算布尔值"。

**`and` 的求值规则**(等价伪代码):

```python
def and_eval(a, b):
    if not a:          # a 真值测试为假
        return a       # 短路:返回 a 本身(假值),b 不求值
    else:
        return b       # a 真:返回 b(求值 b),b 的真值即结果
```

`a and b`:若 `a` 假,返回 `a`(短路,b 不算);若 `a` 真,返回 `b`(b 的值即结果,因 a 已真)。这解释了为何 `5 and 3` 返回 `3`(5 真,返回 b=3),`0 and 5` 返回 `0`(0 假,短路返回 a=0)。

**`or` 的求值规则**:

```python
def or_eval(a, b):
    if a:              # a 真值测试为真
        return a       # 短路:返回 a 本身(真值),b 不求值
    else:
        return b       # a 假:返回 b(求值 b)
```

`a or b`:若 `a` 真,返回 `a`(短路);若 `a` 假,返回 `b`。这解释了 `5 or 3` 返回 `5`(5 真短路),`0 or 5` 返回 `5`(0 假返回 b=5)。

**关键洞察:`and`/`or` 返回的是"决定结果的操作数",而非布尔值**。`and` 的结果由"第一个假值"决定(若有假值,结果就是它;全真则是最后一个),`or` 的结果由"第一个真值"决定(若有真值,结果就是它;全假则是最后一个)。这套"返回决定性操作数"的规则,让 `x or default`、`x and x.method()` 这些惯用法成为可能——它们返回的是有意义的对象,而非干瘪的 `True`/`False`。

**短路是求值规则的自然结果**:不是"`and`/`or` 特殊优化",而是"结果已确定时继续求值无意义"。`and` 遇假时结果必为该假值(无论 b 是什么),故停;`or` 遇真时结果必为该真值,故停。C/Java 的 `&&`/`||` 也短路(同样原理),但它们返回固定 `true`/`false`,而 Python 返回决定性操作数——这是 Python 的特色,源于"对象 + 真值测试"模型(任何对象有真值,所以返回对象本身有意义)。

**`not` 为何返回 bool**:与 `and`/`or` 不同,`not` 的语义是"取反",它的结果空间只有"真/假"两态,故 Python 规定 `not` 返回 `bool`(`not x` ≡ `not bool(x)`,必为 `True`/`False`)。`and`/`or` 的结果空间是"任意对象"(返回操作数),`not` 的结果空间是"布尔"(返回 bool)——这是三者返回类型不同的根源。

### 4.2 真值测试(truthiness):逻辑运算符的基础

`and`/`or`/`not` 的"判真假"基于**真值测试**(truth testing),而非"操作数是否为 bool"。真值测试定义了"任意对象如何被判真假",是逻辑运算符的基础机制。

**真值测试规则**(详见《bool 类型与短路逻辑》):

- **假值**:`False`、`None`、`0`/`0.0`/`0j`(零)、空序列(`""`、`[]`、`()`)、空映射(`{}`)、自定义类定义了 `__bool__` 返回 `False` 或 `__len__` 返回 0。
- **真值**:除上述假值外的所有对象(非零数、非空容器、非 None 对象等)。

```python
# 逻辑运算符对任意对象工作(基于真值测试)
print([] and "x")             # [] —— 空列表假,短路返回 []
print([0] or "d")             # [0] —— 非空列表真,返回 [0](注意 [0] 内含 0 但列表非空,整体真)
print(0.0 or 1)               # 1 —— 0.0 假,返回 1
print({} and "x")             # {} —— 空字典假
```

`and`/`or`/`not` 调用对象的真值测试(`__bool__` 或 `__len__`)判真假,而非检查 `isinstance(x, bool)`。这让逻辑运算符能接受任何对象——`if lst and lst[0]:` 里 `lst`(列表)直接被真值测试,无需 `if bool(lst) and ...`。

**真值测试的实现**:`bool(obj)`(以及 `if`/`and`/`or` 等布尔语境)按如下顺序判 obj 真假:

1. 调 `obj.__bool__()`,返回即用。
2. 无 `__bool__`,调 `obj.__len__()`,0 为假,非 0 为真。
3. 都没有,默认为真(`object` 没有 `__bool__`/`__len__`,默认真)。

```python
class MyContainer:
    def __init__(self, items): self.items = items
    def __len__(self):         # 定义 __len__ 决定真值
        return len(self.items)

c = MyContainer([])
print(bool(c))                 # False —— __len__ 返回 0,假
c = MyContainer([1])
print(bool(c) and "非空")      # '非空' —— __len__ 非 0,真
```

自定义类通过 `__bool__` 或 `__len__` 定义真值,逻辑运算符自动遵守。这让"我的类能否在 `if` 里用"由类自己决定。理解真值测试是逻辑运算符基础,就理解了为何 `and`/`or` 能接任意对象,以及如何让自定义类的真值符合预期。详见《bool 类型与短路逻辑》。

### 4.3 优先级与结合性的语法依据

`not` > `and` > `or` 的优先级,以及它们低于比较运算符,源于 Python 语法的设计——让最常见的条件表达式写起来不用加括号。

**为何比较运算符优先级最高(在逻辑/位运算中)**:条件里最常见的是"比较 + 逻辑组合",如 `if a < b and c > d:`。让比较(`<`、`>`)优先级高于 `and`,则 `a < b and c > d` 自动解析为 `(a < b) and (c > d)`,不用括号。这符合直觉——你写 `if age >= 18 and has_id:` 时,期望"两个比较结果再逻辑与",而非"先逻辑与再比较"。Python 让比较优先级高,使这类表达式自然。

**为何 `not` > `and` > `or`**:

- `not` 是单目(只作用于一个操作数),优先级高于双目的 `and`/`or`,使 `not a and b` 解析为 `(not a) and b`(`not` 先作用于 a,再与 b and)——符合"取反 a 后再与 b"的直觉。
- `and` 高于 `or`,使 `a or b and c` 解析为 `a or (b and c)`——这匹配布尔代数惯例("与"比"或"结合更紧,类似乘法比加法紧)。所以 `a and b or c` 是 `(a and b) or c`,与"先与后或"一致。

```python
# 优先级让常见表达式自然
print(a < b and c > d)        # (a<b) and (c>d),不用括号
print(not a and b)            # (not a) and b
print(a or b and c)           # a or (b and c)
```

**结合性**:`and`/`or` 左结合(`a and b and c` = `(a and b) and c`),因求值从左到右短路,左结合与求值顺序一致。`not` 右结合(`not not a` = `not (not a)`),单目运算符惯例。

这套优先级设计的目标是"让自然写法正确解析",但复杂表达式(多个 `and`/`or` 混用、`not` 与组合)仍需括号明示意图(§3.6),因为优先级虽规则化却不直观。完整优先级见《运算符优先级完整表》。

### 4.4 逻辑运算符 vs 位运算符的本质区别

`and`/`or`/`not` 与 `&`/`|`/`~` 的区别,根源于它们是**两套独立的运算符**,作用于不同领域:逻辑运算符作用于"真值"(基于真值测试),位运算符作用于"整数的二进制位"。

**逻辑运算符**:

- 操作数:任意对象(真值测试判真假)。
- 求值:短路(`and`/`or` 按需停)。
- 返回:`and`/`or` 返回操作数本身,`not` 返回 bool。
- 实现:基于 `__bool__`/`__len__` 真值测试 + 控制流(短路)。

**位运算符**:

- 操作数:int(或 bool,因 bool 是 int 子类;`&`/`|`/`^` 也可被自定义类型重载,如 NumPy 数组)。
- 求值:**不短路**(两操作数都求值)。
- 返回:int(位运算结果)。
- 实现:对整数的二进制位逐位运算(`&` 与、`|` 或、`^` 异或、`~` 取反、`<<`/`>>` 移位)。

```python
# 逻辑:and 短路,接受任意对象
print([] and expensive())     # [](短路,expensive 不调)
# 位运算:& 不短路,要求 int
# print([] & expensive())     # TypeError,列表无 __and__
print(5 & 3)                  # 1(位运算:0101 & 0011)
```

**为何 bool 上 `&`/`|` "碰巧"像逻辑运算**:bool 是 int 子类(`True`=`1`、`False`=`0`),所以 `True & False` = `1 & 0` = `0` = `False`,`True | False` = `1 | 0` = `1` = `True`。这让 `&`/`|` 在 bool 上"看起来"做逻辑与/或。但两者**本质不同**:

1. `&`/`|` **不短路**(两操作数都求值),`and`/`or` 短路——对有副作用/昂贵操作数,行为不同。
2. `&`/`|` **优先级高于比较**(`5 > 3 & 2 > 1` 解析错乱),`and`/`or` 低于比较——混用比较时结果错。
3. `&`/`|` **要求 int**,非 int 对象报错;`and`/`or` 接受任意对象。
4. `&`/`|` **返回 int**(`True & True` = `1`,不是 `True`),`and`/`or` 返回操作数。

```python
print(True & True)            # 1(int!),不是 True —— 返回类型不同
print(True and True)          # True(bool)
print((5 > 3) & (2 > 1))      # 1 —— & 返回 int,不是 True
print((5 > 3) and (2 > 1))    # True —— and 返回操作数
```

**NumPy 等库的特殊重载**:NumPy 把 `&`/`|`/`~` 重载为**数组逐元素布尔运算**(因 `and`/`or` 不能被重载控制短路,不适合数组逐元素)。所以在 NumPy 数组上,`&`/`|` 是"对的"逻辑运算(逐元素),且要求加括号(因 `&` 优先级高于比较):

```python
import numpy as np
arr = np.array([1, 2, 3])
# 数组布尔运算用 & | ~(逐元素),且必须加括号(因 & 高于比较)
mask = (arr > 1) & (arr < 3)   # array([False, True, False])
# 不能用 and:arr > 1 and arr < 3 —— 数组的 __bool__ 歧义报错
```

NumPy 数组场景 `&`/`|` 是必要且正确的(逐元素、可重载),但这是库的特殊设计,纯 Python 逻辑判断仍用 `and`/`or`/`not`。理解逻辑与位运算的本质区别,就理解了为何"逻辑判断用单词、位运算用符号"——它们是不同领域的运算符,Python 用不同符号区分,避免混淆。详见《位运算符》。

---

## 5. 总结

### 5.1 本文内容回顾

- **三个逻辑运算符**:`and`(与)、`or`(或)、`not`(非);Python 用单词不是符号(`&&`/`||`/`!`),避免与位运算混淆。
- **三大特性**:① 基于真值测试(任意对象判真假,不只 bool);② 短路求值(`and` 遇假停、`or` 遇真停,后续不求值);③ `and`/`or` 返回操作数本身(非 bool),`not` 返回 bool。
- **全表**:`and` 返回第一个假值(全真返最后)、`or` 返回第一个真值(全假返最后)、`not` 返回取反的 bool。
- **`and`**:前后置条件(都满足);短路遇假返回假值;惯用法 `lst and lst[0]` 空值守卫。
- **`or`**:多选一(任一满足);短路遇真返回真值;惯用法 `x or default` 设默认值(警惕 0 陷阱)、or 链多级回退。
- **`not`**:单目取反,返回 bool;判空 `not items` 比 `len()==0` Pythonic;`not in`/`is not` 是合成运算符。
- **短路求值(重点)**:`and`/`or` 按需停,后续操作数不求值(含副作用不执行);守卫式 `lst and lst[0]` 安全避免 IndexError、`cache or db_query` 有值不算昂贵默认;别把必须执行的副作用放短路位置。
- **优先级**:`not` > `and` > `or`,均低于比较运算符;`a < b and c > d` 不用括号;复杂逻辑加括号;`not a and b` 是 `(not a) and b` 非 `not (a and b)`。
- **惯用法与陷阱(重点)**:`or` 设默认(0/空串合法时改 `is None`)、`and` 守卫(简短可接受,复杂用三目/getattr)、`a and b or c` 模拟三目在 b 假时出错(用三目替代)、混淆返回操作数与返回 bool(需严格 bool 用 `bool()`/`not not`)。
- **三目替代**:`x if cond else y` 安全清晰无陷阱,优先于 `and/or` 模拟条件取值;`and`/`or` 仍用于真布尔逻辑组合。
- **与位运算区别**:`and/or/not`(单词、短路、真值测试、返回操作数)vs `&/|/~`(符号、不短路、int 逐位、返回 int);bool 上 `&/|` 碰巧像逻辑但不短路、优先级高、返 int,绝不当逻辑用;NumPy 数组场景 `&/|` 是对的逐元素运算。
- **最佳实践**:逻辑判断用 `and/or/not` 不用 `&/|`、设默认用 `or`(0 陷阱用 `is None`)、条件取值用三目、守卫用 `and`(复杂用三目)、判空用 `not`、复杂加括号、副作用别放短路位、需 bool 用 `bool()`、用 `not in`/`is not`、真值测试优先、多级回退用 or 链。
- **原理**:`and`/`or` 因"返回决定性操作数"的求值规则而返回操作数(非 bool)且短路(结果已定无意义继续);`not` 结果空间仅布尔故返 bool;真值测试(`__bool__`/`__len__`)是逻辑运算符接受任意对象的基础;优先级 `not>and>or`+比较最高源自"让自然条件表达式不用括号"的设计;逻辑 vs 位运算是两套独立运算符(真值/短路/返回对象 vs 二进制位/不短路/返 int),bool 上 `&/|` 碰巧像逻辑但本质不同。

### 5.2 读完本文你应能掌握

- 说明 Python 逻辑运算符 `and`/`or`/`not` 用单词而非符号,指出三大特性(真值测试、短路、返回操作数)。
- 说明 `and`/`or` 的求值与返回规则(`and` 返回第一个假值或最后一个、`or` 返回第一个真值或最后一个),解释为何 `5 and 3` 返回 `3`、`0 or 5` 返回 `5`(而非 `True`)。
- 说明 `not` 为何返回 bool(而 `and`/`or` 返回操作数),用 `not` 判空替代 `len()==0`。
- 说明短路求值机制(`and` 遇假停、`or` 遇真停),用 `lst and lst[0]` 做空值守卫、`x or default` 设默认值,并指出副作用不被执行的陷阱。
- 说明 `or` 设默认值对 0/空串等假值触发的陷阱,在 0 是合法值时改用 `is None` 判断。
- 说明 `a and b or c` 模拟条件表达式在 b 为假时出错的原因,用三目 `x if cond else y` 替代。
- 说明逻辑运算符优先级(`not` > `and` > `or`,低于比较),在复杂条件中正确加括号。
- 区分逻辑运算符(`and/or/not`)与位运算符(`&/|/~`)的本质(真值/短路/返回对象 vs 二进制位/不短路/返 int),指出 bool 上 `&/|` 碰巧像逻辑但不短路、优先级高、返 int,绝不当逻辑用。
- 说明真值测试(`__bool__`/`__len__`)如何让逻辑运算符接受任意对象,自定义类如何定义真值。
- 阐述短路+返回值的求值规则实现、真值测试基础、优先级设计依据、逻辑与位运算的本质区别。

### 5.3 延伸方向

- **bool 类型与短路逻辑**:bool 作为 int 子类、真值测试规则完整表、`__bool__`/`__len__` 定制真值,见《bool 类型与短路逻辑》(本篇讲运算符机制,该篇讲 bool 类型和真值体系)。
- **三元表达式**:`x if cond else y` 条件表达式的完整用法,替代 `and/or` 模拟,见《三元表达式》。
- **运算符优先级完整表**:`not>and>or`、比较运算符、与算术/位运算的完整优先级,见《运算符优先级完整表》。
- **位运算符**:`&`/`|`/`~`/`^`/`<<`/`>>` 的位级运算与标志位管理(澄清与逻辑运算的区别),见《位运算符》。
- **值相等与引用相等**:逻辑组合里的 `==`/`!=`/`is` 比较运算符,见《值相等与引用相等》。
- **链式比较**:比较运算符的链式规则与短路,见《链式比较》。
