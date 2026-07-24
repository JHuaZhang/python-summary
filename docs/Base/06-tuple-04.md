---
group:
  title: 【06】元组深度剖析
  order: 6
order: 4
title: 元组作为字典的key
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 为什么元组可以作为字典 key

在 Python 中，字典（dict）是一种键值对的数据结构，要求键（key）必须满足可哈希（hashable）的特性。元组作为不可变类型，是少数可以作为字典键的复合数据类型之一。这一特性使得元组在需要复合键的场景中非常有用，例如多维坐标、范围查询、复合索引等。

```python
# 元组作为字典键的基本示例
location_mapping = {
    (37.7749, -122.4194): "San Francisco",
    (40.7128, -74.0060): "New York",
    (51.5074, -0.1278): "London",
}

# 使用元组键查询
print(location_mapping[(37.7749, -122.4194)])  # 输出：San Francisco
```

理解元组作为字典键的能力和限制，对于设计高效的数据结构和算法至关重要。

### 1.2 字典键的要求

字典要求键必须满足以下条件：

- **可哈希**：键对象必须具有稳定的哈希值
- **不可变**：键在字典的整个生命周期中保持不变
- **可比较**：键对象必须支持相等性比较

```python
# 可作为字典键的类型
d = {}
d[1] = "integer"        # 整数
d["hello"] = "string"   # 字符串
d[(1, 2)] = "tuple"    # 不可变元组

# 不可作为字典键的类型
# d[[1, 2]] = "list"    # TypeError: unhashable type: 'list'
# d[{1: 2}] = "dict"   # TypeError: unhashable type: 'dict'
# d[{1, 2}] = "set"    # TypeError: unhashable type: 'set'
```

### 1.3 元组作为键的优势

使用元组作为字典键的优势体现在多个方面：

| 优势 | 说明 |
|-----|------|
| 复合键 | 可以将多个值组合成一个键 |
| 性能 | 哈希计算快，查找效率高 |
| 可读性 | 语义清晰，如 `(x, y)` 表示坐标 |
| 有序 | 元组元素有顺序，支持精确匹配 |

```python
# 复合键：学期-课程 -> 学生列表
enrollment = {
    ("2024", "CS101"): ["Alice", "Bob"],
    ("2024", "CS102"): ["Charlie"],
    ("2023", "CS101"): ["David"],
}

# 查询 2024 年 CS101 课程的学生
print(enrollment[("2024", "CS101")])  # 输出：['Alice', 'Bob']
```

## 2. 核心内容

### 2.1 基础用法

#### 2.1.1 创建元组键字典

```python
# 基本用法
point_coords = {
    (0, 0): "原点",
    (1, 0): "正X轴",
    (0, 1): "正Y轴",
    (1, 1): "第一象限",
}

print(point_coords[(0, 0)])  # 输出：原点

# 复杂键
config = {
    ("db", "host"): "localhost",
    ("db", "port"): 5432,
    ("cache", "host"): "127.0.0.1",
    ("cache", "port"): 6379,
}

print(config[("db", "host")])  # 输出：localhost
```

#### 2.1.2 字典的默认行为

```python
# 字典的键可以是任意可哈希类型
d = {
    1: "int",
    3.14: "float",
    "str": "string",
    (1, 2): "tuple",
    (True, "a"): "mixed_tuple",
}

print(len(d))  # 输出：5
print(d[(1, 2)])  # 输出：tuple

# 键的类型可以混用
mixed_keys = {
    "name": "value",
    (1, 2): "tuple_key",
    (True,): "single_bool_tuple",
}
```

#### 2.1.3 遍历元组键字典

```python
# 遍历字典的键是元组的字典
config = {
    ("db", "host"): "localhost",
    ("db", "port"): 5432,
    ("cache", "host"): "127.0.0.1",
}

# 遍历所有键值对
for key, value in config.items():
    category, setting = key
    print(f"{category}.{setting} = {value}")
# 输出：
# db.host = localhost
# db.port = 5432
# cache.host = 127.0.0.1

# 只遍历某个分类
for (category, setting), value in config.items():
    if category == "db":
        print(f"db.{setting} = {value}")
```

### 2.2 嵌套与复合键

#### 2.2.1 多级复合键

```python
# 更复杂的复合键
# (年份, 季节, 月份) -> 销售额
sales = {
    (2024, "Spring", "March"): 15000,
    (2024, "Spring", "April"): 18000,
    (2024, "Summer", "June"): 25000,
    (2023, "Winter", "December"): 30000,
}

# 查询特定时间范围
year_season_sales = {
    (year, season): sum(
        v for (y, s, m), v in sales.items() 
        if y == year and s == season
    )
    for year in {2023, 2024}
    for season in {"Spring", "Summer", "Winter"}
}

print(year_season_sales)
# 输出={(2023, 'Winter'): 30000, (2024, 'Spring'): 33000, (2024, 'Summer'): 25000}
```

#### 2.2.2 字典键的多层次结构

```python
# 使用元组键组织层次数据
filesystem = {
    ("/",): "root",
    ("/", "home"): "home directory",
    ("/", "home", "user"): "user home",
    ("/", "etc"): "etc directory",
    ("/", "etc", "passwd"): "password file",
}

# 遍历查看结构
for path, description in filesystem.items():
    print(f"Path: {'/'.join(path)}, Description: {description}")
# 输出：
# Path: /, Description: root
# Path: /home, Description: home directory
# Path: /home/user, Description: user home
# Path: /etc, Description: etc directory
# Path: /etc/passwd, Description: password file
```

### 2.3 哈希与相等性

#### 2.3.1 元组键的哈希计算

元组的哈希值是基于其内容的，如果元组中所有元素都可哈希，那么元组本身也可哈希：

```python
# 可哈希的元组（所有元素都不可变）
t1 = (1, 2, 3)
print(f"hash: {hash(t1)}")  # 输出：hash: 529344067295497451

# 不可哈希的元组（包含可变元素）
t2 = (1, [2, 3])
# hash(t2)  # TypeError: unhashable type: 'list'

# 验证：相同内容的元组哈希值相同
t3 = (1, 2, 3)
t4 = (1, 2, 3)
print(f"t1 == t3: {t1 == t3}")  # 输出：True
print(f"hash(t1) == hash(t3): {hash(t1) == hash(t3)}")  # 输出：True
```

#### 2.3.2 字典键的相等性判断

```python
# 字典键使用相等性判断
d = {(1, 2): "value1", (3, 4): "value2"}

# 查找时使用 == 判断
print(d[(1, 2)])  # 输出：value1

# 键的相等性
key1 = (1, 2)
key2 = (1, 2)
print(f"key1 == key2: {key1 == key2}")  # 输出：True
print(f"key1 is key2: {key1 is key2}")  # 输出：False

# 相同内容的元组作为键是等价的
d2 = {(1, 2): "original"}
d2[(1, 2)] = "updated"  # 覆盖原值
print(d2)  # 输出：{(1, 2): 'updated'}
```

#### 2.3.3 嵌套元组键

嵌套元组如果所有元素都可哈希，也可以作为键：

```python
# 嵌套元组键
nested_key = ((1, 2), (3, 4))
d = {nested_key: "value"}
print(d[nested_key])  # 输出：value

# 深层嵌套
deep_nested = (((1, 2), (3, 4)), ((5, 6), (7, 8)))
d2 = {deep_nested: "deep"}
print(d2[deep_nested])  # 输出：deep
```

### 2.4 常见应用场景

#### 2.4.1 坐标系统

```python
# 二维坐标映射
city_map = {
    (39.9042, 116.4074): "北京",
    (31.2304, 121.4737): "上海",
    (22.5431, 114.0579): "深圳",
    (23.1291, 113.2644): "广州",
}

def find_nearest_city(target_lat, target_lon):
    """查找最近的城市"""
    nearest = None
    min_dist = float('inf')
    
    for (lat, lon), city in city_map.items():
        dist = ((lat - target_lat)**2 + (lon - target_lon)**2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            nearest = city
    
    return nearest

# 测试
print(find_nearest_city(39.9, 116.4))  # 输出：北京
print(find_nearest_city(22.5, 114.0))  # 输出：深圳
```

#### 2.4.2 范围查询

```python
# 范围分段
def score_to_grade(score):
    """分数转等级"""
    grade_map = {
        (90, 100): "A",
        (80, 90): "B",
        (70, 80): "C",
        (60, 70): "D",
        (0, 60): "F",
    }
    
    for (low, high), grade in grade_map.items():
        if low <= score <= high:
            return grade
    return "Invalid"

# 测试
print(score_to_grade(95))  # 输出：A
print(score_to_grade(85))  # 输出：B
print(score_to_grade(55))  # 输出：F
```

#### 2.4.3 多维索引

```python
# 多维数据索引
# (年份, 类别, 地区) -> 销售量
sales_data = {
    (2024, "electronics", "north"): 15000,
    (2024, "electronics", "south"): 12000,
    (2024, "clothing", "north"): 8000,
    (2024, "clothing", "south"): 9500,
    (2023, "electronics", "north"): 13000,
}

# 查询所有 2024 年的电子产品销售
year_category_sales = sum(
    v for (year, category, region), v in sales_data.items()
    if year == 2024 and category == "electronics"
)
print(f"2024年电子产品总销量: {year_category_sales}")  # 输出：27000

# 按区域汇总
region_totals = {}
for (year, category, region), sales in sales_data.items():
    if region not in region_totals:
        region_totals[region] = 0
    region_totals[region] += sales

print(f"区域销售: {region_totals}")
# 输出：{'north': 36000, 'south': 31500}
```

#### 2.4.4 配置管理

```python
# 应用配置存储
app_config = {
    ("database", "host"): "localhost",
    ("database", "port"): 5432,
    ("database", "name"): "myapp",
    ("redis", "host"): "127.0.0.1",
    ("redis", "port"): 6379,
    ("server", "host"): "0.0.0.0",
    ("server", "port"): 8080,
}

def get_config(section, key):
    """获取配置值"""
    return app_config.get((section, key))

def set_config(section, key, value):
    """设置配置值"""
    app_config[(section, key)] = value

# 测试
print(get_config("database", "host"))  # 输出：localhost
set_config("database", "pool_size", 10)
print(get_config("database", "pool_size"))  # 输出：10
```

### 2.5 元组键的注意事项

#### 2.5.1 元素顺序

元组键是有序的，顺序不同即为不同的键：

```python
d = {}
d[(1, 2)] = "forward"
d[(2, 1)] = "backward"

print(d)  # 输出：{(1, 2): 'forward', (2, 1): 'backward'}
print(d[(1, 2)])  # 输出：forward
print(d[(2, 1)])  # 输出：backward
```

#### 2.5.2 键的唯一性

字典的键必须唯一，后面的值会覆盖前面的：

```python
d = {}
d[(1, 2)] = "first"
d[(1, 2)] = "second"
print(d)  # 输出：{(1, 2): 'second'}
```

#### 2.5.3 键必须是可哈希的

包含不可哈希元素的元组不能作为键：

```python
d = {}

# OK：不可变元素
d[(1, 2, 3)] = "ok"

# 错误：包含列表
# d[(1, [2], 3)] = "error"  # TypeError

# 错误：包含字典
# d[(1, {"a": 1}, 3)] = "error"  # TypeError

# 错误：包含集合
# d[(1, {2, 3}, 4)] = "error"  # TypeError

# OK：包含 frozenset（不可变集合）
d[(1, frozenset([2, 3]), 4)] = "ok"
print(d)  # 输出：{(1, 2, 3): 'ok', (1, frozenset({2, 3}), 4): 'ok'}
```

## 3. 最佳实践

### 3.1 设计复合键

**原则一：键应该有意义的结构**

```python
# ✅ 推荐：语义清晰的键结构
user_action = {
    ("login", "success"): 100,
    ("login", "failed"): 5,
    ("logout",): 95,
}

# ❌ 不推荐：意义不明确的键
# user_action = {("action1",): 100, ("action2",): 5}
```

**原则二：键的结构应该一致**

```python
# ❌ 不一致：有的键两个元素，有的三个
# config = {("db",): "host", ("cache", "host"): "localhost"}

# ✅ 一致：所有键都是相同的结构
config = {
    ("db", "host"): "localhost",
    ("db", "port"): 5432,
    ("cache", "host"): "127.0.0.1",
    ("cache", "port"): 6379,
}
```

### 3.2 性能优化

**使用元组键 vs 嵌套字典**

```python
import timeit

# 方式一：元组作为键
def use_tuple_key():
    d = {(i, j): i * j for i in range(100) for j in range(100)}
    return sum(d[(i, j)] for i in range(100) for j in range(100))

# 方式二：嵌套字典
def use_nested_dict():
    d = {}
    for i in range(100):
        d[i] = {}
        for j in range(100):
            d[i][j] = i * j
    return sum(d[i][j] for i in range(100) for j in range(100))

t1 = timeit.timeit(use_tuple_key, number=100)
t2 = timeit.timeit(use_nested_dict, number=100)

print(f"元组键: {t1:.4f} 秒")
print(f"嵌套字典: {t2:.4f} 秒")
# 元组键通常在键查找时更高效
```

### 3.3 常见模式

**模式一：使用 namedtuple 作为键**

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
Coordinate = namedtuple("Coordinate", ["lat", "lon"])

# 使用命名元组作为键
locations = {
    Point(0, 0): "Origin",
    Point(1, 0): "East",
    Point(0, 1): "North",
}

# 或使用坐标
cities = {
    Coordinate(37.7749, -122.4194): "San Francisco",
    Coordinate(40.7128, -74.0060): "New York",
}
```

**模式二：在字典推导式中使用元组键**

```python
# 创建元组键的字典
data = [(("a", 1), 10), (("b", 2), 20), (("a", 3), 30)]

d = {k: v for k, v in data}
print(d)  # 输出：{('a', 1): 10, ('b', 2): 20, ('a', 3): 30}

# 按第一元素分组求和
from collections import defaultdict
grouped = defaultdict(int)
for (first, second), value in data:
    grouped[first] += value

print(dict(grouped))  # 输出：{'a': 40, 'b': 20}
```

### 3.4 错误处理

**安全访问元组键的字典**

```python
# 使用 get 方法避免 KeyError
d = {(1, 2): "value"}

# 方式一：get 方法
result = d.get((1, 2), "default")
print(result)  # 输出：value

result = d.get((3, 4), "default")
print(result)  # 输出：default

# 方式二：捕获异常
try:
    result = d[(3, 4)]
except KeyError:
    result = "not found"
print(result)  # 输出：not found

# 方式三：检查键存在
if (1, 2) in d:
    result = d[(1, 2)]
else:
    result = "default"
```

## 4. 原理

### 4.1 字典的哈希表实现

字典在 Python 中使用哈希表（Hash Table）实现，键的哈希值决定了存储位置：

```python
# 简化理解：字典的内部结构
# 哈希表 = 数组 + 哈希函数 + 冲突解决

# 当添加键值对时：
# 1. 计算键的哈希值
# 2. 用哈希值确定存储位置
# 3. 如果位置已被占用，使用开放寻址或链表解决冲突

# 当查找时：
# 1. 计算键的哈希值
# 2. 定位到哈希值对应的位置
# 3. 比较键是否相等（使用 ==）
# 4. 返回对应的值或抛出 KeyError
```

### 4.2 元组哈希的计算过程

元组的哈希值计算基于其元素：

```python
# 简单理解：元组哈希 = hash(元素1, 元素2, ...)

# 实际实现参考
t1 = (1, 2)
hash1 = hash(t1)

# 哈希值相同的元组，在字典中被视为相同的键
t2 = (1, 2)
hash(t1) == hash(t2)  # True
t1 == t2  # True

# 这就是字典查找快的秘密
```

### 4.3 不可哈希元素的处理

当元组包含不可哈希元素时，整个元组不可哈希：

```python
# 元组中只要有一个元素不可哈希，整个元组就不可哈希
t = (1, [2, 3])

try:
    h = hash(t)
except TypeError as e:
    print(f"无法哈希: {e}")
# 输出：无法哈希: unhashable type: 'list'

# 这是 Python 的设计决策
# 如果允许包含可变元素的元组作为键
# 元素改变后哈希值会变，字典查询就会失败
```

## 5. 总结

### 5.1 核心要点

本文详细讲解了元组作为字典键的各个方面：

1. **元组键的优势**：可哈希、复合键、有序、可读性好
2. **基础用法**：创建、查询、遍历
3. **复合键设计**：多维索引、层次结构
4. **哈希机制**：元组哈希计算、相等性判断
5. **应用场景**：坐标系统、范围查询、多维索引
6. **注意事项**：元素顺序、键唯一性、可哈希要求

### 5.2 元组作为键的适用场景

| 场景 | 示例 | 说明 |
|-----|------|------|
| 坐标映射 | `{(lat, lon): city}` | 地理信息系统 |
| 多维索引 | `{(year, month): value}` | 时间序列数据 |
| 配置管理 | `{(section, key): value}` | 应用配置 |
| 范围分段 | `{(min, max): label}` | 分数转等级 |
| 嵌套结构 | `{(parent, child): value}` | 树形结构映射 |

### 5.3 不适合使用元组键的场景

| 场景 | 原因 | 替代方案 |
|-----|------|---------|
| 需要按前缀查询 | 元组键必须精确匹配 | 使用 Trie 或前缀树 |
| 键需要修改 | 元组不可变 | 使用嵌套字典 |
| 键数量极大但分布稀疏 | 哈希表空间浪费 | 使用 BTree 或数据库 |

### 5.4 读完应能掌握

- 能说明为什么元组可以作为字典键
- 能设计合适的复合键结构
- 能使用元组键实现多维索引和范围查询
- 能区分元组键和嵌套字典的使用场景
- 能处理元组键的哈希和相等性问题

### 5.5 常见面试问题

**问题一：列表可以作为字典的键吗**

```python
# 不能
# d[[1,2]] = "value"  # TypeError: unhashable type: 'list'

# 原因：列表是可变的，哈希值不稳定
lst = [1, 2]
h1 = hash(lst)
lst.append(3)
h2 = hash(lst)
print(f"h1 == h2: {h1 == h2}")  # 输出：False —— 哈希值变了
```

**问题二：元组和字典作为键的区别**

```python
# 元组作为键：结构固定，适合精确匹配
d1 = {("a", 1): "value"}

# 字典作为键：不太常见，因为字典本身可变（不可哈希）
# 但 frozenset 可以作为键
# d2 = {{"a": 1}: "value"}  # 错误

# 如果确实需要字典作为键，转换为 frozenset
d2 = {frozenset({"a", 1}): "value"}
```

**问题三：自定义类可以作为字典键吗**

```python
# 自定义类如果重写了 __hash__ 和 __eq__，可以作为键
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __hash__(self):
        return hash((self.x, self.y))
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

p = Point(1, 2)
d = {p: "point"}
print(d[p])  # 输出：point

# 但如果只重写 __eq__ 而不重写 __hash__，对象会变成不可哈希
class Point2:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

# p2 = Point2(1, 2)
# d[p2] = "point"  # TypeError: unhashable type: 'Point2'
```

### 5.6 实际项目中的使用案例

**案例一：缓存函数结果**

```python
from functools import lru_cache

# 使用不可变参数作为缓存键
@lru_cache(maxsize=128)
def calculate(a, b, operation):
    """计算函数，缓存结果"""
    if operation == "add":
        return a + b
    elif operation == "multiply":
        return a * b
    return a - b

# 调用
print(calculate(1, 2, "add"))  # 计算并缓存
print(calculate(1, 2, "add"))  # 使用缓存
```

**案例二：多维统计**

```python
# 销售统计
# (产品类别, 地区, 季度) -> 销量
sales = {
    ("electronics", "north", "Q1"): 15000,
    ("electronics", "north", "Q2"): 18000,
    ("electronics", "south", "Q1"): 12000,
    ("clothing", "north", "Q1"): 8000,
}

# 按产品类别汇总
by_category = {}
for (category, region, quarter), amount in sales.items():
    by_category.setdefault(category, 0)
    by_category[category] += amount

print(by_category)  # 输出：{'electronics': 45000, 'clothing': 8000}

# 按季度汇总
by_quarter = {}
for (category, region, quarter), amount in sales.items():
    by_quarter.setdefault(quarter, 0)
    by_quarter[quarter] += amount

print(by_quarter)  # 输出：{'Q1': 35000, 'Q2': 18000}
```

**案例三：路由映射**

```python
# HTTP 路由处理
routes = {
    ("GET", "/users"): get_users_handler,
    ("GET", "/users/:id"): get_user_handler,
    ("POST", "/users"): create_user_handler,
    ("PUT", "/users/:id"): update_user_handler,
    ("DELETE", "/users/:id"): delete_user_handler,
}

def handle_request(method, path):
    """处理请求"""
    # 精确匹配
    if (method, path) in routes:
        return routes[(method, path)]()
    
    # 模式匹配（简化版）
    for (m, p), handler in routes.items():
        if m == method:
            if match_pattern(p, path):
                return handler(path)
    
    return not_found_handler

# 辅助函数（模拟）
def get_users_handler():
    return "获取用户列表"

def get_user_handler(path):
    return f"获取用户: {path}"

def create_user_handler():
    return "创建用户"

def update_user_handler(path):
    return f"更新用户: {path}"

def delete_user_handler(path):
    return f"删除用户: {path}"

def match_pattern(pattern, path):
    """简单的模式匹配"""
    return True  # 简化实现

def not_found_handler():
    return "404 Not Found"

# 测试路由
print(handle_request("GET", "/users"))
print(handle_request("POST", "/users"))
print(handle_request("PUT", "/users/123"))
```
