---
group:
  title: 【03】字符串介绍
  order: 3
order: 25
title: capitalize 与 title 与 swapcase 方法
nav:
  title: Python基础
  order: 1
---

# capitalize 与 title 与 swapcase 方法

## 1. 介绍

### 1.1 知识点定义

`str.capitalize()` / `str.title()` / `str.swapcase()` 是字符串的**单词级大小写重排方法**：它们不再像 `upper`/`lower` 那样把整串一刀切成全大写或全小写，而是在字符之间做**局部的精装修**——`capitalize` 只把首字符升为大写、其余压成小写，产出标准的"句子格式"；`title` 把每个"单词"的首字母升为大写、词内其余压小写，产出"标题格式"；`swapcase` 没有格式目标，把所有字符大小写镜像对调。

| 维度 | `capitalize()` | `title()` | `swapcase()` |
|------|------|------|------|
| 所属 | `str` 的内置实例方法 | 同左 | 同左 |
| 语法 | `s.capitalize()` | `s.title()` | `s.swapcase()` |
| 参数 | 无——传参抛 `TypeError` | 同左 | 同左 |
| 动作 | 首字符大写 + **其余全部强制小写** | 每个"词"首字母大写 + 词内其余小写 | 大写变小写、小写变大写 |
| 格式目标 | 句子格式（sentence case） | 标题格式（Title Case） | 无目标，纯镜像翻转 |
| 典型用途 | 句子、单行描述、日志消息的首字归位 | 书名、栏目、标签的排版标题 | 视觉效果、测试数据的镜像构造 |
| 坑位 | 非字母开头的文本"看着没反应" | 撇号/数字当边界、缩写词被压扁 | 双次调用不保证还原（`ß`） |
| 返回 | 转换后的**新串**，原串不变 | 同左 | 同左 |

先把本篇最重要的一句认知放在这里：**title 的"单词"不是人眼认识的单词**。它把任何非字母字符（空格、连字符、撇号、数字、下划线）都当作词间边界——`"they're"` 在 title 眼里是 `they` 和 `re` 两个词，于是产出 `"They'Re"`；`'USA'` 被"规范化"成 `'Usa'`。这条机械的边界直觉一半是便利（连字符复合词自动全大写）、一半是坑（英文缩写与撇号全灭），是 2.3 与 2.4 节的主线，也是选型速查表的灵魂。

这三个方法与 `upper`/`lower`/`casefold` 共同构成大小写转换的完整工具箱：前者管**局部**（哪里大写、哪里小写），后者管**整串**（全部大写或全部小写）。处理展示层文本时你几乎总会先经过整串方法做"清洗基线"，再用本篇的方法做"精装修"，3.4 节会给出这条组合流水线。

### 1.2 最简示例

同一串小写文本，三个方法给出三种排版语义：

```python
s = "hello world"

print(f"capitalize: {s.capitalize()!r}")
print(f"title:      {s.title()!r}")
print(f"swapcase:   {s.swapcase()!r}")
```

运行结果：

```text
capitalize: 'Hello world'
title:      'Hello World'
swapcase:   'HELLO WORLD'
```

三种产物的分工一清二楚：`capitalize` 得到 `'Hello world'`——只有句子的第一个字母抬起头，这是叙事句的格式；`title` 得到 `'Hello World'`——两个词的首字母都抬起头，这是标题的格式；`swapcase` 得到 `'HELLO WORLD'`——全部小写镜像成全部大写（碰巧与 `upper` 同形，因为原文全是小写）。

大小写杂交的输入更能暴露三者的性格差异：

```python
s = "hello WORLD"

print(f"capitalize: {s.capitalize()!r}")
print(f"title:       {s.title()!r}")
print(f"swapcase:    {s.swapcase()!r}")
```

运行结果：

```text
capitalize: 'Hello world'
title:       'Hello World'
swapcase:    'HELLO world'
```

同一个 `'hello WORLD'`：capitalize **强制归位**（首字母升、`world` 一律压小写，产出与全小写输入完全一致）；title 分词归位（首词 `Hello` 的 `H` 升、`WORLD` 压成 `World`）；swapcase 忠实镜像（小写 `hello` 升成 `HELLO`、大写 `WORLD` 降成 `world`）。**normalize（归一到格式）与 swap（翻转形态）是两种世界观**——前两者把文本拉向标准，后者把文本镜像反转。

### 1.3 大小写工具体系中的定位

在大小写方法体系里，本篇的三剑客占据"单词级转换"这一层：

```text
字符与字符串大小写处理的几个层次
│
├── 整串转换 —— upper / lower / casefold
│     └── 整串全部升/降/折叠, 不区分词与句子结构
│
├── 单词级转换 —— capitalize / title / swapcase (本篇)
│     ├── capitalize: 句首大写, 其余压小写(句子格式)
│     ├── title:       每词首字母大写(标题格式)
│     └── swapcase:    大小写镜像对调
│
├── 形态判定 —— isupper / islower / istitle
│     └── 回答"当前串是什么大小写形态", 与转换互为验收关系
│
└── 外部替代 —— string.capwords
      └── 标准库的标题排版函数, 分词规则与 title 不同(3.1 节)
```

四层结构里，本篇的三剑客恰好处在中间：比整串转换精细（保留了大小的分布结构）、又与判定方法构成闭环（`title` 的产出恰好通过 `istitle` 的检验，2.6 节验证）。而体系外的 `string.capwords` 针对 `title` 最疼的撇号坑提供了官方替代——3.1 节正面展开。

## 2. 核心内容

### 2.1 三方法的基本行为

#### 2.1.1 签名与参数纪律

三个方法共享同一套签名形状——无参数、返回新串、原串不变：

```python
for method in ["capitalize", "title", "swapcase"]:
    try:
        getattr("a", method)("x")
    except TypeError as e:
        print(f"{method:>10} 带参数 -> TypeError: {e}")
```

运行结果：

```text
capitalize 带参数 -> TypeError: str.capitalize() takes no arguments (1 given)
     title 带参数 -> TypeError: str.title() takes no arguments (1 given)
  swapcase 带参数 -> TypeError: str.swapcase() takes no arguments (1 given)
```

同一个"takes no arguments"模板——与整串转换家族（upper/lower/casefold）完全同款的纪律：只做整串处理，没有区间参数、没有开关选项。

#### 2.1.2 返回新串：原串不变

字符串不可变，转换产物是全新构造的串，**原串从头到尾保持原样**：

```python
raw = "product NAME"

print(f"raw 原串:    {raw!r}")
print(f"raw.title(): {raw.title()!r}")

raw.title()          # 反面教材: 结果被丢弃
print(f"不接收后 raw: {raw!r}  <- 转换结果无人接收, 纹丝不动")
```

运行结果：

```text
raw 原串:    'product NAME'
raw.title(): 'Product Name'
不接收后 raw: 'product NAME'  <- 转换结果无人接收, 纹丝不动
```

第二行的 `raw.title()` 确实执行了、确实产出了 `'Product Name'`——但新串无人接收，当场蒸发。**"调用了转换但数据没变"的第一嫌疑人永远是忘记接收返回值**——这与剥壳家族、整串转换家族的坑完全同构，是所有返回新串方法的共同事故面。

#### 2.1.3 空串与单字符的边界

三个方法对最小输入的行为：

```python
for s in ["", "a", "A"]:
    print(f"{s!r}: capitalize={s.capitalize()!r}, "
          f"title={s.title()!r}, swapcase={s.swapcase()!r}")
```

运行结果：

```text
'': capitalize='', title='', swapcase=''
'a': capitalize='A', title='A', swapcase='A'
'A': capitalize='A', title='A', swapcase='a'
```

三个观察：空串对三个方法都是"无字符可处理"，原样返回；单个小写 `'a'` 在三个方法下都升成 `'A'`（capitalize 与 title 的首字母指定动作、swapcase 的小转大）；已是大写的 `'A'` 在 capitalize/title 下不变（它已经达标——首字母大写格式），在 swapcase 下降为 `'a'`（镜像对调不讲达标，只讲翻转）。

### 2.2 capitalize：句首大写，其余压小写

#### 2.2.1 两个动作：try 升首字符 + 强制压小写

`capitalize` 的完整语义是两个动作的叠加：**把首字符尽量升为大写，把其余全部字符强制压为小写**。它的产出是标准的"句子格式"（sentence case）——无论原文大小写多乱，归位后只有第一个字母大写：

```python
samples = [
    "hello WORLD",    # 大写正文
    "hELLO wORLD",    # 乱序大小写
    "hello world",    # 已是标准句式
]

for s in samples:
    print(f"  {s!r}.capitalize() -> {s.capitalize()!r}")
```

运行结果：

```text
  'hello WORLD'.capitalize() -> 'Hello world'
  'hELLO wORLD'.capitalize() -> 'Hello world'
  'hello world'.capitalize() -> 'Hello world'
```

三种输入殊途同归 `'Hello world'`——第二个动作（压小写）是无差别的：`WORLD` 被压成 `world`，无论它原本是大写声明还是大写 shouting。**capitalize 产出的是"归一化句子"而不是"保留作者强调的句子"**——凡是大写起强调作用的数据，过一遍 capitalize 强调就没了。

#### 2.2.2 非字母开头：第一个动作落空

首字符若是数字、下划线、汉字这类**没有大小写体系的字符**，第一个动作（升大写）无处置办——capitalize 的表现是"看着没反应"：

```python
samples = [
    "123abc starts here",   # 首字符是数字
    "_hidden value",        # 首字符是下划线
    "中文abc",               # 首字符是汉字
]

for s in samples:
    print(f"  {s!r}.capitalize() -> {s.capitalize()!r}")
```

运行结果：

```text
  '123abc starts here'.capitalize() -> '123abc starts here'
  '_hidden value'.capitalize() -> '_hidden value'
  '中文abc'.capitalize() -> '中文abc'
```

三行输入原样返回，但这**不是方法偷懒**——两个动作都在执行：数字/下划线/汉字没有大写形态，第一个动作落空；第二个动作（压小写）照常执行，只是样本里的字母（`abc`）本来就全是小写，压了等于没压。验证第二个动作在场的方法很简单——把样本换成大小写混杂的正文：

```python
s = "123ABC starts HERE"
print(f"{s!r}.capitalize() -> {s.capitalize()!r}")
```

运行结果：

```text
'123ABC starts HERE'.capitalize() -> '123abc starts here'
```

首字符 `1` 没有升大写可言，但 `ABC` 与 `HERE` 被压成 `abc` 与 `here`——**第二个动作从不缺席，缺席的只是第一个动作的靶子**。理解了"两个动作"的拆解，capitalize 在任何输入上的行为都可以精确预判。

#### 2.2.3 单字符归位

最小样本验证两个动作的边界：

```python
for ch in ["a", "A", "1", "中"]:
    print(f"  {ch!r}.capitalize() -> {ch.capitalize()!r}")
```

运行结果：

```text
  'a'.capitalize() -> 'A'
  'A'.capitalize() -> 'A'
  '1'.capitalize() -> '1'
  '中'.capitalize() -> '中'
```

`'a'` 升为 `'A'`（第一个动作生效）且没有其余字符可压；`'A'` 已达标原样；`'1'` 与 `'中'` 两个动作都无靶子。capitalize 对单字符等价于"把首字符变到大写形态"。

### 2.3 title 的分词规则：非字母即边界

#### 2.3.1 五种边界：title 眼中只有"连续字母序列"

`title` 对"单词"的定义是机械的：**凡连续的字母序列就是一个词**——空格是最普通的边界，但连字符、下划线、数字统统算边界。五种边界一次看清：

```python
samples = [
    "hello world",         # 空格分词: 最常规认知
    "well-known expert",   # 连字符: 复合词被拆成两个词
    "hello_world",         # 下划线: 编程命名被拆词
    "top 10 tips",         # 数字与空格
    "abc2def",             # 数字也是边界: abc 和 def 分别大写
]

for s in samples:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  'hello world'.title() -> 'Hello World'
  'well-known expert'.title() -> 'Well-Known Expert'
  'hello_world'.title() -> 'Hello_World'
  'top 10 tips'.title() -> 'Top 10 Tips'
  'abc2def'.title() -> 'Abc2Def'
```

五条结果的解读分层进行：空格分词符合直觉；连字符把 `well-known` 拆成 `Well` + `Known` 两词（排版上复合词每段都大写，多半是乐于接受的）；下划线同理拆 `Hello_World`；最值得注意的是最后一条——**`2` 是边界，`def` 紧跟着数字就被认成新词**，`Abc2Def` 这种大写在人眼里很怪，在 title 的规则里完全自洽。

#### 2.3.2 撇号边界：最高频的坑

五种边界里，撇号带来的坑口碑最差——因为英文缩写（`they're`、`don't`）在自然文本里出现得太频繁了：

```python
samples = [
    "they're bill's",
    "don't stop",
    "o'reilly's books",
]

for s in samples:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  "they're bill's".title() -> "They'Re Bill'S"
  "don't stop".title() -> "Don'T Stop"
  "o'reilly's books".title() -> "O'Reilly'S Books"
```

`'` 是非字母字符，于是 `they're` 被拆成 `they` 与 `re` 两词——`re` 的 `r` 也要"首字母大写"，产出 `"They'Re"`；`don't` 得到 `"Don'T"`；姓名 `o'reilly` 惨遭双重切割 `"O'Reilly'S"`。**眼睛看着别扭，逻辑上无懈可击**——title 的分词规则没有"撇号连词"的概念，它只认"非字母即边界"这一条死理。要对人眼友好，需要的就是分词规则不同的替代工具（3.1 节的 `string.capwords`）。

#### 2.3.3 任何字符都能当边界：边界的完全体

边界没有"资格认证"——任何非字母字符站在词前，下一个字母就要大写：

```python
for s in ["- leading dash", "(paren note)", "2fast 2furious"]:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  '- leading dash'.title() -> '- Leading Dash'
  '(paren note)'.title() -> '(Paren Note)'
  '2fast 2furious'.title() -> '2Fast 2Furious'
```

开头是 `-`，`leading` 的 `l` 大写；括号包裹的词首字母照升；`2fast` 的 `f` 因为前面站着数字 `2` 而大写成 `2Fast`。title 的世界里**"词"是纯字母概念、与排版符号无关**——这是理解它全部行为的钥匙，也是预判它何时伤人的钥匙。

#### 2.3.4 边界规则的正反两面

把 2.3 节收拢成一张正反账：

| 表现 | 正面（受益场景） | 反面（受伤场景） |
|------|------|------|
| 连字符/下划线当边界 | 复合词每段自动大写：`Well-Known Expert` | 编程命名 `hello_world` 也被切词（多数场合无害） |
| 数字当边界 | 编号后接的词自动大写：`2Fast` | 无声变怪：`abc2def` → `Abc2Def` |
| 撇号当边界 | ——（几乎没有受益场景） | 缩写词全灭：`they're` → `They'Re` |

分词规则本身没有对错——**错误的是把它用在它不认识的数据形态上**。含撇号与缩写词的文本需要的是另一种分词标准，这正是标准库提供 `string.capwords` 的动机。

### 2.4 title 的杀伤现场：缩写词、驼峰与品牌名

#### 2.4.1 缩写词：全大写被压成单词式

title 的语义是"标题排版"——它把每个词刷成首大写形式，但缩写词（`USA`、`NASA`、`API`）本来就靠全大写立身，一律"规范化"后惨遭变形：

```python
for s in ["USA vs NASA", "PDF viewer API", "HTML and CSS"]:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  'USA vs NASA'.title() -> 'Usa Vs Nasa'
  'PDF viewer API'.title() -> 'Pdf Viewer Api'
  'HTML and CSS'.title() -> 'Html And Css'
```

`USA` 变 `Usa`、`NASA` 变 `Nasa`——除首字母外的所有字母一律压小写，全大写缩写词就此失去辨识度。**排版目标与命名语义在这里正面冲突**：title 追求视觉统一，缩写词依赖视觉特异性，鱼与熊掌不可兼得——这类文本要么换工具，要么后处理还原。

#### 2.4.2 驼峰与品牌名：中间大写被抹平

程序命名（驼峰式）与品牌名（iPhone、YouTube）在词中藏着大写字母——title 一视同仁地压平：

```python
for s in ["iPhone 15 pro", "McDonald's o'Reilly", "YouTube playlist"]:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  'iPhone 15 pro'.title() -> 'Iphone 15 Pro'
  "McDonald's o'Reilly".title() -> "Mcdonald'S O'Reilly"
  'YouTube playlist'.title() -> 'Youtube Playlist'
```

`iPhone` 变 `Iphone`（品牌精心设计的第二个大写 `P` 被压掉）、`McDonald's` 变 `Mcdonald'S`（撇号边界再插一刀，`Donald` 的小写 `c` 也不保）、`YouTube` 变 `Youtube`。**title 只保证"机械的排版统一"，不理解任何品牌与命名的语义**——发布出去的产品文案里出现 `Iphone 15 Pro`，错的不是 title，是把它送进了不该进的处理线。

#### 2.4.3 正面应用：全小写自然短语——title 的安全区

说完禁区看安全区——**全小写的自然短语**（书名、栏目名、课程标题）正是 title 的理想产地：

```python
for s in ["the quick brown fox", "war and peace", "python basics in one hour"]:
    print(f"  {s!r}.title() -> {s.title()!r}")
```

运行结果：

```text
  'the quick brown fox'.title() -> 'The Quick Brown Fox'
  'war and peace'.title() -> 'War And Peace'
  'python basics in one hour'.title() -> 'Python Basics In One Hour'
```

三行产出全部无可挑剔——因为安全区有三重保险：输入全小写（没有需要保留的大小写语义）、纯空格分词（没有撇号数字的怪边界）、无缩写词（没有需要豁免的全大写）。**title 的错误面从来不在代码，在数据种类**——入线前先问"这批文本是全小写自然短语吗"，是使用 title 的第一守则。

### 2.5 swapcase：大小写对调

#### 2.5.1 基本对调：忠实的镜像

swapcase 没有格式目标，它只做一件事：小写变大写、大写变小写——每个字符照着镜像翻转：

```python
for s in ["Hello World", "hello WORLD", "hELLO wORLD"]:
    print(f"  {s!r}.swapcase() -> {s.swapcase()!r}")
```

运行结果：

```text
  'Hello World'.swapcase() -> 'hELLO wORLD'
  'hello WORLD'.swapcase() -> 'HELLO world'
  'hELLO wORLD'.swapcase() -> 'Hello World'
```

第三行最妙：经过手工打乱大小写的串，swapcase 照样逐字符翻转还原规整——**它不判断"当前是什么形态"，只执行"翻到对面"**。与 capitalize/title 的"归位到标准格式"是两种世界观：前者是镜像翻转，后两者是规范归一。

#### 2.5.2 双次对调不还原：ß 的案例

直觉认为"翻两次等于没翻"（`s.swapcase().swapcase() == s`）。德语 `ß` 把这条直觉再次打破：

```python
print(f"  'ß'.swapcase()           -> {'ß'.swapcase()!r}   <- 一个变两个")
print(f"  'ß'.swapcase().swapcase() -> {'ß'.swapcase().swapcase()!r}   <- 回来的是 ss")
print(f"  双次还原失败: {'ß'.swapcase().swapcase() != 'ß'}")
```

运行结果：

```text
  'ß'.swapcase()           -> 'SS'   <- 一个变两个
  'ß'.swapcase().swapcase() -> 'ss'   <- 回来的是 ss
  双次还原失败: True
```

`ß` 无对应的小写形态变化（它本来就是小写），于是翻转成大写 `SS`——**一个字符翻成两个**；再翻回来是两个普通小写 `ss`，与原串 `ß` 不再相等。机制与整串转换家族的"往返不对称"同根同源：**翻转走的是大小写映射，一对多的展开在第一次翻转时丢掉了身份信息**。含特殊字符的文本，双次 swapcase 不保证闭环。

#### 2.5.3 中性字符原样通过

没有大小写体系的字符不参与翻转：

```python
for s in ["中文Aa123", "🚀AB", "123"]:
    print(f"  {s!r}.swapcase() -> {s.swapcase()!r}")
```

运行结果：

```text
  '中文Aa123'.swapcase() -> '中文aA123'
  '🚀AB'.swapcase() -> '🚀ab'
  '123'.swapcase() -> '123'
```

汉字、emoji、数字原样穿过，翻转只动有大小写对应的那部分字符——判定标准依旧是"字符有没有大小写形态"，与语种无关。

#### 2.5.4 适用场景：要翻转，不要规范

swapcase 在三个方法里地位最"工具人"——它出现的地方通常不追求排版：

```python
print(f"  强调: {'warning! attention!'.swapcase()!r}")
print(f"  对测试数据做镜像: {'True False None'.swapcase()!r}")
```

运行结果：

```text
  强调: 'WARNING! ATTENTION!'
  对测试数据做镜像: 'tRUE fALSE nONE'
```

两类典型用法：小写警示语翻成全大写强调（与 `upper` 同效，但语义是"翻转"）；测试夹具故意构造大小写镜像数据（验证某段代码对大小写不敏感）。**每当发现"我只是想统一成大写"的需求，意志坚定地改用 `upper`**——swapcase 的价值在翻转本身，不在排版。

### 2.6 istitle：title 产出的验收章

#### 2.6.1 判定标准与三组典型形态

title 有一个天生的搭档——判定方法 `istitle()`。它的判定标准与 title 的分词规则同源：**每个用非字母边界切出的"词"如果含大小写字符，必须是首字符大写、其余小写**。几组典型形态过一遍：

```python
samples = [
    "Hello World",       # title 标准形态
    "They'Re",           # 撇号边界后的 R 也算词首
    "HELLO WORLD",       # 全大写: 是 isupper, 不是 istitle
    "hello world",       # 全小写: 是 islower, 也不是 istitle
]

for s in samples:
    print(f"  {s!r}: istitle={s.istitle()}, isupper={s.isupper()}, islower={s.islower()}")
```

运行结果：

```text
  'Hello World': istitle=True, isupper=False, islower=False
  "They'Re": istitle=True, isupper=False, islower=False
  'HELLO WORLD': istitle=False, isupper=True, islower=False
  'hello world': istitle=False, isupper=False, islower=True
```

四行输出两条看点：

- **`"They'Re"` 通过 istitle**——人眼觉得别扭的形态，判定上是合法的 title 格式：撇号是边界，`Re` 是一个"词"，首字符大写达标。**istitle 执行的是同一套机械边界规则**，它不会"体谅"人眼的感受。
- **`'HELLO WORLD'` 不通过 istitle**——全大写是"另一种形态"（`isupper=True`），不是标题格式。大小写形态的判定方法各管一格：isupper、islower、istitle 三者互斥地覆盖全大写、全小写、单词首大写三种形态。

#### 2.6.2 转换与判定的闭环

title 的产出必然通过 istitle 的检验——无论原文多乱：

```python
originals = ["they're bill's", "usa nasa", "PDF viewer API"]

for s in originals:
    made = s.title()
    print(f"  {s!r} -> {made!r}: istitle={made.istitle()}")
```

运行结果：

```text
  "they're bill's" -> "They'Re Bill'S": istitle=True
  'usa nasa' -> 'Usa Nasa': istitle=True
  'PDF viewer API' -> 'Pdf Viewer Api': istitle=True
```

三组输入各有各的原始毛病（撇号、全小写、全大写缩写），title 的产出全部通过 istitle——**因为 istitle 的判定标准就是 title 的转换标准**，转换写下的每一笔，判定都认账。这对闭环在工程上是"验收章"：处理标题数据的管线可以在出口处放一道 `istitle()` 检查，凡不合格的行就知道绕过了标准流程。

#### 2.6.3 判定成立需要至少一个大小写字符

纯汉字、纯数字、空串——没有大小写字符，istitle 一律 False：

```python
for s in ["中文", "123 456", ""]:
    print(f"  {s!r}: istitle={s.istitle()}   <- 没有大小写字符, 判 False")
```

运行结果：

```text
  '中文': istitle=False   <- 没有大小写字符, 判 False
  '123 456': istitle=False   <- 没有大小写字符, 判 False
  '': istitle=False   <- 没有大小写字符, 判 False
```

**"全词大写且位置正确"需要至少一个大小写字符来体现**——参与大小写体系的字符数为零时，"格式"无从谈起。这条边界与 isupper/islower 的空串行为（同为 False）一脉相承：形态判定方法要求至少存在一个能承载形态的字符。

## 3. 最佳实践

### 3.1 排版英文标题：capwords 优于 title

title 的撇号坑（2.3.2 节）痛了太多人，标准库早有官方替代——`string.capwords`。两个工具的分词标准不同：title 的边界是"所有非字母字符"，capwords 的边界**只有空白**。含撇号的缩写在 capwords 眼里是一个完整单词：

```python
import string

cases = ["they're bill's", "don't stop now", "o'reilly's books"]

for s in cases:
    print(f"  {s!r}")
    print(f"    title:    {s.title()!r}")
    print(f"    capwords: {string.capwords(s)!r}")
```

运行结果：

```text
  "they're bill's"
    title:    "They'Re Bill'S"
    capwords: "They're Bill's"
  "don't stop now"
    title:    "Don'T Stop Now"
    capwords: "Don't Stop Now"
  "o'reilly's books"
    title:    "O'Reilly'S Books"
    capwords: "O'reilly's Books"
```

三组对照里 capwords 全部给出人眼期望的形态：`they're` 整词归位 `"They're"`、`don't` 保住 `"Don't"`。但它也有自己的取舍——对 O'Reilly 这类"撇号后本该大写"的姓名，capwords 同样无能为力（它按空格分词后对整词做 capitalize，`reilly` 的 `r` 被压小写得 `O'reilly's`）——**两种分词规则各有盲区，只是 capwords 的盲区（撇号后大写）比 title 的盲区（所有撇号）小得多**。

选型的对照表：

| 场景 | 推荐 | 理由 |
|------|------|------|
| 含英文缩写的普通文本（they're、don't） | `string.capwords` | 撇号不是边界，缩写完整保留 |
| 全小写自然短语（书名、栏目） | 两者皆可，capwords 更稳 | 两法结果一致，capwords 顺带清洗空白 |
| 含 O'Reilly 类"撇号后大写"姓名 | 都不完美，需后处理或字典 | 两种分词规则都无此语义 |
| 连字符复合词要每段大写（Well-Known） | `title` | capwords 只按空白分词，`known` 不会大写 |

### 3.2 capwords 的第二重身份：顺带清洗空白

capwords 与 title 的第二处差异藏在空白处理——title 保留每个空白字符原样，capwords **顺带做了一次标准清洗**：

```python
import string

messy = "  extra   spaces  between  words  "
print(f"  原串: {messy!r}")
print(f"  title:    {messy.title()!r}")
print(f"  capwords: {string.capwords(messy)!r}")
```

运行结果：

```text
  原串: '  extra   spaces  between  words  '
  title:    '  Extra   Spaces  Between  Words  '
  capwords: 'Extra Spaces Between Words'
```

title 产出一丝不苟地保留首尾与中间的全部空白（连续三个空格还是三个）；capwords 给出 `Extra Spaces Between Words`——首尾剥净、连续空白折叠为一。**选 capwords 等于同时拿到了"按空格分词的 title 语义 + strip + 空白规范化"三件套**；反过来讲，**如果空白本身有语义（比如数据字段之间的对位），capwords 会把它抹掉**——两个工具在空白上的分歧同样是选型依据。

### 3.3 title 的安全区检查清单

把 title 放进处理线前，先过一遍这份入线检查：

| 检查项 | 安全样本 | 危险样本 |
|------|------|------|
| 文本是不是全小写？ | `'war and peace'` | `'PDF viewer API'`（大小写语义会被冲掉） |
| 有没有撇号缩写？ | 无 | `"they're"`（→ `They'Re`） |
| 有没有全大写缩写词？ | 无 | `'USA'`（→ `Usa`） |
| 有没有品牌/驼峰命名？ | 无 | `'iPhone'`（→ `Iphone`） |
| 数字内嵌有没有语义？ | `'top 10 tips'` 无碍 | `'abc2def'` 会变 `Abc2Def` |

**任何一项踩雷都说明 title 不适合这条数据线**——它的问题从来不是"不会排版"，而是"排版的规则是机械的，认不得数据里的语义"。

### 3.4 组合链模板：先清洗基线，再精装修

三个方法极少单独出现在真实管线里——标准姿势是**先用整串方法把脏数据拉平到统一基线，再用本篇方法做精装修**：

```python
raw = "  product NAME  "

print(f"  原串:                   {raw!r}")
print(f"  strip().lower().title(): {raw.strip().lower().title()!r}")
print(f"  strip().capitalize():  {raw.strip().capitalize()!r}")
```

运行结果：

```text
  原串:                   '  product NAME  '
  strip().lower().title(): 'Product Name'
  strip().capitalize():  'Product name'
```

流水线的层次一目了然：`strip` 剥两端空白、`lower` 压平安大小写基线、再按需选 title（标题排版）或 capitalize（句子格式）。把这条流水线跑在一批真实数据上：

```python
RAW_HEADLINES = [
    "  MERGE SUCCESS   on brAnch feature-x  ",
    "deploy FAILED: retry 3 TIMES    reached ",
]

for raw in RAW_HEADLINES:
    base = raw.strip().lower()
    print(f"  原始: {raw!r}")
    print(f"  句子: {base.capitalize()!r}")
    print(f"  标题: {base.title()!r}")
```

运行结果：

```text
  原始: '  MERGE SUCCESS   on brAnch feature-x  '
  句子: 'Merge success   on branch feature-x'
  标题: 'Merge Success   On Branch Feature-X'
  原始: 'deploy FAILED: retry 3 TIMES    reached '
  句子: 'Deploy failed: retry 3 times    reached'
  标题: 'Deploy Failed: Retry 3 Times    Reached'
```

两个观察值得记下：**基线（清洗+压平）一旦统一，输出就完全可预测**——两条原始数据再脏，都归位成整齐的两种排版；同时注意第二组的标题层把 `TIMES` 压成 `Times`——如果这是有意强调的数据，精装修就伤到了语义，回到 3.3 的检查清单。

### 3.5 方法选择决策速查表

| 需求 | 首选写法 |
|------|------|
| 句子格式（叙事、日志消息、单行描述） | `s.capitalize()` |
| 标题格式（书名、栏目；无缩写与撇号） | `s.title()` |
| 标题格式（含英文缩写 they're/don't） | `string.capwords(s)` |
| 标题格式 + 空白顺带清洗 | `string.capwords(s)` |
| 大小写镜像翻转（测试、视觉强调） | `s.swapcase()` |
| 脏数据统一再排版 | `s.strip().lower()` 做基线，再选上三者 |
| 判断是否已是标题格式 | `s.istitle()` |
| 含品牌名/驼峰命的展示文本 | 都不完美——白名单词典或后处理还原 |
| 人名格式化（简单形态） | `s.capitalize()`（注意 McDonald 类会变 Mcdonald） |

使用心法一句话：**先定"格式目标是句子还是标题"，再看"数据里有没有 title 认不得的语义"——两问过后写法自动浮出**。

## 4. 原理

### 4.1 title 的实现：逐字符状态机

title 在 CPython 里是单趟扫描的状态机：对每个字符，它只关心一个问题——**前一个字符是不是字母**：

```text
扫描 'abc2def' 的状态机轨迹:

位置:     a      b      c      2      d      e      f
前一字符: (串首)  a(字母) b(字母) c(字母) 2(非字母) d(字母) e(字母)
判定:     升↑    压↓    压↓    不动    升↑    压↓    压↓
产出:     A      b      c      2      D      e      f
                              ↑ 前一字符非字母 -> 新词开始, 升大写
```

状态机的一条规则解释了本篇全部现象：**"前字符非字母即升大写"**——撇号、数字、连字符、下划线、串首，都是"前字符非字母"的各种形态。2.3 节的五种边界、撇号坑、`2Fast` 的怪形态，全是这条规则的机械推论。单趟扫描 O(n)、每个字符一次类别判定 + 一次映射查表——title 的行为完全可以从这条规则推导，没有例外。

### 4.2 Unicode titlecase：第三张映射表

一个深藏的事实：**title 和 upper 走的不是同一张映射表**。Unicode 为大小写准备了三套正式映射——小写、大写、以及专供标题排版的"标题格式"（titlecase）。绝大多数字符上三张表重合（`a` 的 title 与 upper 都是 `A`），但有一组"三兄弟"字符把分岔暴露出来：

```python
dz_lower = "ǆ"    # U+01C6
print(f"  'ǆ'(U+01C6): upper -> {dz_lower.upper()!r}, title -> {dz_lower.title()!r}")
print(f"  upper 与 title 不同: {dz_lower.upper() != dz_lower.title()}")
```

运行结果：

```text
  'ǆ'(U+01C6): upper -> 'Ǆ', title -> 'ǅ'
  upper 与 title 不同: True
```

`ǆ`（Dž 型二合字母的小写形）升大写得 `Ǆ`（全大写形），转标题却得 `ǅ`（**首字符大写、第二字符小写**的混合形）——这正是"标题格式"的精确定义在多字符字母上的体现：**标题里词首大写、词身小写**，`ǅ` 就是这个词的"标题排版"。一条实测证据把三张表的存在坐实——title 不是"换个说法的 upper"，它查询的是独立的第三张映射。

### 4.3 capitalize 与 swapcase 的实现路径

三个方法的查表路径各有分工：

| 方法 | 第一动作的表 | 第二动作的表 | 局部行为 |
|------|------|------|------|
| capitalize | 首字符升大写（mapping 表） | **其余字符全部 lower** | 两次查表各司其职，互不影响 |
| title | 依据状态机：词首字符升 title 表 | 词身字符压 lower 表 | 单趟扫描内的分岔查表 |
| swapcase | 小写走 upper 表 | 大写走 lower 表 | 逐字符镜像，无目标格式 |

capitalize 的"非字母开头看着没反应"由实现直接解释：第一动作查表落空（数字、汉字无映射条目），第二动作照常执行；swapcase 的 ß 案例（`'ß'.swapcase()` 得 `'SS'`）同样来自查表——`ß` 升大写的映射条目就是两个字符的 `SS`，**一对多展开在第一次翻转时丢身份信息**，双次不还原是映射表结构的必然结果，与整串转换家族的往返不对称同根同源。

### 4.4 性能：三方法同量级

三者都是单趟 O(n) 扫描，实测在同一串（约 3800 字符）上跑三万个来回：

```python
import timeit

text = "The Quick Brown Fox" * 200
n = 30000
print(f"  capitalize: {timeit.timeit(lambda: text.capitalize(), number=n):.4f}s")
print(f"  title:      {timeit.timeit(lambda: text.title(), number=n):.4f}s")
print(f"  swapcase:   {timeit.timeit(lambda: text.swapcase(), number=n):.4f}s")
```

运行结果：

```text
  capitalize: 0.2135s
  title:      0.2591s
  swapcase:   0.2709s
```

三者同一量级（耗时绝对值随机器浮动，量级与相对结论稳定），差距来自扫描开销的细微不同：capitalize 只在首字符判断一次"升"，其余无差别压小写；title 每个字符都要做"前字符类别 + 本字符归属"双重判定；swapcase 每个字符都要翻转一次。**这点差距在选型上不构成任何理由**——三个方法的取舍从第一个字就定在语义层：句子、标题、镜像，三问对上号，性能从来不参与决策。

## 5. 总结

本文围绕 `capitalize`、`title`、`swapcase` 三个方法展开，主要介绍了以下内容：

- 三方法是**单词级大小写重排**工具，与整串转换家族（upper/lower/casefold）分层：`capitalize` 产出句子格式（首字符大写 + 其余全部强制小写）；`title` 产出标题格式（每个词首字母大写、词内其余小写）；`swapcase` 无格式目标，做大小写镜像对调。三方法都无参数（传参抛 `takes no arguments` 的 TypeError）、返回新串、原串不变
- capitalize 是两个动作的叠加："首字符 try 升大写 + 其余强制压小写"——非字母开头（`123abc`、`_hidden`、`中文abc`）时**第一动作落空、第二动作照常**（大小写混杂的正文照样被压平），"看着没反应"不是方法偷懒，是第一个动作没有靶子
- **title 的"单词"定义是机械的：非字母即边界**——连字符（`well-known` → `Well-Known`）、下划线、数字（`abc2def` → `Abc2Def`）、撇号全部是词间边界；最高频的坑在撇号：`"they're"` → `"They'Re"`、`"don't"` → `"Don'T"`——眼睛别扭，逻辑自洽，规则里没有"撇号连词"的概念
- title 的杀伤现场：全大写缩写词被压成单词式（`USA` → `Usa`、`API` → `Api`）、品牌与驼峰命名的中间大写被抹平（`iPhone` → `Iphone`、`McDonald's` → `Mcdonald'S`、`YouTube` → `Youtube`）；**安全区是"全小写自然短语"**（书名、栏目名）——title 的错误面不在代码，在数据种类
- swapcase 忠实镜像：不判断当前形态、只执行翻转；`ß` 翻成 `SS`（一个变两个）、双次翻回得 `ss` 不等于原串——一对多展开丢身份信息，与整串家族的往返不对称同根；汉字/数字/emoji 原样通过；使用原则：**只把它用于翻转语义（测试、强调），统一大小写永远用整串家族**
- **istitle 与 title 的分词规则同源**：每个非字母边界切出的词若含大小写字符，须首大写其余小写——所以 `"They'Re"` 通过 istitle（撇号后的 `Re` 是合法词首）、`'HELLO WORLD'` 不通过（那是 isupper 形态）；**title 的产出必然通过 istitle**——转换与判定构成验收闭环；无大小写字符（中文、数字、空串）一律 False
- `string.capwords` 是 title 的官方替代：**只按空白分词**（`they're` 整词保留 → `"They're Bill's"`）+ **顺带空白清洗**（首尾剥净、连续空白折叠）——两重差异都是选型依据；它自己的盲区是"撇号后该大写"的姓名（`O'Reilly` 得 `O'reilly`）；反向场景（连字符复合词要每段大写）title 才是正解
- 组合链模板：**先用 `strip().lower()` 做清洗基线，再精装修**——`strip().lower().title()` 出标题、`strip().capitalize()` 出句子；脏数据（`'  MERGE SUCCESS   on brAnch feature-x  '`）进线后输出完全可预测；入线前过安全区检查清单（全小写？无撇号？无缩写？无品牌名？）
- 原理上：title 是单趟扫描状态机，核心规则一条——"前字符非字母即升大写"，五种边界全部是这条规则的形态；**Unicode 为 titlecase 准备了独立的第三张映射表**（`ǆ` 的 upper → `Ǆ` 而 title → `ǅ`，三兄弟字符坐实三张表的分岔）；capitalize 两次查表、swapcase 走 upper/lower 互查
- 性能实测三者同量级（O(n) 单趟扫描，title 的双重类别判定略慢），**选型从第一个字就定在语义层——句子格式找 capitalize、标题格式看数据选 title 或 capwords、镜像翻转才轮到 swapcase，性能从不参与决策**
