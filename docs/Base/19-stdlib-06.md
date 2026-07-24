---
group:
  title: 【19】标准库精讲
  order: 19
order: 6
title: csv 读写 CSV 文件
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 CSV 文件与 csv 模块

CSV（Comma-Separated Values，逗号分隔值）是一种最通用的表格数据交换格式。它的本质是**纯文本**：每一行是一条记录，行内字段用逗号分隔。因为结构简单、人可读、几乎所有电子表格软件和数据库都支持导入导出，CSV 成了数据搬运的"最大公约数"——你从 MySQL 导出一批数据给业务方看 Excel，最省事的方式就是导成 CSV。

Python 标准库的 `csv` 模块专门用来读写 CSV 文件。你可能会想：CSV 不就是按逗号 split 一下吗，为什么要专门一个模块？原因在于**真实世界的 CSV 比看起来复杂得多**。一个字段里本身可能含逗号（如 `"北京,上海"`），含双引号（如 `她说"你好"`），甚至含换行符。直接用 `line.split(",")` 会把这些字段错误地拆开。`csv` 模块按 RFC 4180 规范正确处理引号包裹、转义、换行等边界情况，让你专注业务数据而不是字符串切分。

`csv` 模块提供两套 API：

- **基础 API**：`csv.reader` / `csv.writer`，按行返回/写入 `list`，下标访问字段，适合字段少、位置固定的简单表。
- **字典 API**：`csv.DictReader` / `csv.DictWriter`，按行返回/写入 `dict`（早期版本是 `OrderedDict`，3.8+ 普通dict），用字段名作 key 访问，可读性强，适合列多、列顺序可能变化的业务表。

### 1.2 基本语法与最小用法

最小读取示例——读一个员工表的 CSV 文件内容：

```python
import csv

# 假设 employees.csv 内容如下（这里用多行字符串模拟文件内容）：
# name,age,department
# 张三,28,研发部
# 李四,35,市场部

# with open("employees.csv", newline="", encoding="utf-8") as f:
#     reader = csv.reader(f)
#     for row in reader:
#         print(row)

# 输出：
# ['name', 'age', 'department']
# ['张三', '28', '研发部']
# ['李四', '35', '市场部']
```

最小写入示例：

```python
import csv

# rows = [
#     ["name", "age", "department"],
#     ["张三", "28", "研发部"],
#     ["李四", "35", "市场部"],
# ]
# with open("employees.csv", "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#     writer.writerows(rows)
```

两个要点先记住：

1. 打开文件时**必须**加 `newline=""`，否则 Windows 下写出的文件每行之间会多出空行（原理见第 4 章）。
2. 读取返回的每一行是 `list`，每个字段都是 `str`，**数字也是字符串**，需要自己转换类型。

下面逐步展开各 API 的完整用法。

## 2. 核心内容

### 2.1 csv.reader：基础读取

`csv.reader(f)` 把一个已打开的文件对象包装成 reader 迭代器，每次迭代返回一行，每行是字段组成的 `list`。

**签名**：

```python
csv.reader(csvfile, dialect='excel', **fmtparams)
```

- `csvfile`：任何支持迭代、返回字符串行的对象。通常是 `open()` 的文件对象，也可以是 `io.StringIO`。
- `dialect`：方言，预设一组格式参数（分隔符、引号字符等），默认 `"excel"`，适配 Excel 导出的 CSV。
- `**fmtparams`：覆盖方言中的单项格式参数，如 `delimiter="\t"` 改分隔符为制表符（即 TSV）。

**逐行迭代读取员工表**：

```python
import csv
import io

# 用 StringIO 模拟文件，便于演示（实际场景替换成 open(...)）
file_text = "name,age,department\n张三,28,研发部\n李四,35,市场部\n"
f = io.StringIO(file_text)

reader = csv.reader(f)
for row in reader:
    # row 是 list，按下标取字段
    name = row[0]
    age = int(row[1])  # CSV 里全是字符串，数字需手动转
    department = row[2]
    print(f"姓名:{name} 年龄:{age} 部门:{department}")

# 输出：
# 姓名:张三 年龄:28 部门:研发部
# 姓名:李四 年龄:35 部门:市场部
```

**首行是表头时的处理**。很多 CSV 第一行是字段名而非数据，有三种处理方式：

```python
import csv
import io

file_text = "name,age,department\n张三,28,研发部\n李四,35,市场部\n"
f = io.StringIO(file_text)
reader = csv.reader(f)

# 方式一：手动 next 跳过表头
header = next(reader)
print("表头:", header)
for row in reader:
    print(row)

# 输出：
# 表头: ['name', 'age', 'department']
# ['张三', '28', '研发部']
# ['李四', '35', '市场部']
```

方式二更推荐——用下面要讲的 `DictReader`，自动把首行当字段名。

**reader 返回的是 list 的特性**。每次迭代生成的 list 是新建的，可以安全保存：但注意 reader 本身是迭代器，只能遍历一次，不能 `len(reader)`，也不能下标访问 `reader[0]`。需要随机访问得先 `rows = list(reader)` 全读进内存，但大文件不建议这么做。

### 2.2 csv.writer：基础写入

`csv.writer(f)` 把文件对象包装成 writer，按 CSV 规范写入字段，自动处理引号包裹和转义。

**签名**：

```python
csv.writer(csvfile, dialect='excel', **fmtparams)
```

参数含义同 `reader`。写入相关方法：

- `writerow(row)`：写一行，`row` 是字段序列（list/tuple）。
- `writerows(rows)`：写多行，`rows` 是行的序列，等价于循环调用 `writerow`，但更简洁。

**写入员工表 CSV**：

```python
import csv
import io

buf = io.StringIO()
writer = csv.writer(buf)

# 先写表头
writer.writerow(["name", "age", "department"])
# 再写数据行
writer.writerows([
    ["张三", "28", "研发部"],
    ["李四", "35", "市场部"],
])

print(buf.getvalue())

# 输出：
# name,age,department
# 张三,28,研发部
# 李四,35,市场部
#
```

注意输出最后一行末尾有换行——`writerow` 每次写完自动加 `\r\n`（Excel 方言的行终止符）。

**字段含逗号时的自动包裹**。这是 csv 模块相对 split 的核心价值：

```python
import csv
import io

buf = io.StringIO()
writer = csv.writer(buf)

# "北京,上海" 这个字段本身含逗号，直接写会破坏结构
writer.writerow(["城市", "距离", "路线"])
writer.writerow(["A站", "1200", "北京,上海"])  # 第三个字段含逗号

print(buf.getvalue())

# 输出：
# 城市,距离,路线
# A站,1200,"北京,上海"
```

writer 检测到字段含分隔符逗号，自动用双引号把整个字段包裹起来，这样解析时不会误拆。**这是手写 `".".join(row)` 永远做不到的**，也是为什么必须用 csv 模块。

**字段含双引号时的转义**。CSV 规范规定：字段内含双引号时，把引号翻倍（`"` → `""`），整个字段再被引号包裹：

```python
import csv
import io

buf = io.StringIO()
writer = csv.writer(buf)

# 备注里含双引号
writer.writerow(["name", "remark"])
writer.writerow(["张三", '她说"你好"'])

print(buf.getvalue())

# 输出：
# name,remark
# 张三,"她说""你好"""
```

读回来时 reader 会自动还原，无需手动处理转义。

### 2.3 csv.DictReader：按字典读取

`csv.DictReader` 把每一行映射成字典，key 是首行字段名，value 是对应字段值。相比 `reader` 返回 list 用下标访问，`DictReader` 用字段名访问，可读性强得多，列顺序变化也不影响代码。

**签名**：

```python
csv.DictReader(f, fieldnames=None, restkey=None, restval=None, dialect='excel', **fmtparams)
```

- `fieldnames`：字段名序列。**不传则自动用首行作字段名**（最常见用法）。
- `restkey`：当某行字段数多于字段名时，多余字段收集到这个 key 下（默认 None，会收集到 None key）。
- `restval`：当某行字段数少于字段名时，缺失字段填这个默认值（默认 None）。

**用 DictReader 读员工表**：

```python
import csv
import io

file_text = "name,age,department\n张三,28,研发部\n李四,35,市场部\n"
f = io.StringIO(file_text)

reader = csv.DictReader(f)
for row in reader:
    # row 是 dict，用字段名取值，不再依赖下标
    print(f"{row['name']} / {row['age']} / {row['department']}")

# 输出：
# 张三 / 28 / 研发部
# 李四 / 35 / 市场部
```

对比 `reader` 的 `row[0]`，`row['name']` 明显更清晰，列顺序调整、中间插入新列都不会让代码失效。

**查看字段名**。如果需要知道有哪些列：

```python
import csv
import io

file_text = "name,age,department\n张三,28,研发部\n"
f = io.StringIO(file_text)
reader = csv.DictReader(f)
print(reader.fieldnames)

# 输出：
# ['name', 'age', 'department']
```

`fieldnames` 在读取第一行后才填充，读取前为 None。

**字段数不匹配时的处理**。数据脏的情况下某行列多了或少了：

```python
import csv
import io

# 字段名 3 个，第一行数据 4 个字段（多了），第二行 2 个（少了）
file_text = "name,age,department\n张三,28,研发部,额外值\n李四,35\n"
f = io.StringIO(file_text)
reader = csv.DictReader(f, restkey="extras", restval="未知")

for row in reader:
    print(row)

# 输出：
# {'name': '张三', 'age': '28', 'department': '研发部', 'extras': ['额外值']}
# {'name': '李四', 'age': '35', 'department': '未知'}
```

多出的字段被收进 `restkey` 指定的 `extras`（值是 list），缺失字段用 `restval` 填充。处理外部数据时这两个参数很有用。

### 2.4 csv.DictWriter：按字典写入

`csv.DictWriter` 接收字典序列写入 CSV，需要显式指定字段名顺序（dict 本身不保证感知列顺序需求）。

**签名**：

```python
csv.DictWriter(f, fieldnames, restval='', extrasaction='raise', dialect='excel', **fmtparams)
```

- `fieldnames`：**必传**，字段名列表，决定输出列的顺序。
- `restval`：字典中缺失某个字段时填的默认值（默认空字符串）。
- `extrasaction`：字典中多出 `fieldnames` 之外的字段时怎么办。`"raise"`（默认）抛 `ValueError`；`"ignore"` 忽略多余字段。

方法：

- `writeheader()`：写一行字段名作为表头。
- `writerow(rowdict)`：写一行字典。
- `writerows(rowdicts)`：写多行。

**DictWriter 写带表头的 CSV**：

```python
import csv
import io

buf = io.StringIO()
fieldnames = ["name", "age", "department"]
writer = csv.DictWriter(buf, fieldnames=fieldnames)

# 先写表头
writer.writeheader()

# 用字典写数据，key 对应字段名
employees = [
    {"name": "张三", "age": "28", "department": "研发部"},
    {"name": "李四", "age": "35", "department": "市场部"},
    {"name": "王五", "age": "42", "department": "财务部"},
]
writer.writerows(employees)

print(buf.getvalue())

# 输出：
# name,age,department
# 张三,28,研发部
# 李四,35,市场部
# 王五,42,财务部
#
```

字段顺序由 `fieldnames` 列表顺序决定，与字典内 key 顺序无关——这是 `DictWriter` 相对 `writer` 的重要优势：业务代码里 dict 的 key 顺序不可控，显式声明 `fieldnames` 保证输出列序稳定。

**extrasaction 行为**：

```python
import csv
import io

buf = io.StringIO()
writer = csv.DictWriter(buf, fieldnames=["name", "age"])

# 字典里多了一个 department 字段，默认会报错
try:
    writer.writerow({"name": "张三", "age": "28", "department": "研发部"})
except ValueError as e:
    print(f"报错: {e}")

# 设置 ignore 后忽略多余字段
buf2 = io.StringIO()
writer2 = csv.DictWriter(buf2, fieldnames=["name", "age"], extrasaction="ignore")
writer2.writeheader()
writer2.writerow({"name": "张三", "age": "28", "department": "研发部"})
print(buf2.getvalue())

# 输出：
# 报错: dict contains fields not in fieldnames: 'department'
# name,age
# 张三,28
```

默认 `raise` 是一种保护机制——防止你不小心漏写某列或多写某列还不自知。明确要忽略时再改 `ignore`。

**restval 填充缺失字段**：

```python
import csv
import io

buf = io.StringIO()
writer = csv.DictWriter(buf, fieldnames=["name", "age", "department"], restval="未填写")
writer.writeheader()
# 这条记录缺 age，会用 "未填写" 填充
writer.writerow({"name": "赵六", "department": "研发部"})
print(buf.getvalue())

# 输出：
# name,age,department
# 赵六,未填写,研发部
```

### 2.5 格式参数与 dialect

CSV 在不同工具里有不同的格式习惯：Excel 用逗号、引号包裹；有些系统用分号；有些用制表符（TSV）。`csv` 模块用 **dialect（方言）+ 格式参数** 来统一描述这些差异。

**内置 dialect**：

- `excel`：默认方言，适配 Excel 导出的 CSV。分隔符逗号、引号符双引号、行尾 `\r\n`。
- `excel-tab`：同 excel 但分隔符为制表符，即 TSV。
- 自定义：用 `csv.register_dialect()` 注册。

**主要格式参数（fmtparams）**：

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `delimiter` | 字段分隔符 | `,` |
| `quotechar` | 包裹字段的引号字符 | `"` |
| `doublequote` | 引号转义方式：True 用双引号转义（`""`），False 用 escapechar 转义 | `True` |
| `escapechar` | 转义符，doublequote=False 时使用 | `None` |
| `lineterminator` | 写入时的行终止符 | `\r\n` |
| `quoting` | 何时给字段加引号，见下 | `QUOTE_MINIMAL` |
| `skipinitialspace` | 是否跳过分隔符后的空格 | `False` |

**quoting 取值**：

- `csv.QUOTE_ALL`：所有字段都加引号。
- `csv.QUOTE_MINIMAL`：仅含特殊字符（分隔符、引号、换行）的字段加引号（默认）。
- `csv.QUOTE_NONNUMERIC`：非数字字段加引号；读取时数字自动转 float。
- `csv.QUOTE_NONE`：都不加引号；含特殊字符时用 escapechar 转义（需设置 escapechar）。

**自定义分隔符读 TSV**：

```python
import csv
import io

# 制表符分隔的数据
file_text = "name\tage\tcity\n张三\t28\t北京\n"
f = io.StringIO(file_text)

reader = csv.reader(f, delimiter="\t")
for row in reader:
    print(row)

# 输出：
# ['name', 'age', 'city']
# ['张三', '28', '北京']
```

**用分号分隔（欧洲 Excel 习惯）**：

```python
import csv
import io

buf = io.StringIO()
writer = csv.writer(buf, delimiter=";")
writer.writerow(["name", "city"])
writer.writerow(["张三", "北京;上海"])  # 字段含分号会被引号包裹
print(buf.getvalue())

# 输出：
# name;city
# 张三;"北京;上海"
```

**注册自定义 dialect**。多处复用同一组格式参数时，注册成命名方言更整洁：

```python
import csv
import io

# 注册一个分号方言
csv.register_dialect("semicolon", delimiter=";", quoting=csv.QUOTE_ALL)

buf = io.StringIO()
writer = csv.writer(buf, dialect="semicolon")
writer.writerow(["name", "city"])
writer.writerow(["张三", "北京"])
print(buf.getvalue())

# 输出：
# "name";"city"
# "张三";"北京"
```

注册后所有 `reader`/`writer` 都能用 `dialect="semicolon"` 引用，避免每次重复传一堆参数。

### 2.6 处理特殊字符字段

**含逗号字段**：writer 自动引号包裹，reader 自动识别还原，前面已演示。

**含引号字段**：自动双引号转义，前面已演示。

**含换行符字段**。这是最容易踩坑的情况——一个字段里含换行，CSV 用引号包裹整个字段来保留换行：

```python
import csv
import io

buf = io.StringIO()
writer = csv.writer(buf)
writer.writerow(["name", "address"])
# 地址里含换行
writer.writerow(["张三", "北京市\n朝阳区"])
print("原始输出:", repr(buf.getvalue()))

# 读回来仍是一行（一个记录）
buf.seek(0)
reader = csv.reader(buf)
header = next(reader)
row = next(reader)
print("读回:", row)

# 输出：
# 原始输出: 'name,address\r\n张三,"北京市\n朝阳区"\r\n'
# 读回: ['张三', '北京市\n朝阳区']
```

关键点：含换行的字段被引号包裹后，reader 不会把字段内换行当成记录分隔，正确还原成一条记录。**这要求用 csv 模块读，用 `for line in f` 按物理行读会错。**

### 2.7 大文件逐行迭代

CSV 文件可能很大（几个 G），不能一次性 `list(reader)` 读进内存。正确做法是**逐行迭代**，每处理完一行就丢弃，内存占用恒定：

```python
import csv

# 统计一个大日志 CSV 里 error 级别条目数（伪代码，假设 access.csv 很大）
count = 0
# with open("access.csv", newline="", encoding="utf-8") as f:
#     reader = csv.DictReader(f)
#     for row in reader:
#         if row["level"] == "ERROR":
#             count += 1
# print(f"错误条数: {count}")
```

用 StringIO 模拟的可运行版本：

```python
import csv
import io

# 模拟 4 行日志
lines = "timestamp,level,message\n"
lines += "2026-01-01 10:00,INFO,启动\n"
lines += "2026-01-01 10:01,ERROR,连接超时\n"
lines += "2026-01-01 10:02,ERROR,磁盘满\n"
lines += "2026-01-01 10:03,INFO,恢复\n"

count = 0
f = io.StringIO(lines)
reader = csv.DictReader(f)
for row in reader:
    # 逐行处理，内存只留当前 row
    if row["level"] == "ERROR":
        count += 1
print(f"错误条数: {count}")

# 输出：
# 错误条数: 2
```

**为什么逐行迭代省内存**。reader 是迭代器，`for row in reader` 每次只从文件读一行解析一行，上一行 row 的引用在下一轮循环被丢弃。整个文件内容从不在内存中完整存在。这是处理大 CSV 的标准姿势。

如果需要分批处理（如批量入库），可以用生成器或 itertools.islice 每 N 行攒一批：

```python
import csv
import io
from itertools import islice

def batched(reader, size):
    """把 reader 按每 size 行打包成批次"""
    while True:
        batch = list(islice(reader, size))
        if not batch:
            break
        yield batch

f = io.StringIO("name,age\n" + "".join(f"p{i},{i}\n" for i in range(7)))
reader = csv.DictReader(f)
for batch in batched(reader, 3):
    print(f"处理一批 {len(batch)} 行:", [r["name"] for r in batch])

# 输出：
# 处理一批 3 行: ['p0', 'p1', 'p2']
# 处理一批 3 行: ['p3', 'p4', 'p5']
# 处理一批 1 行: ['p6']
```

### 2.8 读写字符串缓冲区

有时不直接读写文件，而是在内存里转换 CSV 字符串——比如从接口拿到的 CSV 响应、把数据拼成 CSV 发邮件。用 `io.StringIO` 作中间缓冲：

```python
import csv
import io

# 把数据导成 CSV 字符串（不落盘）
rows = [["name", "score"], ["张三", "95"], ["李四", "88"]]
buf = io.StringIO()
writer = csv.writer(buf)
writer.writerows(rows)
csv_string = buf.getvalue()
print(csv_string)

# 从 CSV 字符串解析
buf2 = io.StringIO(csv_string)
reader = csv.reader(buf2)
for row in reader:
    print(row)

# 输出：
# name,score
# 张三,95
# 李四,88
#
# ['name', 'score']
# ['张三', '95']
# ['李四', '88']
```

### 2.9 与 json / xlsx 的对比

| 特性 | csv 模块 | json 模块 | openpyxl/xlsx |
|------|---------|-----------|---------------|
| 数据形态 | 表格（行列） | 树形（嵌套对象/数组） | 表格 + 格式 + 公式 |
| 文件可读性 | 纯文本，记事本可读 | 纯文本，结构化 | 二进制 zip 包，需专用软件 |
| 类型保留 | 全是字符串，数字要手动转 | 保留 int/float/bool/null/嵌套 | 保留数字、日期、公式类型 |
| 复杂结构 | 不支持嵌套 | 天然支持 | 单元格可存丰富类型 |
| 中文 | 文本原生支持 | `\uXXXX` 转义（ensure_ascii） | 原生支持 |
| 适用场景 | 表格数据交换、大批量行数据 | 配置/接口/嵌套数据 | 需要格式、公式、多 sheet |

**选择建议**：

- 数据是行列表格、追求轻量通用 → CSV。
- 数据是嵌套结构、需要保留类型 → JSON。
- 需要给业务方看带格式的表格、公式、多 sheet → xlsx（用 openpyxl 等第三方库）。
- CSV 不能存嵌套，如果一个字段要存 list/dict，通常把它 JSON 序列化成字符串再放进 CSV 字段。

### 2.10 Sniffer 自动检测方言

拿到来源不明的 CSV，不确定分隔符是逗号还是分号，可以用 `csv.Sniffer` 自动嗅探：

```python
import csv
import io

# 这份文件用分号分隔
file_text = "a;b;c\n1;2;3\n4;5;6\n"
f = io.StringIO(file_text)

dialect = csv.Sniffer().sniff(f.read())
f.seek(0)
print(f"检测到分隔符: {dialect.delimiter!r}")

reader = csv.reader(f, dialect)
for row in reader:
    print(row)

# 输出：
# 检测到分隔符: ';'
# ['a', 'b', 'c']
# ['1', '2', '3']
# ['4', '5', '6']
```

`sniff(sample, delimiters=None)` 分析样本字符串推断 dialect。对外部数据有用，但不是 100% 可靠，尤其样本少或格式不规范时，建议嗅探后人工核对。

## 3. 最佳实践

**永远加 newline=""**。这是使用 csv 模块最硬性的规则。`open(path, newline="")` 让 csv 模块自己接管换行处理；不加的话，Windows 下 open 的默认换行翻译会和 csv 的 `\r\n` 行终止符叠加，写出每行之间多一个空行的文件。详见第 4 章原理。

- 推荐：`with open("data.csv", "w", newline="", encoding="utf-8") as f:`
- 不推荐：`with open("data.csv", "w", encoding="utf-8") as f:`（Windows 下会出空行）

**编码选择**。纯 ASCII 数据用默认编码即可；含中文时：

- 通用场景用 `encoding="utf-8"`。
- 如果文件要给旧版 Excel 直接打开不乱码，写时用 `encoding="utf-8-sig"`——它在文件头加 BOM（字节顺序标记），Excel 见 BOM 才正确识别 UTF-8。读取时 `utf-8-sig` 也能自动去掉 BOM，避免第一个字段名前多出 `﻿`。

```python
# 推荐：给 Excel 用的中文 CSV
# with open("data.csv", "w", newline="", encoding="utf-8-sig") as f:
#     writer = csv.writer(f)
#     ...

# 读取不确定有没有 BOM 的文件，用 utf-8-sig 最稳
# with open("data.csv", newline="", encoding="utf-8-sig") as f:
#     reader = csv.reader(f)
```

**优先用 DictReader/DictWriter**。除非字段极少且固定，否则字典 API 可读性和可维护性都更强。`row["price"]` 比 `row[3]` 易懂得多，列顺序变化时前者不受影响。下标访问只适合快速临时脚本。

**数字类型需手动转换**。CSV 里一切都是字符串，读到的 `age` 是 `"28"` 不是 `28`。需要数字就在业务代码里 `int(row["age"])` / `float(row["price"])`，转换失败要 try/except 兜底。

**不要用 line.split(",") 手写解析**。哪怕你觉得数据很干净，迟早会遇到含逗号的备注字段。csv 模块处理引号、转义、换行是经过充分测试的，自己 split 几乎必然在边界情况出错。

**写入时固定 fieldnames 顺序**。用 DictWriter 一定要显式传 fieldnames，别依赖 dict 的插入顺序——虽然 3.7+ dict 保序，但数据来源可能是任意构造的 dict，显式声明列序才稳妥。

**大文件逐行处理**。任何超过几 MB 的 CSV 都不应 `rows = list(reader)` 一次性读入，逐行迭代内存恒定。需要聚合统计时用累加变量，需要分批入库时用上面的 batched 生成器。

**处理脏数据的容错**。外部 CSV 经常字段数不齐、编码混乱：

- 列数不一致用 DictReader 的 `restkey`/`restval`。
- 编码不确定先试 utf-8，失败再试 gbk（Windows 中文环境常见）。
- 字段前后可能有空格，用 `skipinitialspace=True` 或业务层 strip。

```python
# 编码兜底读取
# for enc in ("utf-8-sig", "gbk", "latin-1"):
#     try:
#         f = open("data.csv", newline="", encoding=enc)
#         reader = csv.reader(f)
#         first = next(reader)
#         break
#     except (UnicodeDecodeError, StopIteration):
#         f.close()
#         continue
```

**写入后检查行数**。writerows 不会返回写入行数，关键场景可在写入前后计数核对，防止静默丢数据。

## 4. 原理

### 4.1 CSV 格式规范（RFC 4180）

CSV 看似简单，其实有规范——RFC 4180。要点：

1. **每条记录占一行**，记录间用换行分隔（规范规定 CRLF `\r\n`，实际工具也接受 `\n`）。
2. **字段间用逗号分隔**，最后字段后不跟逗号。
3. **字段含分隔符（逗号）、引号（`"`）或换行符时**，整个字段必须用双引号包裹。
4. **字段内的双引号用两个双引号转义**（`"` → `""`），且该字段整体被引号包裹。
5. **首行可以是表头**（字段名），与数据行同格式。
6. **字段前后空格有意义**，不自动 trim（除非用 `skipinitialspace`）。

```
规范示例（一条记录，3 个字段）：
张三,28,"北京,上海"      ← 第三个字段含逗号，用引号包裹
                              解析后是 ["张三","28","北京,上海"]
```

RFC 4180 只是事实标准，各工具实现有出入（Excel、MySQL、各种 DB 导出工具细节略异），所以 csv 模块用 dialect 机制兼容这些差异。

### 4.2 csv 模块的解析状态机

csv 模块底层是 C 实现的解析器（`_csv` 模块），核心是一个**逐字符状态机**，按 dialect 配置识别字段边界和引号转义。

简化后的状态流转：

- **记录起始 / 字段起始**：读入字符。
  - 遇到分隔符 → 当前字段结束（空字段），开始下一字段。
  - 遇到换行 → 当前字段结束，整条记录结束，输出该记录。
  - 遇到引号字符（且在字段起始位置）→ 进入"引号内"状态。
  - 其他字符 → 进入"普通字段"状态累积字符。
- **普通字段**：累积字符，遇到分隔符/换行结束字段。普通字段内的引号按普通字符处理（QUOTE_NONE 模式）或报错（QUOTE_MINIMAL 规范模式）。
- **引号内字段**：
  - 遇到引号 → 判断下一个字符：
    - 还是引号 → 转义，字面值存一个引号，留在引号内状态（`""` → `"`）。
    - 其他（分隔符/换行/结束）→ 引号字段结束，按分隔符/换行处理。
  - 其他字符 → 原样累积（包括换行符，这就是含换行字段能被正确保留的原因）。
- **字段结束**：把累积的字符作为字段值加入当前记录的列表。

这个状态机保证：只有不在引号内的分隔符才切分字段，引号内的分隔符、换行都是字面值。这正是 `line.split(",")` 做不到的——split 不区分引号内外，遇到 `"北京,上海"` 会错切成两段。

writer 端是对称的反向逻辑：扫描字段值，若含分隔符/引号/换行，按 quoting 策略决定是否包裹、是否转义，输出规范 CSV。

### 4.3 newline="" 的必要性

这是 csv 模块最容易被忽略又最关键的一个细节。

**open 的默认换行翻译**。`open()` 默认 `newline=None`，启用**通用换行模式**：读取时把 `\r\n`、`\r`、`\n` 都翻译成 `\n`；写入时把 `\n` 翻译成 `os.linesep`（Windows 上是 `\r\n`）。

**csv 模块自己管换行**。csv 的 writer 按 dialect 的 `lineterminator`（默认 `\r\n`）写行终止符，它期望文件层**原样写入**这些字节，不要插手翻译。

**冲突的后果（Windows）**。若 `open("f.csv","w")` 不加 `newline=""`：

1. writer 调用 `f.write("张三,28\r\n")`。
2. open 的写入层检测到其中的 `\n`，按通用换行模式把 `\n` 翻译成 `\r\n`。
3. 于是 `\r\n` 变成 `\r\r\n`——多出一个 `\r`。
4. 文件里每行后跟 `\r\r\n`，Excel 打开就显示成每行之间多一空行。

`newline=""` 的含义是**关闭换行翻译**：写入时 `\n` 原样写，不做任何替换。这样 writer 写的 `\r\n` 就是 `\r\n`，不会被二次翻译。

```python
# Windows 上的对照
# 不加 newline（错）：f.write("a\r\n") → 文件存 "a\r\r\n" → Excel 见两个换行
# 加 newline=""（对）：f.write("a\r\n") → 文件存 "a\r\n" → Excel 见一个换行
```

Linux/macOS 上 `os.linesep` 本就是 `\n`，默认模式下 `\n` 翻译成 `\n` 看似无害，但 csv 写的是 `\r\n`，其中 `\n` 会被翻译，仍可能产生 `\r\n`（恰好正常）或异常。**统一加 `newline=""` 是跨平台稳妥写法**，让 csv 模块完全掌控换行。

读取同理：`newline=""` 关闭翻译，reader 自己处理记录边界（含换行字段的情况），避免 open 把 `\r\n` 拆成 `\n` 干扰 csv 的解析。尤其含换行字段的 CSV，必须 `newline=""`，否则字段内换行被提前翻译，reader 状态机会错乱。

### 4.4 DictReader 的字段名映射机制

`DictReader` 在 `reader` 基础上加了字段名映射层：

1. **首次迭代时**，从底层 reader 读第一行，存为 `self.fieldnames`（若构造时未显式传 fieldnames）。
2. **之后每次迭代**，底层 reader 产出一个字段 list（如 `['张三','28','研发部']`）。
3. DictReader 把 `fieldnames` 与该 list **按位置 zip 配对**，构造 `dict(zip(fieldnames, row))`，返回这个 dict。
4. 若 row 比 fieldnames 长，多余部分按 `restkey` 收进一个 list；若短，缺失 key 填 `restval`。

伪代码：

```python
class DictReader:
    def __init__(self, f, fieldnames=None, ...):
        self.reader = csv.reader(f, ...)
        self.fieldnames = fieldnames  # None 表示待首次读取

    def __next__(self):
        if self.fieldnames is None:
            # 第一次迭代，读首行作字段名
            self.fieldnames = next(self.reader)
        row = next(self.reader)
        # 按位置配对，长出部分收进 restkey，短少部分填 restval
        d = dict(zip(self.fieldnames, row))
        if len(row) > len(self.fieldnames):
            d[self.restkey] = row[len(self.fieldnames):]
        elif len(row) < len(self.fieldnames):
            for k in self.fieldnames[len(row):]:
                d[k] = self.restval
        return d
```

早期 Python（2.7/3.6）返回 `OrderedDict` 以强调字段名顺序；3.8+ 因为普通 dict 已保序，直接返回 dict。对使用者来说字段访问方式不变。

DictWriter 同理：接收一个 dict，按 `fieldnames` 顺序取出每个字段的值组成 list，再交给底层 writer.writerow。多余字段按 `extrasaction` 处理，缺失字段填 `restval`。

## 5. 总结

**本文内容要点**：

- CSV 是纯文本表格格式，`csv` 模块按 RFC 4180 正确处理引号包裹、转义、换行，比手写 split 安全。
- `csv.reader(f)` / `csv.writer(f)` 是基础 API，按行返回/写入 list，用下标访问字段。
- `csv.DictReader` / `csv.DictWriter` 按字典读写，字段名作 key，可读性强、列顺序变化不影响代码，是多数业务场景的首选。
- 打开文件**必须加 `newline=""`**，否则 Windows 下写出空行、含换行字段解析出错。
- writer 自动给含逗号/引号/换行的字段加引号并转义，reader 自动还原。
- `dialect` 与 `delimiter`/`quotechar`/`quoting`/`escapechar` 等格式参数描述不同 CSV 方言，`Sniffer` 可自动嗅探。
- `writerow` 写一行、`writerows` 写多行；DictWriter 先 `writeheader` 写表头。
- 大文件逐行迭代，不要一次性 `list(reader)` 读入内存。
- 编码用 utf-8 通用，给 Excel 用中文文件写 `utf-8-sig` 处理 BOM。
- CSV 全是字符串，数字类型需手动转换；与 json 比 CSV 无嵌套、无类型，与 xlsx 比 CSV 无格式无公式。

**读完本文你应能掌握**：

- 用 `csv.reader` / `csv.writer` 正确读写 CSV，能解释为什么必须 `newline=""`。
- 用 `DictReader` / `DictWriter` 按字典读写带表头的 CSV，掌握 `fieldnames`/`restkey`/`restval`/`extrasaction` 各参数的作用与选用。
- 处理含逗号、引号、换行的特殊字段，理解引号包裹与双引号转义规则。
- 通过 `dialect` 和 `delimiter`/`quotechar`/`quoting` 等参数适配不同分隔符和方言，能用 `Sniffer` 嗅探未知文件。
- 逐行迭代处理大 CSV 文件，控制内存占用。
- 根据场景在 csv / json / xlsx 三者间做出合理选型。