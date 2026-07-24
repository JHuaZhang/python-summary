---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 1
title: requests 基础请求
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 requests 库

`requests` 是 Python 中最流行的第三方 HTTP 客户端库，由 Kenneth Reitz 开发，其官方标语是 "HTTP for Humans"——为人类而设计的 HTTP 库。它封装了 Python 标准库 `urllib` 之下更底层的网络通信细节，把繁琐的 HTTP 协议操作变成几行直白的函数调用。

在 Web 开发、爬虫、自动化测试、微服务调用、对接第三方 API 等场景中，只要你的 Python 程序需要"和另一台服务器通过 HTTP 通信"，第一个被想到的就是 `requests`。它不是标准库，需要通过 `pip install requests` 安装，但几乎是 Python 生态里事实上的"准标准库"。

`requests` 解决的核心问题是：**让 HTTP 请求的发送与响应的处理变得直观、简洁、可读**。对比标准库 `urllib` 需要手拼 URL、手设请求头、手处理编码、手解析 JSON 的繁琐写法，`requests` 把这些步骤都收敛进了几个语义清晰的方法和一个 `Response` 对象里。

本篇是网络请求系列的开篇，目标是建立 **GET/POST + Response 基本模型**：学会用七个 HTTP 动词方法发送请求，学会从 `Response` 对象上读取状态码、文本、字节、JSON、响应头等全部信息。后续篇章会再分解请求头参数、响应进阶处理、超时与代理、Session 会话保持等更深入的话题。

### 1.2 安装与基本使用

`requests` 是第三方库，先用 pip 安装：

```python
# 终端执行，不是 Python 代码
# pip install requests
```

安装完成后，验证是否可用：

```python
import requests

# 打印版本号，确认安装成功
print(requests.__version__)
# 输出：2.32.3（具体版本号视安装时的版本而定）
```

`requests` 的顶层直接暴露了七个最常用的 HTTP 动词函数：`get`、`post`、`put`、`delete`、`patch`、`head`、`options`，以及它们的底层统一入口 `request`。日常使用绝大多数场景只用 `get` 和 `post` 两个，其余动词在对接 RESTful API 时按需使用。

### 1.3 最小示例：第一个 GET 请求

先看一个最简单的请求，建立直观印象。下面的例子向公开的测试服务 `httpbin.org` 发一个 GET 请求并打印响应：

```python
import requests

# 向 httpbin.org 的 /get 端点发 GET 请求（需联网）
# 该端点会把请求的来源信息原样返回，常用于测试
response = requests.get("https://httpbin.org/get")

# 读取响应
print(response.status_code)  # HTTP 状态码
print(response.text)         # 响应体文本
# 输出：
# 200
# {
#   "args": {},
#   "headers": { ... },
#   "origin": "your.public.ip",
#   "url": "https://httpbin.org/get"
# }
```

这就是 `requests` 最常见的工作模式：**调用一个动词函数拿到 `Response` 对象，再从这个对象上读取你要的数据**。没有连接管理、没有编码转换、没有 JSON 手动解析——这些都被封装在背后。后续章节会逐一展开每个动词方法与每个 `Response` 属性的细节。

---

## 2. 核心内容

### 2.1 七个 HTTP 动词方法概览

HTTP 协议定义了一组"请求方法"（也叫动词 verb），用来表达"客户端想对服务器上的某个资源做什么"。`requests` 为每一个常用动词都提供了一个顶层函数，函数名与 HTTP 方法同名（小写）。

| requests 方法 | HTTP 动词 | 语义 | 典型场景 |
| --- | --- | --- | --- |
| `requests.get` | GET | 获取资源，不应有副作用 | 读取网页、查询数据、拉取 API 结果 |
| `requests.post` | POST | 提交数据，可能创建资源 | 提交表单、上传数据、创建记录 |
| `requests.put` | PUT | 用请求体替换目标资源 | 整体更新一条记录 |
| `requests.patch` | PATCH | 对资源做部分修改 | 只改某个字段 |
| `requests.delete` | DELETE | 删除目标资源 | 删除一条记录 |
| `requests.head` | HEAD | 只要响应头，不要响应体 | 探测资源是否存在、看大小 |
| `requests.options` | OPTIONS | 查询服务器支持的方法 | CORS 预检、探测 API 能力 |

这七个函数的签名模式高度一致，核心参数几乎相同，区别主要体现在：请求方法不同、是否带请求体不同（GET/HEAD/OPTIONS 一般不带体，POST/PUT/PATCH 带）、服务器对方法的处理语义不同。掌握了其中一个，其余可以举一反三。

它们的底层统一调用入口是 `requests.request(method, url, **kwargs)`，七个便捷函数本质上都是对这个入口的薄封装，例如 `requests.get(url)` 等价于 `requests.request("GET", url)`。理解这一点有助于后面看原理章。

**七个方法的统一签名**

```python
requests.<verb>(url, params=None, *, data=None, json=None,
                headers=None, cookies=None, files=None,
                auth=None, timeout=None, allow_redirects=True,
                proxies=None, verify=None, stream=None, cert=None)
```

本篇重点讲 `get` 和 `post`，其余动词会给出用法示例但会说明它们与 get/post 的差异点。请求头、超时、代理、Session 等参数属于后续篇章的主题，本篇不展开。

### 2.2 requests.get 详解

`requests.get` 是使用频率最高的一个方法，用于向指定 URL 发送 GET 请求。GET 的语义是"获取资源"——服务器收到 GET 请求后应返回资源内容，且不应改变服务器状态（幂等、无副作用）。

**签名**

```python
requests.get(url, params=None, **kwargs)
```

- `url`：目标地址，字符串。这是唯一的必填参数。
- `params`：查询字符串参数。可以是字典、列表的列表（每一项是 `(key, value)` 对），也可以是字节串。`requests` 会自动把它拼接到 URL 后面，并对特殊字符做 URL 编码。

**最简 GET**

```python
import requests

response = requests.get("https://httpbin.org/get")
print(response.status_code)
# 输出：200
```

**带查询参数的 GET**

很多 API 会通过 URL 查询字符串传参，例如 `https://api.example.com/search?q=python&page=1`。你可以手动拼好这个 URL 传给 `get`，但更推荐的做法是用 `params` 参数让 `requests` 帮你拼：

```python
import requests

# 用 params 传查询参数，避免手动拼 URL
params = {
    "q": "python requests",
    "page": 1,
    "pagesize": 20,
}

response = requests.get("https://httpbin.org/get", params=params)

# httpbin 的 /get 会把你传的参数回显在 args 字段里
print(response.url)  # 查看最终拼出的 URL
# 输出：https://httpbin.org/get?q=python+requests&page=1&pagesize=20

import json
data = response.json()
print(data["args"])
# 输出：{'q': 'python requests', 'page': '1', 'pagesize': '20'}
```

注意几个细节：

- `requests` 会自动把空格编码成 `+`（这是 application/x-www-form-urlencoded 的规则），不会让 URL 非法。
- 查询参数的值最终都变成了字符串。你传的 `1`（整数）会被转成 `"1"`，回显时也是字符串。这是 HTTP 协议本身决定的——URL 里的内容都是文本。
- 如果某个参数的值是 `None`，`requests` 会自动跳过这个参数，不会拼进 URL。

**params 支持多种形式**

```python
import requests

# 形式一：字典（最常用）
requests.get("https://httpbin.org/get", params={"a": 1, "b": 2})

# 形式二：元组列表（同一 key 多个值时用）
requests.get("https://httpbin.org/get", params=[("a", 1), ("a", 2), ("b", 3)])
# 最终 URL：.../get?a=1&a=2&b=3

# 形式三：值中带特殊字符，自动编码
requests.get("https://httpbin.org/get", params={"name": "张三 & 李四"})
# 最终 URL：.../get?name=%E5%BC%A0%E4%B8%89+%26+%E6%9D%8E%E5%9B%9B
```

**GET 请求不应该带请求体**

虽然技术上可以给 GET 传 `data` 参数，但 HTTP 规范不鼓励 GET 携带请求体，很多服务器和代理会直接丢弃或拒绝。凡是需要提交数据的场景，应该用 POST 等带请求体的方法。GET 把所有参数放在 URL 查询串里，这就决定了 GET 不适合传大体积或敏感数据（URL 可能被日志、浏览器历史、代理缓存记录）。

### 2.3 requests.post 详解

`requests.post` 用于发送 POST 请求，语义是"提交数据给服务器处理"。POST 是非幂等的——同样的请求发两次，可能在服务器上创建两条记录。表单提交、文件上传、创建资源、登录认证都常用 POST。

**签名**

```python
requests.post(url, data=None, json=None, **kwargs)
```

- `url`：目标地址。
- `data`：请求体数据。可以是字典（会以表单形式发送）、字节串、字符串、文件对象。
- `json`：直接传一个 Python 对象，`requests` 会自动序列化成 JSON 并设置 `Content-Type: application/json`。

最常被混淆的两个参数就是 `data` 和 `json`，它们的区别如下：

| 参数 | 发送格式 | Content-Type | 适用场景 |
| --- | --- | --- | --- |
| `data={...}` | application/x-www-form-urlencoded 表单 | application/x-www-form-urlencoded | 传统 HTML 表单提交 |
| `json={...}` | JSON 字符串 | application/json | 现代 RESTful API |
| `data=b"..."` | 原始字节 | （需手动设或默认） | 自定义格式请求体 |

**提交表单（data）**

```python
import requests

# 模拟用户注册表单提交：用户名、邮箱、密码
form_data = {
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "password": "secret123",
}

response = requests.post("https://httpbin.org/post", data=form_data)

# httpbin 的 /post 端点会把你提交的表单回显在 form 字段里
import json
result = response.json()
print(result["form"])
# 输出：{'username': 'zhangsan', 'email': 'zhangsan@example.com', 'password': 'secret123'}
```

这里 `requests` 在背后做了三件事：把字典编码成 `username=zhangsan&email=...&password=secret123` 这样的查询串格式，放进请求体，并自动设置请求头 `Content-Type: application/x-www-form-urlencoded`。这正是浏览器传统表单默认的提交方式。

**提交 JSON（json 参数）**

现在越来越多的 API 要求用 JSON 格式提交数据，这时用 `json` 参数最方便：

```python
import requests

# 假设向一个 API 创建一条用户记录
payload = {
    "username": "lisi",
    "email": "lisi@example.com",
    "age": 28,
    "tags": ["python", "backend"],
}

response = requests.post("https://httpbin.org/post", json=payload)

result = response.json()
# httpbin 把请求体原样存在 data 字段里
print(result["data"])
# 输出：{"username": "lisi", "email": "lisi@example.com", "age": 28, "tags": ["python", "backend"]}

# httpbin 还会把请求头放在 headers 字段里，查看 Content-Type
print(result["headers"]["Content-Type"])
# 输出：application/json
```

使用 `json` 参数时，`requests` 背后调用 `json.dumps()` 把对象序列化成 JSON 字符串作为请求体，同时设置 `Content-Type: application/json`。这两步是自动的，你不用自己 `import json` 再手动序列化。

**发送原始字节**

有时候请求体既不是表单也不是 JSON，而是一段二进制或自定义文本（例如调用某个 RPC 服务、上传 XML）。这时直接传字节串给 `data`：

```python
import requests

# 发送一段原始 XML（某些旧式 SOAP/REST 接口需要）
xml_body = b"""<?xml version="1.0"?>
<request>
    <action>query</action>
    <keyword>python</keyword>
</request>"""

# 配合 headers 指明内容类型
headers = {"Content-Type": "application/xml"}
response = requests.post("https://httpbin.org/post", data=xml_body, headers=headers)

print(response.json()["data"])
# 输出：<?xml version="1.0"?>
# <request>
#     <action>query</action>
#     <keyword>python</keyword>
# </request>
```

**POST 与 GET 对比要点**

- POST 把数据放在请求体里，不会出现在 URL 上，相对更适合传敏感数据和大数据。
- POST 的请求体由 `Content-Type` 头说明格式，`requests` 会根据你用的是 `data` 还是 `json` 自动设置这个头。
- 同样的表单提交两次会创建两条记录（非幂等），这点和 GET 的"发多少次结果一样"形成对比。

### 2.4 requests.put / patch / delete / head / options

这一组方法的共同点是：在 RESTful API 中表达对资源的增删改查语义，实际写法和 get/post 高度一致。

**requests.put**

PUT 的语义是"用请求体替换整个目标资源"。也就是客户端提供资源的完整新版本，服务器用它覆盖旧的。典型场景是整体更新一条记录。

```python
import requests

# 用 PUT 更新 id=42 的文章：传完整的新内容
new_article = {
    "title": "requests 入门",
    "body": "本篇讲基础请求……",
    "author": "zhangsan",
    "tags": ["python", "http"],
}

response = requests.put("https://httpbin.org/put", json=new_article)
print(response.status_code)
# 输出：200
```

PUT 与 POST 的写法几乎一样，区别在语义：PUT 强调"用这份数据替换那个资源"，是幂等的（同样的 PUT 发多次，最终状态一致）；POST 强调"提交这份数据让服务器处理"，不保证幂等。

**requests.patch**

PATCH 的语义是"对资源做部分修改"——只传需要改的字段，服务器合并更新。这和 PUT 的"整体替换"不同。

```python
import requests

# 只改文章的 title，其它字段不动
patch_data = {"title": "requests 基础请求（修订版）"}

response = requests.patch("https://httpbin.org/patch", json=patch_data)
print(response.status_code)
# 输出：200
```

实际项目里，"整体更新用 PUT、部分更新用 PATCH" 是 RESTful API 的常见约定，但并非所有服务都严格区分，有些接口把两者都用来做更新。具体语义以接口文档为准。

**requests.delete**

DELETE 用于请求服务器删除指定资源。

```python
import requests

# 删除 id=42 的文章
response = requests.delete("https://httpbin.org/delete")
print(response.status_code)
# 输出：200
```

DELETE 通常不需要请求体（资源的位置已经由 URL 表达），但有的接口会把"删除原因"放在请求体或查询参数里，这视具体 API 而定。

**requests.head**

HEAD 与 GET 几乎一样，差别只有一个：服务器只返回响应头，不返回响应体。常用于：

- 探测一个资源是否存在（看状态码 200 / 404）。
- 看资源大小（`Content-Length` 头）。
- 看资源最近是否更新过（`Last-Modified` / `ETag` 头）。

```python
import requests

response = requests.head("https://httpbin.org/get")
print(response.status_code)
print(response.headers.get("Content-Type"))
print(len(response.content))  # 响应体应为空
# 输出：
# 200
# application/json
# 0
```

注意：因为 HEAD 没有响应体，`response.text` 和 `response.content` 都会是空的，不要指望从 HEAD 响应里读到正文数据。

**requests.options**

OPTIONS 用于查询服务器针对某个资源支持哪些 HTTP 方法，常在 CORS（跨域资源共享）预检请求里使用。

```python
import requests

response = requests.options("https://httpbin.org/get")
# Allow 头列出该资源允许的方法
print(response.headers.get("Allow"))
# 输出（视服务器而定）：GET, POST, HEAD, OPTIONS
```

日常业务代码里，`options` 用得最少，多数开发者几乎不会主动调它。它是给浏览器跨域预检和 API 能力探测用的。

### 2.5 响应对象 Response：全部属性

调用任意一个动词函数后拿到的对象都是 `Response` 的实例。`Response` 把一次 HTTP 响应的全部信息——状态行、响应头、响应体、以及一些请求侧的回溯信息——封装在了一起。本节按"最常用 → 偶尔用"的顺序逐一讲解。

**status_code：HTTP 状态码**

```python
import requests

response = requests.get("https://httpbin.org/status/200")
print(response.status_code)
# 输出：200

response = requests.get("https://httpbin.org/status/404")
print(response.status_code)
# 输出：404
```

`status_code` 是一个整数，就是 HTTP 响应状态行里的三位数字。常见状态码的语义：

| 状态码 | 类别 | 含义 |
| --- | --- | --- |
| 200 | 2xx 成功 | 请求被正常处理完成 |
| 201 | 2xx 成功 | 资源创建成功（POST 常见） |
| 204 | 2xx 成功 | 成功但无响应体（DELETE 常见） |
| 301 / 302 | 3xx 重定向 | 资源换了地址，需跳转 |
| 304 | 3xx 重定向 | 缓存仍有效，不用重新下载 |
| 400 | 4xx 客户端错误 | 请求格式有问题 |
| 401 | 4xx 客户端错误 | 未认证，需要登录 |
| 403 | 4xx 客户端错误 | 已认证但无权限 |
| 404 | 4xx 客户端错误 | 资源不存在 |
| 429 | 4xx 客户端错误 | 请求太频繁，被限流 |
| 500 | 5xx 服务器错误 | 服务器内部出错 |
| 502 / 503 | 5xx 服务器错误 | 网关错误 / 服务不可用 |

`requests` 收到 4xx / 5xx 时不会自动抛异常（这点和一些 HTTP 库不同），它会把状态码原样交给你。你需要自己判断或调用 `raise_for_status()`。

**ok：是否为成功响应**

```python
import requests

response = requests.get("https://httpbin.org/status/500")
print(response.status_code, response.ok)
# 输出：500 False

response = requests.get("https://httpbin.org/status/200")
print(response.status_code, response.ok)
# 输出：200 True
```

`ok` 是一个布尔属性，等价于 `status_code < 400`——只要状态码在 200~399 之间就为 `True`，否则 `False`。它是 `if response.ok:` 这种快速判断写法的基础。

**raise_for_status()：非 2xx/3xx 抛异常**

```python
import requests

response = requests.get("https://httpbin.org/status/404")
# if not response.ok: raise ...  这样的判断可以省略
response.raise_for_status()
# 输出（抛出异常）：
# requests.exceptions.HTTPError: 404 Client Error: NOT FOUND for url: https://httpbin.org/status/404
```

`raise_for_status()` 的逻辑是：如果 `status_code` 在 400 到 600 之间，就抛出一个 `HTTPError` 异常；否则什么都不做。它的好处是把"检查状态码 + 抛错"两步合一，让正常路径代码更干净。注意 3xx 默认会被自动跟随重定向，所以正常流程里不会遇到 3xx 状态码。

**text：响应体文本**

```python
import requests

response = requests.get("https://httpbin.org/encoding/utf8")
print(type(response.text))   # 字符串
print(response.text[:60])
# 输出：
# <class 'str'>
# <!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8">\n ...
```

`text` 把响应体作为字符串返回。背后的事情是：`requests` 拿到的是字节流（`content`），它需要决定用什么编码把这些字节解码成字符串。解码依据的规则会在原理章详细讲，简单说就是优先看 HTTP 响应头里的 `Content-Type` 声明的字符集，找不到再尝试自动嗅探，最后兜底用 ISO-8859-1。

**content：响应体字节**

```python
import requests

response = requests.get("https://httpbin.org/encoding/utf8")
print(type(response.content))  # 字节串
print(response.content[:40])
# 输出：
# <class 'bytes'>
# b'<!DOCTYPE html>\n<html>\n  <head>\n    <m'
```

`content` 是响应体的原始字节形式。下载图片、视频、压缩包等二进制内容时必须用 `content`，因为 `text` 的文本解码会破坏二进制数据。`text` 本质就是 `content.decode(response.encoding)` 的结果。

**json()：解析 JSON 响应**

```python
import requests

response = requests.get("https://httpbin.org/json")
data = response.json()
print(type(data))
print(data)
# 输出：
# <class 'dict'>
# {'slideshow': {'author': 'Yours Truly', 'date': 'date of publication',
#   'slides': [{'title': 'Wake up to WonderWidgets!', 'type': 'all'}, ...],
#   'title': 'The Story and the WonderWidgets'}}
```

`json()` 把响应体当作 JSON 文本来解析，返回对应的 Python 对象（字典、列表等）。它内部调用的是标准库 `json.loads(response.content)`（注意是 content 字节，`json.loads` 在新版可以接受字节串）。如果响应体不是合法 JSON，会抛 `json.JSONDecodeError`。`json()` 是调用 RESTful API 时最常用的读取方式。

**headers：响应头**

```python
import requests

response = requests.get("https://httpbin.org/get")
print(type(response.headers))
print(response.headers["Content-Type"])
# 输出：
# <class 'requests.structures.CaseInsensitiveDict'>
# application/json
```

`headers` 是一个大小写不敏感的字典（`CaseInsensitiveDict`），所以 `headers["content-type"]` 和 `headers["Content-Type"]` 都能取到值。HTTP 头字段名本身是大小写不敏感的，这个设计很贴心。

常见响应头含义：

| 响应头 | 含义 |
| --- | --- |
| `Content-Type` | 响应体类型与字符集 |
| `Content-Length` | 响应体字节长度 |
| `Content-Encoding` | 压缩编码（如 gzip） |
| `Set-Cookie` | 服务器设置的 Cookie |
| `Location` | 重定向目标地址 |
| `Server` | 服务器软件信息 |
| `Date` | 服务器响应时间 |

**encoding：解码字符集**

```python
import requests

response = requests.get("https://httpbin.org/get")
print(response.encoding)
# 输出（视响应头而定）：utf-8

# 手动改编码会立即影响 text 的解码结果
response.encoding = "gbk"
print(response.text[:30])  # 此时用 gbk 解码，可能乱码
```

`encoding` 是 `text` 用来解码的字符集名称。通常 `requests` 会自动从 `Content-Type` 头推断，但有些服务器不返回字符集信息，自动推断就可能出错（典型是中文网页被当成 ISO-8859-1 解码出乱码）。遇到乱码时，手动设置 `response.encoding = "utf-8"`（或网页实际编码）就能修正 `text` 的输出。

**url：最终请求的 URL**

```python
import requests

# 经历重定向后的最终 URL
response = requests.get("https://httpbin.org/redirect-to?url=https://httpbin.org/get")
print(response.url)
# 输出：https://httpbin.org/get
```

`url` 是请求最终到达的 URL。如果有重定向，这里显示的是跳转后的最终地址，而不是你最初传进去的那个。带上 `params` 拼出的最终 URL 也在这里能看到。

**cookies：响应中的 Cookie**

```python
import requests

response = requests.get("https://httpbin.org/cookies/set?token=abc123")
print(response.cookies.get("token"))
# 输出：abc123
```

`cookies` 是服务器通过 `Set-Cookie` 头塞过来的 Cookie 集合，表现为一个 `RequestsCookieJar` 对象，可以像字典一样用 `get` 取值。注意：默认情况下跨重定向的 Cookie 会被收集到 `response.cookies`，但下一次新请求不会自动带上——要保持会话需要用 `Session`，那是后续篇章的话题。

**elapsed：响应耗时**

```python
import requests

response = requests.get("https://httpbin.org/get")
print(response.elapsed)
print(response.elapsed.total_seconds())
# 输出：
# 0:00:00.345678
# 0.345678
```

`elapsed` 是一个 `timedelta` 对象，记录从请求发出到收到响应头的时间。注意它只算到响应头到达为止，不含下载响应体的时间。粗略性能摸底时有用。

**request：回溯请求对象**

```python
import requests

response = requests.get("https://httpbin.org/get", params={"q": "python"})
print(response.request.method)
print(response.request.url)
print(response.request.headers.get("User-Agent"))
# 输出：
# GET
# https://httpbin.org/get?q=python
# python-requests/2.32.3
```

`request` 属性指向"这次响应对应的请求"的 `PreparedRequest` 对象，可以回溯看到实际发出的方法、URL、请求头、请求体。调试"为什么服务器返回的结果和我预期不一样"时很有用——先看 `response.request` 确认实际发出去的请求长啥样。

**is_redirect / is_permanent_redirect**

```python
import requests

response = requests.get("https://httpbin.org/redirect-to?url=https://httpbin.org/get")
print(response.is_redirect, response.history)
# 输出：False [<Response [302]>]
```

因为 `requests` 默认会自动跟随重定向，所以最终拿到的 `response` 通常不是重定向响应，`is_redirect` 为 `False`。中间经历的 3xx 响应记录在 `history` 列表里。如果想禁用自动跟随，传 `allow_redirects=False`。

**history：重定向历史**

```python
import requests

response = requests.get("https://httpbin.org/redirect/3")
print(len(response.history))
print([r.status_code for r in response.history])
# 输出：
# 3
# [302, 302, 302]
```

`history` 是被自动跟随的重定向过程中产生的中间 `Response` 列表，按时间顺序排列。没有重定向时是空列表。用来排查"为什么 URL 变了""中间走了几跳"这类问题。

**apparent_encoding：嗅探出的编码**

```python
import requests

response = requests.get("https://httpbin.org/encoding/utf8")
print(response.encoding)          # requests 推断的编码
print(response.apparent_encoding) # 用 chardet 嗅探出的编码
# 输出：
# ISO-8859-1
# utf-8
```

`apparent_encoding` 是 `requests` 用 `chardet`/`charset_normalizer` 库对响应体字节做嗅探后猜出的编码。当响应头没声明字符集、`encoding` 兜底成 ISO-8859-1 导致 `text` 乱码时，可以用 `response.encoding = response.apparent_encoding` 来修正。

### 2.6 URL 构造与参数传递

`requests` 不提供"URL 构建器"类（像 `urllib.parse` 那样的工具），URL 构造靠几个简单规则：

- 基础 URL 直接写字符串。
- 查询参数用 `params` 让 `requests` 拼接并编码。
- 路径参数（如 `/users/42`）直接拼在 URL 字符串里。

**路径参数拼接**

```python
import requests

user_id = 42
# 路径参数直接用 f-string 拼进 URL
url = f"https://api.example.com/users/{user_id}/posts"
response = requests.get(url)
```

RESTful API 经常把资源 ID 放在路径里而不是查询串里，这时只能自己拼字符串。`requests` 本身不提供 `UrlBuilder`，因为它认为简单字符串拼接已经够用——拼接时注意对路径段里的特殊字符做 URL 编码即可。

**用 params 传查询参数**

```python
import requests

# 复杂查询参数
params = {
    "q": "python 网络请求",
    "page": 1,
    "tags": ["web", "api"],   # 列表会展开成 tags=web&tags=api
    "empty": None,            # None 会被自动跳过
}

response = requests.get("https://httpbin.org/get", params=params)
print(response.url)
# 输出：https://httpbin.org/get?q=python+%E7%BD%91%E7%BB%9C%E8%AF%B7%E6%B1%82&page=1&tags=web&tags=api
```

**手动编码路径段**

当路径段里可能含特殊字符（中文、斜杠等）时，应使用 `urllib.parse.quote` 对该段做编码，避免破坏 URL 结构：

```python
import requests
from urllib.parse import quote

# 搜索某个关键词的 repo，关键词含中文
keyword = "网络请求"
url = f"https://api.example.com/search/{quote(keyword)}"
response = requests.get(url)
print(response.url)
# 输出：https://api.example.com/search/%E7%BD%91%E7%BB%9C%E8%AF%B7%E6%B1%82
```

这里 `quote` 把"网络请求"编码成 URL 安全的字符串，避免中文直接进路径可能造成的解析问题。

### 2.7 与 urllib 标准库对比

Python 标准库自带 `urllib.request`，也能发 HTTP 请求，那为什么要用 `requests`？最直观的方式是看同样一件事两边分别怎么写。

**用标准库 urllib 发 GET 请求**

```python
from urllib.request import urlopen
from urllib.parse import urlencode
import json

params = urlencode({"q": "python", "page": 1})
url = f"https://httpbin.org/get?{params}"

with urlopen(url) as resp:
    body = resp.read()                 # bytes
    charset = resp.headers.get_content_charset() or "utf-8"
    text = body.decode(charset)        # 手动解码
    data = json.loads(text)            # 手动解析 JSON

print(data["args"])
```

**用 requests 发同样的 GET 请求**

```python
import requests

response = requests.get("https://httpbin.org/get", params={"q": "python", "page": 1})
data = response.json()
print(data["args"])
```

对比下来，`requests` 的优势集中在这几方面：

- **无需手动编码/拼接 URL**：`params` 自动处理。
- **无需手动解码字节**：`text` 和 `json()` 已经做好。
- **无需 `with` 上下文管理**：`requests` 自己管理连接释放。
- **状态码、响应头访问更直观**：`response.status_code`、`response.headers["Content-Type"]`，而不需要去 `resp.headers` 里翻。
- **POST 提交表单/JSON 极简**：`data=` / `json=` 一行搞定。
- **异常模型更贴近 HTTP**：`raise_for_status()` 直接抛 HTTPError，而 `urlopen` 对 4xx/5xx 直接抛 `HTTPError` 有时反而不便。

**urllib 的 POST 更繁琐**

```python
from urllib.request import urlopen, Request
from urllib.parse import urlencode

data = urlencode({"username": "zhangsan", "password": "secret"}).encode()
req = Request("https://httpbin.org/post", data=data, method="POST")
req.add_header("Content-Type", "application/x-www-form-urlencoded")

with urlopen(req) as resp:
    print(resp.read().decode())
```

同样的需求 `requests` 只需：

```python
import requests
response = requests.post("https://httpbin.org/post", data={"username": "zhangsan", "password": "secret"})
```

这就是 "HTTP for Humans" 的含义——把本该自动化的细节都藏到背后，让代码意图直接对应业务语义。

---

## 3. 最佳实践

### 3.1 始终检查响应状态

`requests` 不会因为 4xx/5xx 自动报错，如果直接读 `text` / `json()` 你可能拿到一段错误页面或错误 JSON 而不自知。养成"拿到 response 先验证状态"的习惯。

**推荐写法**

```python
import requests

response = requests.get("https://httpbin.org/get")
response.raise_for_status()   # 非 2xx/3xx 立即抛错，阻断后续逻辑
data = response.json()        # 能走到这里说明状态正常
```

**不推荐写法**

```python
import requests

response = requests.get("https://httpbin.org/some-bad-url")
data = response.json()   # 如果 404 返回的不是 JSON，这里直接炸
```

### 3.2 选择 text 还是 content

- 看 HTML 网页、JSON 接口、纯文本：用 `text`。
- 下载图片、PDF、视频、字节流：用 `content`。
- 不确定编码导致 `text` 乱码：用 `content` 自己 `decode(response.apparent_encoding)`，或手动设 `response.encoding`。

### 3.3 json() 调用要防异常

`response.json()` 在响应体不是合法 JSON 时会抛 `json.JSONDecodeError`。调用前最好确认状态码和 `Content-Type`，或用 try 兜底。

**推荐写法**

```python
import requests

response = requests.get("https://httpbin.org/json")
response.raise_for_status()

try:
    data = response.json()
except requests.exceptions.JSONDecodeError:
    print("响应不是合法 JSON")
else:
    print(data)
```

### 3.4 永远设置超时

`requests.get(url)` 不带 `timeout` 时，如果服务器不响应，程序会无限期挂住。这在生产环境是灾难。本篇虽然不深入讲超时，但必须强调："没有 timeout 的网络请求都是定时炸弹"。最简单的情况：

```python
import requests

# 至少给一个总超时（秒），避免永久阻塞
response = requests.get("https://httpbin.org/get", timeout=10)
```

超时的进阶用法（连接超时、读取超时分开、重试）会在后续超时与代理篇章展开。

### 3.5 params 和 data 不要混用

- `params` 是 URL 查询串参数，会拼到 URL 上，适合过滤、分页这类"描述这次请求要什么"的参数。
- `data` 是请求体参数，是"提交给服务器的数据"。
- 不要图省事把本应放请求体的数据塞到 URL 上（尤其敏感数据），也不要反过来。

### 3.6 用 json= 而非手动序列化

现代 API 大多用 JSON，写 `requests.post(url, json=payload)` 比自己 `json.dumps` + 手设 `Content-Type` 更简洁也更不容易出错。

**推荐写法**

```python
import requests
requests.post("https://api.example.com/users", json={"name": "zhangsan"})
```

**不推荐写法**

```python
import json
import requests
headers = {"Content-Type": "application/json"}
requests.post("https://api.example.com/users",
              data=json.dumps({"name": "zhangsan"}),
              headers=headers)
```

### 3.7 调试时善用 response.request

当服务器返回的结果和你预期不符，先看 `response.request.headers` 和 `response.request.body` 确认实际发出去的请求长啥样。多半是请求头或请求体没按你想的发出。

### 3.8 不要用 GET 做有副作用的操作

GET 在语义上是"获取"，不应改变服务器状态。把删除、修改、创建这类操作写在 GET 里（比如 `GET /delete?id=3`）是反 RESTful 设计，会让接口被爬虫、预取、缓存误触。有副作用的操作一律用 POST/PUT/PATCH/DELETE。

---

## 4. 原理

本章不逐行讲 `requests` 源码，而是讲清楚它背后的两件事：HTTP 协议本身的请求-响应模型，以及 `requests` 在这之上基于 `urllib3` 的调用链和关键属性的实现原理。理解这些，你才能在遇到状态码异常、乱码、重定向、JSON 解析失败等问题时知道往哪里查。

### 4.1 HTTP 请求-响应协议

HTTP 是一个应用层协议，本质是一次"请求-响应"的对话：

1. 客户端向服务器建立 TCP 连接（HTTPS 还会在 TCP 上叠一层 TLS 握手）。
2. 客户端发送一段符合 HTTP 格式的文本——**请求**（Request），包含三部分：请求行、请求头、请求体。
3. 服务器读取请求、处理后，回送一段同样符合 HTTP 格式的文本——**响应**（Response），也包含三部分：状态行、响应头、响应体。
4. 连接要么关闭，要么复用（keep-alive）。

**请求的结构**

```
GET /get?q=python HTTP/1.1            <- 请求行：方法 + 路径 + 协议版本
Host: httpbin.org                      <- 请求头，多行 key: value
User-Agent: python-requests/2.32.3
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
                                       <- 空行分隔头与体
<请求体，GET 一般为空>                  <- 请求体
```

请求行里的"方法"就是 GET/POST/PUT/DELETE 这些动词，它告诉服务器"我想对 `/get` 这个资源做什么"。URL 的路径部分（`/get`）和查询串（`?q=python`）在请求行里直接体现。请求头是一组 `字段名: 字段值`，描述请求的元信息：目标主机名、客户端身份、可接受的响应格式、是否压测压缩等。请求体是可选的，GET/HEAD 通常没有，POST/PUT/PATCH 一般有。

**响应的结构**

```
HTTP/1.1 200 OK                        <- 状态行：协议版本 + 状态码 + 原因短语
Content-Type: application/json         <- 响应头
Content-Length: 320
Server: gunicorn/19.9.0
                                       <- 空行分隔头与体
{                                      <- 响应体
  "args": {"q": "python"},
  ...
}
```

状态行里的三位数字就是 `Response.status_code`。原因短语（"OK"、"NOT FOUND"）只是给人看的文字，程序判断一律用数字。响应头和请求头格式一致。响应体紧跟在空行之后，可以是文本（HTML/JSON/纯文本）也可以是二进制（图片/视频）。

`requests` 把这套协议细节封装起来：你只用告诉它方法、URL、参数、请求体，它负责拼出符合 HTTP 格式的请求文本发出去；它把收到的一整段响应解析成 `status_code`、`headers`、`content` 等属性交给你。

### 4.2 requests 基于 urllib3 的连接池与 HTTPConnection

`requests` 自己并不直接操作 socket，它把底层网络通信委托给了 `urllib3`。`urllib3` 是一个比标准库 `urllib` 功能更强大的 HTTP 客户端库，核心特性之一是**连接池**。

**为什么需要连接池**

HTTP 通信要先建立 TCP 连接（HTTPS 还要 TLS 握手），这个过程有网络往返开销。如果每次请求都新建连接、用完就关，频繁请求同一台服务器时这部分开销会累积成明显的延迟。连接池的做法是：请求完成后不立刻关连接，而是放回池子里待命；下次再请求同一主机端口时直接复用这条已建立的连接，省掉握手开销。

**urllib3 的连接管理结构**

`urllib3` 用 `PoolManager` 管理一组连接池，按"主机+端口+协议"作为键区分。`requests` 内部维护一个全局的 `Session`（即使你直接调 `requests.get` 也用的一个默认 session），这个 session 持有一个 `PoolManager`：

- 每次发请求时，`requests` 把目标 URL 解析出 host/port/scheme，向 `PoolManager` 申请一条对应键的连接。
- 如果池里有空闲连接就直接用，没有就新建（必要时排队等池子腾位置）。
- 请求完成后，连接归还到池里，供下一次复用。
- 连接长时间空闲会被自动关闭，避免占用资源。

**调用链概览**

```
requests.get(url)
   -> 底层调用 requests.request("GET", url)
   -> 经 Session.request() 处理：合并默认参数、准备 cookies、构造 PreparedRequest
   -> Session.resolve_redirects() 跟随重定向（如果有）
   -> adapters.HTTPAdapter.send(prepared_request)
   -> urllib3 PoolManager.urlopen(method, url, ...)
   -> urllib3 HTTPConnection / HTTPSConnection 通过 socket 发送请求、读取响应
   -> urllib3 返回 urllib3.HTTPResponse
   -> requests 把它包装成 requests.Response 并填充 status_code / headers / content 等
```

`HTTPAdapter` 是 `requests` 和 `urllib3` 之间的桥：它把 `requests` 的 `PreparedRequest` 翻译成 `urllib3` 能理解的参数，再把 `urllib3` 的响应包装成 `requests.Response`。后续篇章讲 Session、超时、代理时，很多配置最终都是通过 `HTTPAdapter` 传给 `urllib3` 的连接池。

`PreparedRequest` 是一个中间对象：用户传给 `requests.get` 的参数（url、params、data、json、headers 等）先被处理成 `PreparedRequest`——这里 URL 已经拼好查询串、请求体已经序列化好、请求头已经合并好——再交给 adapter 发送。`Response.request` 指向的就是这个发出去的 `PreparedRequest`，所以你能从响应回溯到"实际发出的请求长啥样"。

### 4.3 response.text 的解码机制

HTTP 响应体在网络上是字节流。`Response.content` 是原始字节，`Response.text` 是按某字符集解码后的字符串。`text` 的核心问题是：**用哪个字符集解码**。

`requests` 决定 `encoding` 的顺序大致是：

1. 看响应头 `Content-Type` 是否带 `charset=xxx` 参数。例如 `Content-Type: text/html; charset=utf-8` 就把 `encoding` 设为 `utf-8`。
2. 如果响应头没给字符集，`requests` 默认会把 `encoding` 设为 `ISO-8859-1`。这是 HTTP/1.1 规范对 `text/*` 类型默认字符集的规定——但对 HTML 页面来说常常是错的，因为现在中文网页大多是 UTF-8 或 GBK，按 ISO-8859-1 解码就乱码。
3. 你可以手动设 `response.encoding = "utf-8"`（或任何正确的编码）覆盖默认值。
4. 也可以用 `response.apparent_encoding`——它是 `requests` 调用 `chardet` / `charset_normalizer` 对响应体字节做统计嗅探猜出的编码——赋给 `encoding` 来修正乱码。

`text` 的实际计算可以粗略理解为：

```python
response.text = response.content.decode(response.encoding, errors="replace")
```

注意 `errors="replace"`：解码失败时不会抛异常，而是用 `?` 替换无法解码的字节，表现为乱码字符串而非崩溃。这就是为什么"乱码"比"解码异常"更常见。

**HTML 网页的特殊情况**

对 HTML 网页，字符集未必写在 HTTP 响应头里，也可能写在 HTML 自己的 `<meta charset="utf-8">` 标签里。`requests` 不会解析 HTML 标签去取字符集（它不是 HTML 解析器），所以这种情况下 `encoding` 可能仍是 ISO-8859-1。典型修正流程：

```python
import requests

response = requests.get("https://example.com/some-chinese-page")
# 如果 text 乱码
response.encoding = response.apparent_encoding   # 或直接 response.encoding = "utf-8"
print(response.text)
```

### 4.4 json() 的实现

`Response.json()` 的实现很直接：它把响应体字节交给标准库 `json.loads` 解析。

```python
# 简化表达
import json

def json(self, **kwargs):
    return json.loads(self.content, **kwargs)
```

几个要点：

- 用的是 `content`（字节）而不是 `text`，因为现代 `json.loads` 接受字节输入并按 UTF-8/UTF-16/UTF-32 自动检测编码。
- 如果响应体不是合法 JSON，`json.loads` 抛 `json.JSONDecodeError`；`requests` 在较新版本里会把它重新抛为 `requests.exceptions.JSONDecodeError`（继承自 `ValueError` 和原异常），便于你用 `requests.exceptions` 统一捕获。
- `json()` 不检查 `Content-Type` 是否为 `application/json`。即使服务器声明返回的是 HTML，只要响应体本身恰好是合法 JSON，`json()` 也能解析成功。反过来，`Content-Type: application/json` 但响应体不是合法 JSON（例如返回了错误页面 HTML），`json()` 也会炸——所以状态码和 Content-Type 只能作为参考，不能作为 `json()` 一定成功的保证。

### 4.5 status_code 与 HTTP 状态码语义

`Response.status_code` 直接取自 HTTP 响应状态行的三位数字。HTTP 状态码按首位分类：

| 首位 | 类别 | 示例 |
| --- | --- | --- |
| 1xx | 信息性 | 100 Continue |
| 2xx | 成功 | 200 OK / 201 Created / 204 No Content |
| 3xx | 重定向 | 301 Moved / 302 Found / 304 Not Modified |
| 4xx | 客户端错误 | 400 Bad Request / 401 / 403 / 404 / 429 |
| 5xx | 服务器错误 | 500 / 502 / 503 / 504 |

`requests` 默认会自动跟随 301/302/303 重定向（GET 把方法保持，POST 在 303 后变成 GET），所以正常流程里你看到的 `status_code` 一般是最终的 2xx 或 4xx/5xx。中间的 3xx 响应保留在 `response.history`。如果想看到原始的 3xx 状态码，传 `allow_redirects=False`。

状态码的语义是 HTTP 规范定义的，但具体接口可能有自己的约定——比如有的接口一直返回 200，把业务错误信息塞在响应体 JSON 里。这种"全 200"风格不推荐但确实存在，对接老接口时要注意区分"HTTP 层成功"和"业务层成功"。

### 4.6 raise_for_status 的判断逻辑

`raise_for_status()` 的实现逻辑可以简化为：

```python
def raise_for_status(self):
    ok_status = 400 <= self.status_code < 600   # 需要抛错的区间
    if ok_status:
        # 构造错误信息并抛出 HTTPError
        raise HTTPError(...)
```

也就是：状态码在 `[400, 600)` 区间内就抛 `HTTPError`，否则什么都不做。注意：

- 3xx 默认会被自动跟随，所以正常拿不到 3xx；如果禁用了重定向，3xx 状态码也不会被 `raise_for_status` 视为错误（因为 3xx 是合法的"需要进一步动作"信号，不是错误）。
- 429（限流）、401（未认证）都会被当作错误抛出，这是合理的——它们都意味着"这次请求没拿到想要的数据"。
- `raise_for_status` 只检查状态码，不会检查响应体内容。业务逻辑层面是否成功需要你自己根据响应体再判断。

`raise_for_status` 的价值在于把"状态检查 + 抛错"两件事合一，让正常路径代码不用每次都写 `if not response.ok: ...`。配合 try/except 可以把错误处理集中到一处。

---

## 5. 总结

### 5.1 本文内容要点

- `requests` 是 Python 最流行的第三方 HTTP 客户端库，需 `pip install requests` 安装，定位是"为人类设计的 HTTP"。
- 顶层暴露七个 HTTP 动词方法：`get` / `post` / `put` / `patch` / `delete` / `head` / `options`，函数名与 HTTP 方法同名。它们底层统一走 `requests.request(method, url)`。
- `requests.get(url, params=...)` 用于获取资源，`params` 自动拼接到 URL 查询串并做 URL 编码。
- `requests.post(url, data=...)` 提交表单（`application/x-www-form-urlencoded`），`requests.post(url, json=...)` 提交 JSON（自动设 `Content-Type: application/json`）。
- `put` / `patch` / `delete` / `head` / `options` 用法与 get/post 一致，区别仅在 HTTP 语义和是否带请求体。HEAD 无响应体，OPTIONS 用于查询支持的方法。
- `Response` 对象的全部重要属性：`status_code`、`ok`、`raise_for_status()`、`text`、`content`、`json()`、`headers`（大小写不敏感）、`encoding`、`url`、`cookies`、`elapsed`、`request`、`history`、`apparent_encoding`。
- `text` 用 `encoding` 解码 `content`；`encoding` 优先取 `Content-Type` 的 `charset`，缺失时兜底 ISO-8859-1；`apparent_encoding` 用字符集嗅探库猜测，可用于修正乱码。
- `json()` 内部调用 `json.loads(content)`，不检查 `Content-Type`，响应体非合法 JSON 时抛 `JSONDecodeError`。
- URL 构造：路径参数直接拼字符串（必要时用 `urllib.parse.quote` 编码），查询参数用 `params`。
- `requests` 相比标准库 `urllib` 的核心优势：自动编码/解码、自动 JSON 解析、API 直观、连接池复用。
- 原理层：HTTP 请求-响应协议（请求行/头/体 + 状态行/头/体）；`requests` 经 `HTTPAdapter` 委托 `urllib3.PoolManager` 管理连接池，`PoolManager` 按 host/port 复用 `HTTPConnection`；`raise_for_status` 在 `400 <= status_code < 600` 时抛 `HTTPError`。

### 5.2 读完应能掌握

- 能用 `pip install requests` 安装并在代码中 `import requests`。
- 能说出 `get` / `post` / `put` / `patch` / `delete` / `head` / `options` 各自对应的 HTTP 语义和典型场景，并写出最小调用代码。
- 能用 `params` 传查询参数、用 `data` 提交表单、用 `json` 提交 JSON，并说明三者区别。
- 能从 `Response` 对象上正确取用 `status_code`、`ok`、`text`、`content`、`json()`、`headers`、`encoding`、`url`、`cookies`、`request` 各属性，并知道何时该用哪一个。
- 能用 `raise_for_status()` 做错误检查，能解释它抛错的区间是 `400 <= status_code < 600`。
- 遇到 `text` 乱码时，能用 `response.encoding = response.apparent_encoding` 修正，并说明乱码的成因。
- 能用一段话讲清 `requests` 与 `urllib` 的主要差异，说明为什么实际项目更倾向用 `requests`。
- 能大致描述 `requests` → `HTTPAdapter` → `urllib3` → `HTTPConnection` 的调用链，以及连接池复用的意义。
- 能写出"获取公开 API 数据并解析 JSON"和"提交表单注册"两个最小可用 demo。

本篇建立了"动词方法 + 响应对象"的基本模型。下一篇将进入请求头与参数的进阶控制，展开 `headers`、`cookies`、`files`（文件上传）、`auth`（认证）等细节，并在那之后再分解响应进阶处理、超时代理、Session 会话保持等主题。