---
group:
  title: 【14】装饰器深度剖析
  order: 14
order: 7
title: 装饰器实战权限校验
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是权限校验装饰器

在 Web 后端开发中，几乎每个业务接口都要回答两个问题：调用者登录了吗？调用者有权限做这件事吗？一个用户管理后台的 `delete_user` 接口，显然不能让匿名访客调用，也不能让普通用户调用，只有管理员才行。如果每个接口函数内部都手写一遍 `if not current_user: return 401`、`if current_user.role != 'admin': return 403`，代码会被重复的校验逻辑淹没，真正业务逻辑反而被淹没在一堆 if 判断里。

权限校验装饰器就是把这些"调用前校验"的逻辑抽成可复用的装饰器。最典型的有两个：`@login_required` 负责判断是否登录，未登录则拒绝；`@require_role("admin")` 负责判断当前用户角色是否满足，不满足则拒绝。两者可以叠加使用，先验证登录、再验证角色，层层过滤，只有全部通过才放行调用原函数。

这种写法的好处是声明式的：看函数定义的装饰器就知道它需要什么权限，校验逻辑与业务逻辑彻底分离，新增接口时只要挂上对应装饰器即可，不用再复制粘贴 if 判断。装饰器从"语法糖"变成了真正的工程利器。

本篇是装饰器系列的实战收尾篇。前面几篇讲了无参装饰器、带参数装饰器、执行顺序、`functools.wraps`，这一篇把它们综合起来，落到一个真实业务场景——权限校验——给出完整可运行的实现。

### 1.2 最小用法预览

先看一个最小骨架，感受权限校验装饰器长什么样。下面这个 `@login_required` 从一个模拟的 `current_user` 上下文取当前用户，为空就抛 `PermissionError`，非空就放行。

```python
import functools

# 模拟当前登录用户，None 表示未登录
current_user = None

def login_required(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if current_user is None:
            raise PermissionError("未登录，请先登录")
        return func(*args, **kwargs)
    return wrapper

@login_required
def view_profile():
    return "这是你的个人资料"

# 未登录时调用
try:
    view_profile()
except PermissionError as e:
    print(e)
# 输出：未登录，请先登录

# 登录后再调用
current_user = {"name": "张三", "role": "user"}
print(view_profile())
# 输出：这是你的个人资料
```

这就是最朴素的形式。`@login_required` 不接收额外参数，是标准的无参装饰器；`@require_role("admin")` 要接收角色名，是带参数装饰器（三层结构）。两者叠加时涉及装饰器执行顺序的洋葱模型。这些前置知识前面几篇都讲过，本篇会把它们串起来用到实处。

## 2. 核心内容

### 2.1 模拟 current_user 与 session 上下文

真实 Web 框架里，"当前用户"是从请求上下文里取的——Flask 用 `flask.g` 或 `session`，FastAPI 用 `Depends` 把当前用户注入进来。这里为了专注装饰器本身，用一个模块级变量模拟请求上下文，但会把它封装得稍微像样一点，让代码结构贴近真实场景。

**为什么需要上下文**

权限校验装饰器在函数调用时执行，它要能拿到"当前是谁在调用"这个信息。这个信息不属于函数参数（业务函数不该关心鉴权细节），只能来自外部的请求上下文。装饰器通过闭包访问这个上下文变量——这正是闭包"让内层函数访问外层作用域变量"的能力在工程上的落地。

下面搭一个轻量的会话上下文模拟，后面的所有装饰器都基于它。

```python
"""
会话上下文模拟：用模块级变量充当请求上下文。
真实框架中这部分由 request / session / Depends 提供。
"""

# 全局会话表：token -> 用户信息
# 模拟服务端的 session 存储，登录时写入，校验时查询
_sessions = {}

# 当前请求绑定的用户，每个请求开始时设置
# None 表示当前请求未携带有效登录态
_current_user = None


def login(name, role):
    """模拟登录：生成 token，写入 session 表，返回 token。"""
    import uuid
    token = uuid.uuid4().hex
    _sessions[token] = {"name": name, "role": role}
    return token


def set_request_user(token):
    """模拟请求开始时，根据 token 解析当前用户。

    真实框架中这一步由中间件完成：从 cookie/header 取 token，
    查 session/数据库，把用户对象挂到请求上下文。
    """
    global _current_user
    _current_user = _sessions.get(token)  # token 无效时返回 None


def clear_request_user():
    """模拟请求结束，清理当前用户。"""
    global _current_user
    _current_user = None


def get_current_user():
    """获取当前用户，未登录返回 None。"""
    return _current_user
```

这段代码把"会话存储"和"当前请求用户"分开了：`_sessions` 是服务端持久化的会话表，`_current_user` 是单个请求生命周期内的当前用户。这是对真实 Web 场景的合理简化——每个请求进来时，中间件根据请求里的 token 查 session 表，设置 `_current_user`；请求结束清理掉。装饰器只关心 `get_current_user()` 返回什么。

### 2.2 登录校验装饰器 @login_required

`@login_required` 是最基础的权限校验装饰器，它只回答一个问题：当前用户登录了吗？它的实现逻辑是：在调用原函数前，先取当前用户，为空就抛异常表示未登录，非空才放行。

**签名与行为**

`login_required` 是无参装饰器，签名固定为 `login_required(func)`。它返回的 `wrapper` 在调用时执行校验。校验失败有两种常见处理方式：抛异常（让上层统一捕获转成 HTTP 401）或直接返回错误响应。这里先采用抛异常的方式，因为它与业务函数的返回值类型解耦，后面再讲如何把异常映射成 HTTP 状态码。

**完整实现**

```python
import functools


class AuthenticationError(Exception):
    """未登录异常，对应 HTTP 401。"""
    pass


def login_required(func):
    """登录校验装饰器：未登录抛 AuthenticationError。"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if user is None:
            # 未登录，拒绝调用，抛异常交由上层处理
            raise AuthenticationError(
                f"访问 {func.__name__} 需要登录，但当前未登录"
            )
        # 已登录，放行，把当前用户作为额外信息打印（可选）
        print(f"  [login_required] 已登录用户：{user['name']}，放行 {func.__name__}")
        return func(*args, **kwargs)

    return wrapper
```

注意几个细节。第一，用了 `functools.wraps(func)`，保证被装饰后的函数仍保留原函数名、文档字符串等元信息，这在后面"异常映射"和框架对接时很重要，日志里打印的函数名才会是真实的视图函数名。第二，`wrapper` 用 `*args, **kwargs` 透传参数，不关心原函数长什么样，保证通用性。第三，校验通过后打印一行日志，这在调试权限链时非常有用，能直观看到"校验到了哪一层"。

**演示效果**

```python
@login_required
def view_profile():
    """查看个人资料。"""
    user = get_current_user()
    return f"{user['name']} 的个人资料"

# 场景一：未登录调用
clear_request_user()
try:
    view_profile()
except AuthenticationError as e:
    print(f"被拒绝：{e}")
# 输出：
# 被拒绝：访问 view_profile 需要登录，但当前未登录

# 场景二：登录后调用
token = login("张三", "user")
set_request_user(token)
print(view_profile())
# 输出：
#   [login_required] 已登录用户：张三，放行 view_profile
# 张三 的个人资料

clear_request_user()
```

从输出可以清楚看到校验链：未登录时直接抛异常，根本进不到 `view_profile` 函数体；登录后先经过 `login_required` 的校验打印，再执行原函数返回资料。这就是"调用前拦截"的效果。

### 2.3 角色校验装饰器 @require_role

`@require_role("admin")` 是带参数装饰器，它要接收一个角色名参数，用来声明"调用这个函数需要什么角色"。它比 `login_required` 多一层：外层接收参数，中层接收函数，内层执行校验。这是带参数装饰器的标准三层结构。

**签名与行为**

`require_role` 的签名是 `require_role(role)`，其中 `role` 是必需的角色名。它返回一个真正的装饰器（接收 `func` 的那层），该装饰器再返回 `wrapper`。校验逻辑是：取当前用户，检查 `user["role"]` 是否等于要求的角色，不等就抛 `PermissionError`（对应 HTTP 403）。

注意它假设当前用户已经登录——因为角色校验只有在已登录前提下才有意义。所以 `@require_role` 通常和 `@login_required` 叠加使用，后者保证登录，前者保证角色。单独使用 `@require_role` 时要自行处理 `current_user` 为 `None` 的情况。

**完整实现**

```python
class PermissionDeniedError(Exception):
    """权限不足异常，对应 HTTP 403。"""
    pass


def require_role(role):
    """角色校验装饰器工厂：接收角色名，返回真正的装饰器。

    参数：
        role：需要的角色名，如 "admin"、"editor"。
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            # 防御性检查：未登录时角色校验无意义，直接拒绝
            if user is None:
                raise AuthenticationError(
                    f"访问 {func.__name__} 需要登录"
                )
            if user["role"] != role:
                raise PermissionDeniedError(
                    f"访问 {func.__name__} 需要 {role} 角色，"
                    f"当前用户 {user['name']} 是 {user['role']}"
                )
            print(f"  [require_role] {user['name']} 具有 {role} 角色，放行 {func.__name__}")
            return func(*args, **kwargs)

        return wrapper

    return decorator
```

这里体现带参数装饰器的三层结构：第一层 `require_role(role)` 接收参数并定义 `decorator`；第二层 `decorator(func)` 接收被装饰函数并定义 `wrapper`；第三层 `wrapper(*args, **kwargs)` 在调用时执行校验。参数 `role` 通过闭包一路传到最内层，这正是闭包"延迟使用外层变量"的典型场景——`role` 在装饰阶段确定，在使用阶段被读取。

**演示效果**

```python
@require_role("admin")
def delete_user(user_id):
    """删除指定用户，需要管理员权限。"""
    return f"已删除用户 {user_id}"

# 场景一：管理员调用
admin_token = login("管理员老王", "admin")
set_request_user(admin_token)
print(delete_user(1001))
# 输出：
#   [require_role] 管理员老王 具有 admin 角色，放行 delete_user
# 已删除用户 1001

# 场景二：普通用户调用
user_token = login("普通用户小李", "user")
set_request_user(user_token)
try:
    delete_user(1002)
except PermissionDeniedError as e:
    print(f"被拒绝：{e}")
# 输出：
# 被拒绝：访问 delete_user 需要 admin 角色，当前用户 普通用户小李 是 user

clear_request_user()
```

普通用户小李调用 `delete_user` 时，`require_role` 发现他的角色是 `user`，不等于要求的 `admin`，于是抛 `PermissionDeniedError`，原函数体根本没机会执行。这就是角色级权限控制的效果。

**支持多角色**

实际业务中，一个接口可能允许多个角色访问，比如"admin 或 editor 都行"。可以把 `role` 参数升级为支持单角色字符串或多角色列表。

```python
def require_role_any(*roles):
    """允许多角色：当前用户角色只要命中其一即放行。"""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if user is None:
                raise AuthenticationError(f"访问 {func.__name__} 需要登录")
            if user["role"] not in roles:
                raise PermissionDeniedError(
                    f"访问 {func.__name__} 需要角色 {roles} 之一，"
                    f"当前用户 {user['name']} 是 {user['role']}"
                )
            print(f"  [require_role_any] {user['name']}({user['role']}) 命中 {roles}，放行")
            return func(*args, **kwargs)

        return wrapper

    return decorator


@require_role_any("admin", "editor")
def edit_post(post_id):
    """编辑文章，admin 或 editor 均可。"""
    return f"已编辑文章 {post_id}"

# editor 调用
editor_token = login("编辑小赵", "editor")
set_request_user(editor_token)
print(edit_post(88))
# 输出：
#   [require_role_any] 编辑小赵(editor) 命中 ('admin', 'editor')，放行
# 已编辑文章 88

# 普通用户调用
user_token = login("读者小孙", "user")
set_request_user(user_token)
try:
    edit_post(89)
except PermissionDeniedError as e:
    print(f"被拒绝：{e}")
# 输出：
# 被拒绝：访问 edit_post 需要角色 ('admin', 'editor') 之一，当前用户 读者小孙 是 user

clear_request_user()
```

`require_role_any` 用 `*roles` 收集多个角色名，校验时判断当前用户角色是否在这组角色里。这展现了带参数装饰器的灵活性——参数形式可以根据业务需求自由设计。

### 2.4 多装饰器叠加：洋葱模型

权限校验最典型的用法是叠加多个装饰器。比如 `delete_user` 这个敏感操作，既要登录、又要管理员角色，写出来就是：

```python
@require_role("admin")
@login_required
def delete_user(user_id):
    """删除用户：先验证登录，再验证管理员角色。"""
    return f"已删除用户 {user_id}"
```

这里有两个要点：装饰顺序（写法上的顺序）和调用顺序（执行时的顺序），它们是"反向"的。

**装饰顺序（自下而上）**

`@require_role("admin")` 在上，`@login_required` 在下。Python 解析装饰器是自下而上的：先把 `delete_user` 传给 `login_required`，得到 wrapper1；再把 wrapper1 传给 `require_role("admin")` 返回的装饰器，得到 wrapper2。最终 `delete_user` 这个名字绑定的是 wrapper2。等价于：

```python
delete_user = require_role("admin")(login_required(delete_user))
```

**调用顺序（自上而下，洋葱模型）**

调用 `delete_user(x)` 时，实际调用的是 wrapper2（最外层 `require_role` 的 wrapper）。它先执行角色校验前的逻辑，然后调用内层 wrapper1（`login_required` 的 wrapper）；wrapper1 执行登录校验，通过后调用真正的 `delete_user` 函数体；函数体返回后，逐层往外返回。就像剥洋葱，从外向内进入，再从内向外出来。这就是"洋葱模型"。

但这里有个问题值得思考：上面的写法是 `@require_role("admin")` 在外、`@login_required` 在内，调用时先执行 `require_role` 的校验，再执行 `login_required` 的校验。而 `require_role` 内部已经做了"未登录则拒绝"的防御性检查，所以即使 `login_required` 没先执行，未登录用户也会被 `require_role` 挡住。但更规范的写法应该是登录校验在最外层先执行，即：

```python
@login_required
@require_role("admin")
def delete_user(user_id):
    """删除用户：登录校验在最外层，角色校验在内层。"""
    return f"已删除用户 {user_id}"
```

这样调用时先过 `login_required`（登录了吗？），再过 `require_role`（角色对吗？），语义更清晰：先确认身份，再确认权限。这也是社区惯例——`login_required` 写在最外层。

下面用完整 demo 验证调用顺序，打印每一步进入和退出。

```python
@require_role("admin")
@login_required
def delete_user(user_id):
    """删除用户：先登录校验，再角色校验。"""
    print(f"    [业务] 正在删除用户 {user_id}")
    return f"已删除用户 {user_id}"


# 管理员调用：完整走完两层校验
print("=== 管理员调用 delete_user ===")
admin_token = login("管理员老王", "admin")
set_request_user(admin_token)
result = delete_user(2001)
print(result)
# 输出：
# === 管理员调用 delete_user ===
#   [require_role] 管理员老王 具有 admin 角色，放行 delete_user
#   [login_required] 已登录用户：管理员老王，放行 delete_user
#     [业务] 正在删除用户 2001
# 已删除用户 2001

print()

# 普通用户调用：角色校验就挡住
print("=== 普通用户调用 delete_user ===")
user_token = login("普通用户小李", "user")
set_request_user(user_token)
try:
    delete_user(2002)
except PermissionDeniedError as e:
    print(f"被拒绝：{e}")
# 输出：
# === 普通用户调用 delete_user ===
# 被拒绝：访问 delete_user 需要 admin 角色，当前用户 普通用户小李 是 user

print()

# 未登录调用：require_role 的防御性检查挡住（因为它在最外层先执行）
print("=== 未登录调用 delete_user ===")
clear_request_user()
try:
    delete_user(2003)
except AuthenticationError as e:
    print(f"被拒绝：{e}")
# 输出：
# === 未登录调用 delete_user ===
# 被拒绝：访问 delete_user 需要登录

clear_request_user()
```

从管理员调用的输出可以清楚看到洋葱模型的执行顺序：最外层 `require_role` 先打印放行日志，然后进入内层 `login_required` 打印放行日志，最后才到业务函数体打印"正在删除用户"。这印证了"装饰时自下而上、调用时自上而下"的规则。

而普通用户和未登录的两种拒绝场景，分别被角色校验和登录校验挡住，原函数体都没有执行——这正是装饰器"调用前拦截"的价值。

### 2.5 用 functools.wraps 保留视图函数信息

前面所有装饰器内层都加了 `@functools.wraps(func)`，这一节专门讲清楚为什么在权限校验场景里这很重要。

**不加 wraps 会怎样**

如果不加 `@functools.wraps`，被装饰后的函数的 `__name__` 和 `__doc__` 都会变成 `wrapper`：

```python
def bad_login_required(func):
    def wrapper(*args, **kwargs):
        if get_current_user() is None:
            raise AuthenticationError("未登录")
        return func(*args, **kwargs)
    return wrapper  # 没有 @functools.wraps


@bad_login_required
def view_settings():
    """查看设置页。"""
    return "设置页"

print(view_settings.__name__)   # 输出：wrapper
print(view_settings.__doc__)    # 输出：None
```

`view_settings.__name__` 变成了 `wrapper`，原函数名丢失了。

**在权限校验场景的影响**

权限校验装饰器通常用在 Web 视图函数上。框架做路由注册、错误日志、性能监控时，往往依赖函数名定位是哪个接口。如果所有被装饰的视图函数 `__name__` 都叫 `wrapper`，日志里就分不清是哪个接口报错。异常映射层把异常转成 HTTP 响应时，也希望在响应里带上真实的函数名，方便前端定位。

加上 `@functools.wraps` 后：

```python
@functools.wraps(func)
def wrapper(*args, **kwargs):
    ...
```

`functools.wraps` 会把 `func` 的 `__name__`、`__doc__`、`__module__`、`__qualname__` 以及 `__dict__` 里的属性复制到 `wrapper` 上，让 `wrapper` "看起来"就是原函数。验证：

```python
# 使用前面带 wraps 的 login_required
@login_required
def view_settings():
    """查看设置页。"""
    return "设置页"

print(view_settings.__name__)   # 输出：view_settings
print(view_settings.__doc__)    # 输出：查看设置页。
print(view_settings.__wrapped__)  # 输出：<function view_settings at 0x...>
```

`__name__` 和 `__doc__` 都保留下来了，而且 `functools.wraps` 还额外设置了 `__wrapped__` 属性，指向未被装饰的原函数，需要时可以通过 `view_settings.__wrapped__` 拿到原始函数对象。多层装饰器叠加时，`functools.wraps` 在每一层都会正确传递元信息，不会因为套了两层就丢失。

### 2.6 校验异常映射到 HTTP 状态码

到目前为止，校验失败都是抛异常。但在真实 Web 服务里，最终要返回的是带 HTTP 状态码的响应——401 表示未认证，403 表示无权限。这就需要一个"异常映射层"，把 `AuthenticationError` 映射成 401，把 `PermissionDeniedError` 映射成 403。

**思路**

设计一个统一的异常处理装饰器 `http_response`，它捕获权限相关的异常，转成 `(status_code, message)` 元组返回。这样视图函数本身只管业务逻辑，鉴权和异常处理各司其职。真实框架里这一步由框架的异常处理中间件完成（Flask 的 `errorhandler`、FastAPI 的 `exception_handler`），这里用装饰器模拟。

**实现**

```python
def to_http_response(func):
    """异常映射装饰器：把权限异常转成 (status_code, message) 元组。"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AuthenticationError as e:
            # 未认证：HTTP 401
            return (401, str(e))
        except PermissionDeniedError as e:
            # 无权限：HTTP 403
            return (403, str(e))

    return wrapper
```

这个装饰器可以套在最外层，把内层抛出的权限异常统一捕获成 HTTP 响应：

```python
@to_http_response
@login_required
@require_role("admin")
def shutdown_server():
    """关闭服务器，需要管理员登录。"""
    return "服务器已关闭"


# 管理员调用
print("=== 管理员调用 shutdown_server ===")
admin_token = login("管理员老王", "admin")
set_request_user(admin_token)
print(shutdown_server())
# 输出：
# === 管理员调用 shutdown_server ===
#   [login_required] 已登录用户：管理员老王，放行 shutdown_server
#   [require_role] 管理员老王 具有 admin 角色，放行 shutdown_server
# 服务器已关闭

print()

# 普通用户调用 → 403
print("=== 普通用户调用 shutdown_server ===")
user_token = login("普通用户小李", "user")
set_request_user(user_token)
print(shutdown_server())
# 输出：
# === 普通用户调用 shutdown_server ===
# (403, '访问 shutdown_server 需要 admin 角色，当前用户 普通用户小李 是 user')

print()

# 未登录调用 → 401
print("=== 未登录调用 shutdown_server ===")
clear_request_user()
print(shutdown_server())
# 输出：
# === 未登录调用 shutdown_server ===
# (401, '访问 shutdown_server 需要登录，但当前未登录')

clear_request_user()
```

注意这里的装饰顺序：`@to_http_response` 在最外层，`@login_required` 和 `@require_role` 在内层。调用时先进入 `to_http_response` 的 `wrapper`，它用 `try` 包住整个调用过程；内层的登录校验和角色校验如果抛异常，都会被这个 `try` 捕获并转成状态码元组。如果校验全通过、业务函数正常返回，`to_http_response` 就原样返回业务结果。这就是洋葱模型在"异常映射"上的应用——最外层兜底处理所有内层抛出的异常。

**状态码对照**

| 异常 | HTTP 状态码 | 含义 |
|------|-------------|------|
| `AuthenticationError` | 401 Unauthorized | 未登录，需要先认证 |
| `PermissionDeniedError` | 403 Forbidden | 已登录但权限不足 |
| 业务正常返回 | 200 OK | 校验通过，返回业务结果 |

区分 401 和 403 是有意义的：401 告诉前端"该让用户登录了"，403 告诉前端"用户登录了但没权限，别 retry 了"。前端可以根据不同状态码做不同处理——401 跳登录页，403 显示"无权限"提示。

### 2.7 装饰器校验 vs 函数体手写 if 校验

理解装饰器校验的价值，最好的方式是和"在函数体里手写 if 校验"做个对比。看同一个需求两种写法的差异。

**手写 if 校验（命令式）**

```python
def delete_user_handwritten(user_id):
    user = get_current_user()
    if user is None:
        return (401, "未登录")
    if user["role"] != "admin":
        return (403, "需要 admin 角色")
    # 下面才是业务逻辑
    return f"已删除用户 {user_id}"


def delete_post_handwritten(post_id):
    user = get_current_user()
    if user is None:
        return (401, "未登录")
    if user["role"] != "admin":
        return (403, "需要 admin 角色")
    return f"已删除文章 {post_id}"


def view_dashboard_handwritten():
    user = get_current_user()
    if user is None:
        return (401, "未登录")
    return "仪表盘"
```

每个函数都要重复写那几行校验代码。新增十个需要管理员权限的接口，这十行校验代码就要复制十遍。哪天校验逻辑要改（比如加一项"账号是否被封禁"），得逐个函数改过去，漏改一个就是安全漏洞。

**装饰器校验（声明式）**

```python
@to_http_response
@login_required
@require_role("admin")
def delete_user(user_id):
    return f"已删除用户 {user_id}"


@to_http_response
@login_required
@require_role("admin")
def delete_post(post_id):
    return f"已删除文章 {post_id}"


@to_http_response
@login_required
def view_dashboard():
    return "仪表盘"
```

每个函数定义一眼就能看出需要什么权限——看装饰器就知道。业务函数体里只有业务逻辑，干干净净。校验逻辑集中在装饰器里，改一处所有用到它的接口都受益。

**对比总结**

| 维度 | 手写 if 校验 | 装饰器校验 |
|------|-------------|-----------|
| 代码重复 | 每个函数重复写校验代码 | 校验逻辑只写一次，到处复用 |
| 可读性 | 校验和业务混在一起，要往下读才知道在干嘛 | 看装饰器就懂权限要求，业务体纯粹 |
| 可维护性 | 改校验逻辑要逐函数改，易漏 | 改装饰器一处，全部生效 |
| 关注点分离 | 鉴权逻辑和业务逻辑耦合 | 鉴权与业务彻底分离 |
| 灵活性 | 加新校验规则要侵入每个函数 | 新增装饰器即可叠加 |

装饰器的优势本质是"声明式优于命令式"：你声明这个函数需要什么权限（挂装饰器），而不是手动描述怎么检查权限（写 if）。这和 Python 里 `@property`、`@dataclass` 等装饰器的价值一脉相承——把样板代码抽成可复用的声明。

### 2.8 与 FastAPI / Flask 真实框架的对比呼应

本篇的模拟上下文虽然简化，但和真实框架的鉴权思路是相通的。简单对照一下，方便把本篇学到的知识迁移到真实项目。

**Flask 的做法**

Flask 用 `@login_required` 装饰器配合 `flask-login` 库实现登录校验，思路和本篇几乎一样：`flask-login` 提供 `current_user` 代理对象表示当前用户，`@login_required` 检查它是否活跃，不活跃就重定向到登录页。角色校验通常自己写装饰器，结构也和本篇的 `require_role` 一样。

```python
# Flask 风格（伪代码，不能直接运行）
from flask import Flask
from flask_login import login_required, current_user

app = Flask(__name__)

@app.route("/profile")
@login_required
def profile():
    return f"你好，{current_user.name}"
```

Flask 还提供 `@app.before_request` 注册请求前处理的钩子，可以做全局鉴权——但粒度控制不如装饰器灵活，装饰器可以精确到每个视图函数挂不同的权限要求。

**FastAPI 的做法**

FastAPI 用依赖注入（`Depends`）实现鉴权，思路略有不同但本质相同。`Depends` 把"获取当前用户"抽成一个可复用的依赖函数，视图函数声明依赖即可，FastAPI 在调用视图前自动解析依赖、执行校验。

```python
# FastAPI 风格（伪代码，不能直接运行）
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="未登录")
    return user

def require_role(role):
    def checker(user = Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(status_code=403, detail="权限不足")
        return user
    return checker

@app.delete("/users/{user_id}")
def delete_user(user_id: int, user = Depends(require_role("admin"))):
    return {"deleted": user_id}
```

FastAPI 用 `Depends` 串起依赖链——`require_role("admin")` 依赖 `get_current_user`，`get_current_user` 依赖 `oauth2_scheme`，执行时按依赖链逐层解析，某层失败就抛 `HTTPException`，框架自动转成对应状态码响应。这和本篇"装饰器叠加 + 异常映射"的思路是等价的：都是"调用前逐层校验、失败即拒绝"，只是 FastAPI 用依赖注入表达，本篇用装饰器表达。

**核心共通点**

无论用装饰器还是依赖注入，权限校验的核心模式都是一样的：

1. 有一个表示"当前用户"的上下文来源（本篇的 `get_current_user`、Flask 的 `current_user`、FastAPI 的 `Depends(get_current_user)`）。
2. 校验逻辑抽成可复用单元（装饰器或依赖函数），视图函数声明式地挂上需要的校验。
3. 校验失败转成标准错误响应（抛异常 + 异常映射）。

理解了本篇的手写实现，再看 Flask-Login、FastAPI 的鉴权文档，就能一眼看穿它们的机制，只是把本篇的"手写装饰器"换成了"框架内置工具"。

## 3. 最佳实践

### 3.1 登录校验放最外层，角色校验放内层

多个权限装饰器叠加时，顺序很重要。推荐把 `@login_required` 放在最外层（最靠近函数定义一侧的上方），角色校验装饰器放在它内侧。原因是语义上"先确认身份、再确认权限"更自然，调用时先过登录关、再过角色关，未登录用户不会走到角色校验那层，避免角色校验里还要重复写"未登录"的防御逻辑。

```python
# 推荐：登录在外，角色在内
@to_http_response
@login_required
@require_role("admin")
def delete_user(user_id):
    ...

# 不推荐：角色在外，登录在内
# 调用时先走角色校验，未登录用户会触发角色校验里的防御性检查，
# 语义混乱，且 require_role 要自己处理未登录情况
@to_http_response
@require_role("admin")
@login_required
def delete_user(user_id):
    ...
```

### 3.2 校验失败统一用异常，不要混用返回值

权限校验失败应该抛异常，而不是在 wrapper 里 `return (401, ...)`。原因有二：第一，业务函数的返回值类型应该由业务决定，权限装饰器不应侵入返回值类型；第二，用异常可以让上层统一拦截处理，而用返回值则每个调用点都要手动判断返回结果是业务结果还是错误响应。

```python
# 推荐：抛异常，交由上层统一映射
@functools.wraps(func)
def wrapper(*args, **kwargs):
    if get_current_user() is None:
        raise AuthenticationError("未登录")
    return func(*args, **kwargs)

# 不推荐：直接返回错误响应，侵入返回值类型
@functools.wraps(func)
def wrapper(*args, **kwargs):
    if get_current_user() is None:
        return {"error": "未登录", "code": 401}  # 与业务返回值类型冲突
    return func(*args, **kwargs)
```

### 3.3 异常类要区分清楚，对应不同状态码

设计权限异常时，至少区分"未认证"（401）和"无权限"（403）两种。前者是"你是谁都不知道"，后者是"知道你是谁但你不能做这事"。混用一种异常会让前端无法区分该跳登录页还是显示无权限提示。

```python
# 推荐：两类异常，分别对应 401 和 403
class AuthenticationError(Exception):
    """401：未登录"""

class PermissionDeniedError(Exception):
    """403：已登录但无权限"""

# 不推荐：一类异常打天下，前端分不清该做什么
class AuthError(Exception):
    """所有权限问题都抛这个"""
```

### 3.4 装饰器要加 functools.wraps

所有权限装饰器的 wrapper 都必须加 `@functools.wraps(func)`。在 Web 场景里，路由注册、日志记录、错误定位都依赖函数名。漏加 wraps 会导致所有被装饰的视图函数在日志里都叫 `wrapper`，排查问题时分不清是哪个接口。这点在前面 2.5 节已经演示过，这里再强调一次因为它太容易漏。

### 3.5 校验逻辑要保持无副作用

权限装饰器的 wrapper 里只做"校验"和"放行调用原函数"，不要在里面修改全局状态、写数据库、做重 IO。原因有二：一是装饰器在每个请求都执行，重逻辑会拖慢所有接口；二是校验逻辑应该幂等，带副作用的校验会引入难以排查的时序问题。如果确实需要在校验时做 IO（比如查数据库确认用户没被封禁），应该把那部分抽成独立的服务函数，并考虑缓存。

### 3.6 角色校验支持多角色用 *args 收集

需求上"一个接口允许多种角色"很常见，用 `*roles` 收集角色名比让调用方手动拼列表更自然。前面 2.3 节的 `require_role_any` 已经展示了这种写法。更进一步，如果角色之间有层级（admin 包含 editor 权限），可以在装饰器里做层级判断而不是简单相等比较。

## 4. 原理

### 4.1 装饰顺序与调用顺序的反向关系

多装饰器叠加时，"写法上的装饰顺序"和"执行时的调用顺序"是反向的。这是理解权限校验链的根基。

以 `@login_required` 叠 `@require_role("admin")` 为例，写法如下：

```python
@login_required
@require_role("admin")
def delete_user(user_id):
    ...
```

Python 解析这段代码时，等价于执行：

```python
delete_user = login_required(require_role("admin")(delete_user))
```

也就是先执行最靠近函数的 `require_role("admin")`，把原函数包成 wrapper1；再执行外面的 `login_required`，把 wrapper1 包成 wrapper2。最终 `delete_user` 绑定的是 wrapper2。

调用 `delete_user(x)` 时，执行的是 wrapper2（`login_required` 的 wrapper），它先跑登录校验，通过后调用 wrapper1；wrapper1 是 `require_role` 的 wrapper，它跑角色校验，通过后调用原始函数体。所以调用顺序是"从外到内"：login_required → require_role → 原函数。这就是洋葱模型——装饰时从内向外包，调用时从外向内执行。

权限校验链利用这个特性：把最基础的身份校验（登录）放最外层，最先执行；把更细粒度的权限校验放内层，后执行。这样未登录用户在最外层就被挡住，不会走到内层的角色校验，每一层只需要做自己职责内的检查，不用重复处理上游层已经处理过的情况。

### 4.2 带参装饰器三层结构在此场景的体现

`require_role` 是带参装饰器，它的三层结构在权限校验场景里有具体含义。

```python
def require_role(role):          # 第一层：接收参数（装饰阶段执行）
    def decorator(func):          # 第二层：接收函数（装饰阶段执行）
        @functools.wraps(func)
        def wrapper(*args, **kwargs):  # 第三层：执行校验（调用阶段执行）
            user = get_current_user()
            if user["role"] != role:
                raise PermissionDeniedError(...)
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

第一层 `require_role(role)` 在装饰阶段执行，作用是接收权限参数 `role` 并固定下来。这一层执行完返回的是 `decorator`，一个"等待接收函数"的装饰器。

第二层 `decorator(func)` 也在装饰阶段执行，作用是接收被装饰函数 `func` 并固定下来。这一层执行完返回的是 `wrapper`，一个"等待被调用"的函数。

第三层 `wrapper(*args, **kwargs)` 在调用阶段才执行，这时它会读取闭包里固定好的 `role` 和 `func`，执行权限校验并决定是否放行。

关键在于：`role` 和 `func` 都是在装饰阶段确定的，但 `wrapper` 使用它们是在调用阶段。这种"先固定、后使用"的能力正是闭包。`wrapper` 闭包了外层 `decorator` 的 `func` 和更外层 `require_role` 的 `role`，走到哪都带着这两个变量。带参装饰器之所以要三层，就是因为参数层和函数接收层是不同时机执行的，需要用嵌套函数把它们"分阶段"固定下来。

对比无参装饰器 `login_required`，它只有两层：外层接收函数，内层执行校验。它没有参数层，因为不需要接收额外配置——登录校验的规则是固定的（"是不是 None"），没有可配置项。带参装饰器多出来的那一层，就是用来接收 `role` 这种配置项的。

### 4.3 current_user 上下文如何被闭包访问

权限装饰器的 wrapper 里要访问 `get_current_user()` 这个函数，但这个函数既不是 wrapper 的参数，也不在 wrapper 的直接外层定义——它在模块顶层定义。wrapper 是怎么访问到它的？

这涉及 Python 的闭包变量查找规则（LEGB）：局部（Local）→ 外层嵌套函数（Enclosing）→ 全局（Global）→ 内置（Built-in）。wrapper 里写 `get_current_user()` 时，Python 先在 wrapper 局部找，没找到；再去 wrapper 的外层嵌套函数（`decorator` 或 `require_role`）找，也没找到；最后去模块全局找，找到了模块顶层的 `get_current_user` 函数。

所以这里的"闭包访问"其实是跨越多层嵌套一路查到全局作用域。真正用闭包固定的是 `func` 和 `role` 这种在装饰阶段确定的变量，而 `get_current_user` 这种运行时才能确定的上下文访问函数，是通过全局作用域查找的——它的具体值在调用时才确定，装饰时并不固定。

这种设计的妙处在于：装饰器不依赖具体的"当前用户"值，只依赖"如何获取当前用户"的函数。测试时可以替换 `get_current_user` 的实现来模拟不同用户，装饰器代码一行不用改。这和依赖注入的精神一致——装饰器把"如何拿当前用户"这个依赖通过函数查找延迟到调用时解析，而不是在装饰时硬编码。

如果把 `get_current_user` 改成闭包变量（比如让装饰器接收一个 `get_user` 参数），就能实现更灵活的依赖注入：

```python
def login_required_injectable(get_user):
    """可注入 get_user 函数的登录校验装饰器，便于测试替换。"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            user = get_user()
            if user is None:
                raise AuthenticationError("未登录")
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

这里 `get_user` 成了闭包变量而非全局查找，调用方可以传入不同的 `get_user` 实现（生产环境查真数据库，测试环境返回 Mock 用户）。这就是把"全局查找"升级为"闭包传入"，让装饰器的依赖更显式、更可测试。

### 4.4 声明式校验优于命令式的机制视角

为什么装饰器写出的权限校验是"声明式"的，而手写 if 是"命令式"的？从机制角度看，区别在于"校验逻辑在哪一层绑定"。

手写 if 校验里，校验逻辑写在函数体内部，和业务逻辑平级。执行时解释器顺序执行：先跑校验 if，再跑业务。校验和业务在同一个作用域、同一次函数调用里，你看到的是"指令序列"。

装饰器校验里，校验逻辑写在 wrapper 里，wrapper 把原函数"包"起来。执行时先跑 wrapper 的校验，通过后才调到原函数。校验和业务在不同层——wrapper 层负责校验，原函数层负责业务，两层通过"调用"衔接。你看到的是"分层组合"。

声明式的本质是：你描述"这个函数需要什么"（挂 `@require_role("admin")`），而不是描述"怎么检查这个函数需要的条件"（写 if role != admin）。装饰器机制让"描述需求"和"实现检查"解耦——描述需求只需要在函数头上挂一行，实现检查集中在装饰器定义里。这正是声明式编程的核心：把"是什么"和"怎么做"分开。

机制上，这依赖 Python 函数是一等公民和闭包两点：函数可以作为参数传递（让装饰器能接收被装饰函数）、可以嵌套定义并被返回（让 wrapper 能闭包外层变量）。没有这两点，装饰器模式无从谈起。所以权限校验装饰器本质是"用一等函数 + 闭包模拟出声明式语法"——@ 语法糖把这个模式包装成一行声明式的标注。

## 5. 总结

### 5.1 本文内容要点

- 权限校验装饰器把"调用前校验登录与角色"的逻辑抽成可复用装饰器，让视图函数只关心业务，鉴权声明式地挂在函数头上。
- `@login_required` 是无参装饰器，从上下文取当前用户，为空就抛 `AuthenticationError`（对应 401）。
- `@require_role("admin")` 是带参装饰器，三层结构：参数层接收角色、函数层接收被装饰函数、wrapper 层执行校验，角色不匹配抛 `PermissionDeniedError`（对应 403）。
- 用模块级变量模拟 `current_user` 与 session 上下文，装饰器通过闭包/全局查找访问当前用户。
- 多装饰器叠加遵循洋葱模型：装饰时自下而上、调用时自上而下，推荐把 `@login_required` 放最外层先确认身份。
- `@functools.wraps` 保留原函数名和文档，在 Web 视图场景对路由、日志、错误定位至关重要。
- 异常映射装饰器把权限异常统一转成 `(status_code, message)`，区分 401 与 403 让前端能做不同处理。
- 装饰器校验相比手写 if 校验，在代码重复、可读性、可维护性、关注点分离上全面占优。
- 与 Flask-Login、FastAPI Depends 的鉴权思路相通：都有"当前用户来源 + 可复用校验单元 + 失败转标准响应"三要素。

### 5.2 读完应能掌握

- 能从零手写 `@login_required` 和 `@require_role` 两个权限装饰器，包括异常设计、`functools.wraps` 使用、参数透传。
- 能解释带参装饰器三层结构每一层的执行时机和职责，能把"装饰阶段固定参数、调用阶段使用参数"的闭包机制说清楚。
- 能正确叠加多个权限装饰器并说清装饰顺序与调用顺序的反向关系，能画出洋葱模型的执行流程。
- 能设计异常映射层把权限异常转成 HTTP 状态码响应，并区分 401 与 403 的语义。
- 能对比装饰器校验与手写 if 校验的优劣，从机制层面解释为什么装饰器是声明式的。
- 能把本篇的手写实现迁移到理解 Flask / FastAPI 的真实鉴权机制，看懂框架文档里 `Depends`、`before_request` 等工具的设计意图。