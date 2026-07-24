---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 2
title: requests 请求头与参数
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是"请求头与请求参数"

在《01-requests 基础请求》中，我们学会了 `requests.get(url)` / `requests.post(url)` 这种最朴素的调用——只给一个 URL，把响应拿回来。但真实世界里的 HTTP 请求远不止一个 URL：浏览器访问网页时会带上 `User-Agent` 告诉服务器"我是 Chrome";调对外开放 API 时要在 `Authorization` 头里塞一个 Token 证明身份;翻页查询要把 `page=2&page_size=20` 拼到 URL 上;提交表单要把字段放进请求体;上传文件要按 `multipart` 格式打包……这些"把数据放进请求"的方式，统称为**请求头与请求参数**。

HTTP 请求由四部分组成：请求行（方法 + URL + 协议版本）、请求头（headers）、空行、请求体（body）。`requests` 把这四部分抽象成一组关键字参数，让你不用手工拼字符串、不用手工管编码，只需传字典或文件对象，库内部自动帮你组装成合规的 HTTP 报文。本篇要讲清的就是这一组关键字参数：

- `headers`：自定义请求头，控制 `User-Agent` / `Authorization` / `Content-Type` / `Accept` 等。
- `params`：URL 查询参数，自动 `urlencode` 拼接到 URL 的 `?` 后面。
- `data`：表单提交，默认按 `application/x-www-form-urlencoded` 编码进请求体。
- `json`：直接发 JSON 请求体，自动设 `Content-Type: application/json` 并序列化。
- `files`：上传文件，按 `multipart/form-data` 分块发送。
- `cookies`：传 Cookie，用于会话保持或身份标识。
- `auth`：HTTP Basic 认证，自动生成 `Authorization: Basic <base64>` 头。

理解这些参数的区别，本质上是理解"数据放在请求的哪个位置、用什么编码格式"。本篇承接 01，回答"如何把数据放进请求"。

### 1.2 最小用法速览

下面四段最小示例，先建立一个整体印象，细节在第 2 章展开：

```python
import requests

# ① params：URL 查询参数，自动拼成 ?page=2&page_size=20
resp = requests.get("https://httpbin.org/get", params={"page": 2, "page_size": 20})
# 输出：最终请求 URL 为 https://httpbin.org/get?page=2&page_size=20

# ② headers：自定义请求头
resp = requests.get(
    "https://httpbin.org/get",
    headers={"User-Agent": "MySpyder/1.0", "Accept": "application/json"},
)

# ③ data：表单提交（POST 请求体）
resp = requests.post("https://httpbin.org/post", data={"username": "alice", "age": 18})

# ④ json：JSON 请求体（Content-Type 自动设为 application/json）
resp = requests.post("https://httpbin.org/post", json={"username": "alice", "age": 18})
```

这四段代码覆盖了最常见的四种"放数据"方式。关键差异在于数据去了哪里：`params` 去 URL，`data` 去表单体，`json` 去 JSON 体，`headers` 去请求头。下面逐一展开。

---

## 2. 核心内容

### 2.1 headers：自定义请求头

`headers` 接收一个字典，键为请求头字段名，值为字符串。`requests` 在发请求前会把这些键值对写入 HTTP 请求头，覆盖同名默认头。请求头是"元信息区"——放的不是业务数据，而是关于这次请求的描述信息：我是谁（`User-Agent`）、我带的是什么凭证（`Authorization`）、我能接受什么响应（`Accept`）、请求体是什么格式（`Content-Type`）。

**为什么需要自定义 headers**

- `requests` 默认的 `User-Agent` 类似 `python-requests/2.31.0`，很多网站会直接识别并拦截，必须改成浏览器 UA 才能拿到正常页面。
- 调用需要鉴权的 API 时，Token 要放在 `Authorization` 头里，而不是 URL 上。
- 有些 API 根据 `Accept` 头决定返回 JSON 还是 XML，不设可能拿到非预期格式。
- 提交 JSON 时，虽然 `json=` 参数会自动设 `Content-Type`，但用 `data=` 发原始字节时需手动指定。

**常见请求头字段**

| 字段 | 作用 | 典型值 |
|------|------|--------|
| `User-Agent` | 客户端标识，反爬第一道关 | `Mozilla/5.0 ...` |
| `Authorization` | 鉴权凭证 | `Bearer <token>` / `Basic <base64>` |
| `Accept` | 期望的响应格式 | `application/json` |
| `Content-Type` | 请求体格式 | `application/json` / `application/x-www-form-urlencoded` |
| `Referer` | 来源页面 | `https://example.com/search` |
| `Cookie` | 会话标识（也可用 `cookies` 参数） | `sessionid=abc123` |

**demo：带 User-Agent 获取被反爬的页面**

```python
import requests

# 不设 UA，很多站点会返回 403 或空内容
url = "https://httpbin.org/get"

# 反例：默认 UA 暴露 python-requests
resp_default = requests.get(url)
# 输出：resp_default.json()["headers"]["User-Agent"] -> 'python-requests/2.31.0'

# 正例：伪装成 Chrome
headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
}
resp = requests.get(url, headers=headers)
data = resp.json()
# 输出：data["headers"]["User-Agent"] 以 Mozilla/5.0 开头，伪装成功
# 输出：data["headers"]["Accept"] -> 'application/json, text/plain, */*'
```

`httpbin.org/get` 会把收到的请求头原样回显在 JSON 里，适合调试 headers 是否生效。

**demo：Bearer Token 鉴权调用 API**

很多现代 API（GitHub、微信、自研 OpenAPI）用 JWT Bearer Token 鉴权。Token 通常通过登录或 OAuth 换取，之后每次请求放在 `Authorization: Bearer <token>` 头里：

```python
import requests

# 假设登录后拿到 access_token（实际应从环境变量或配置读取）
access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature"

headers = {
    "Authorization": f"Bearer {access_token}",
    "Accept": "application/json",
}
resp = requests.get("https://httpbin.org/bearer", headers=headers)
# 输出：resp.status_code == 200
# 输出：resp.json()["authenticated"] == True
# 输出：resp.json()["token"] == access_token
```

`Authorization: Bearer <token>` 是一个整体字符串，注意 `Bearer` 和 token 之间有一个空格，漏掉空格服务器会判定格式错误。

**headers 会与默认头合并**

`requests` 内部维护一组默认头（如 `User-Agent: python-requests/x.y.z`、`Accept-Encoding: gzip, deflate`、`Connection: keep-alive`）。你传的 `headers` 不是替换整张表，而是合并覆盖同名键。所以你只设了 `User-Agent`，`Accept-Encoding` 等默认头依然会带上——通常这正是你想要的。

### 2.2 params：URL 查询参数

`params` 接收一个字典（或列表 of 元组），`requests` 会用 `urllib.parse.urlencode` 把它编码成 `k=v&k2=v2` 形式，拼到 URL 的 `?` 后面。它对应的是 HTTP 请求行里的 query string，不是请求体。

**什么数据该放 params**

- 筛选、分页、排序等"查条件"：`?page=2&page_size=20&status=active`。
- 不涉及敏感操作幂等的读取参数（GET 请求的参数天然走这里）。
- API 文档里写在 URL 上、用 `?` 拼接的参数。

**为什么用 params 而不是手工拼字符串**

手工拼 `f"{url}?page={page}&q={keyword}"` 有三个坑：中文/特殊字符没编码会乱码或报 400；值为 `None` 时会拼出 `page=None`；已有 `?` 的 URL 再拼 `?` 会变成 `??`。`params` 自动处理编码、跳过 `None`、正确处理已带 query 的 URL：

```python
import requests

# ① 中文自动编码
resp = requests.get(
    "https://httpbin.org/get",
    params={"q": "中文测试", "lang": "zh"},
)
# 输出：最终 URL 为 https://httpbin.org/get?q=%E4%B8%AD%E6%96%87%E6%B5%8B%E8%AF%95&lang=zh

# ② 值为 None 自动跳过
resp = requests.get(
    "https://httpbin.org/get",
    params={"page": 1, "keyword": None},
)
# 输出：最终 URL 为 https://httpbin.org/get?page=1（keyword 被省略）

# ③ URL 本身已带 ?a=1，params 会正确追加
resp = requests.get(
    "https://httpbin.org/get?a=1",
    params={"b": 2},
)
# 输出：最终 URL 为 https://httpbin.org/get?a=1&b=2
```

**demo：分页查询列表接口**

```python
import requests

def fetch_page(base_url, page, page_size, token):
    """翻页查询某列表 API，返回当前页数据。"""
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    params = {"page": page, "page_size": page_size, "status": "active"}
    resp = requests.get(base_url, headers=headers, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()

# 拉取前 3 页
all_items = []
for page in range(1, 4):
    result = fetch_page("https://httpbin.org/anything", page, 20, "fake-token")
    # httpbin /anything 会把请求信息回显，可用于联调确认参数正确
    all_items.extend(result.get("args", {}).items())
# 输出：all_items 包含 page/page_size/status 三组键值对，随 page 变化
```

**同一个 key 多值**

URL 查询串允许同名 key 出现多次（如 `?tag=a&tag=b`）。传列表即可：

```python
import requests

resp = requests.get(
    "https://httpbin.org/get",
    params={"tag": ["python", "web"]},
)
# 输出：最终 URL 为 https://httpbin.org/get?tag=python&tag=web
```

元组列表写法更明确：

```python
resp = requests.get(
    "https://httpbin.org/get",
    params=[("tag", "python"), ("tag", "web"), ("page", 1)],
)
```

### 2.3 data：表单提交

`data` 用于 POST/PUT 请求体，默认编码格式是 `application/x-www-form-urlencoded`——即 `k=v&k2=v2`，跟 URL 查询串长得一样，但放在 body 里。这是 HTML `<form>` 不指定 `enctype` 时的默认提交方式，也是早期 Web API 最常见的格式。

**data vs params 的区别**

很多人会混。区分标准：数据在请求的哪个位置。

- `params` → 请求行（URL 的 `?` 后），适合 GET 的查询条件。
- `data`（字典）→ 请求体，按表单编码，适合 POST 的提交内容。

同一个"提交字段"用 `params` 还是 `data`，取决于服务端约定。一般经验：读取用 `params`，写入/提交用 `data` 或 `json`。

**demo：模拟登录表单提交**

```python
import requests

# 模拟一个表单登录请求
login_url = "https://httpbin.org/post"
form_data = {
    "username": "alice",
    "password": "secret123",
    "remember": "true",
}
resp = requests.post(login_url, data=form_data)
body = resp.json()
# 输出：body["headers"]["Content-Type"] == 'application/x-www-form-urlencoded'
# 输出：body["form"] == {'username': 'alice', 'password': 'secret123', 'remember': 'true'}
```

`httpbin.org/post` 会把表单字段回显在 `form` 字段里，`Content-Type` 也被自动设为表单编码——这两个行为都是 `data=dict` 触发的。

**data 传原始字符串/字节**

`data` 也可以是字符串或字节，此时 `requests` 不会做表单编码，而是原样发送，`Content-Type` 需要你自己在 `headers` 里指定。这在发 XML、Protobuf、自定义格式时有用：

```python
import requests

xml_body = "<?xml version='1.0'?><query><id>42</id></query>"
resp = requests.post(
    "https://httpbin.org/post",
    data=xml_body,
    headers={"Content-Type": "application/xml; charset=utf-8"},
)
# 输出：resp.json()["data"] == xml_body（原样回显）
# 输出：resp.json()["headers"]["Content-Type"] 以 application/xml 开头
```

### 2.4 json：JSON 请求体

`json` 参数接收一个字典（或会被 `json.dumps` 处理的对象），`requests` 自动做两件事：用 `json.dumps` 把对象序列化成 JSON 字符串作为请求体；把 `Content-Type` 设为 `application/json`。这是调用现代 RESTful API 最常用的方式。

**json vs data 的区别**

这是本篇最关键的对比，初学者十有八九会踩坑：

| 维度 | `data=dict` | `json=dict` |
|------|-------------|-------------|
| 请求体格式 | `application/x-www-form-urlencoded` | `application/json` |
| 请求体样貌 | `username=alice&age=18` | `{"username": "alice", "age": 18}` |
| Content-Type | 自动设为表单编码 | 自动设为 `application/json` |
| 嵌套对象 | 不支持（只能平铺 k=v，嵌套要手动序列化） | 天然支持 |
| 服务端解析 | `request.form.get(...)` | `request.get_json()` |

判 断用哪个，看服务端期望什么格式的请求体。文档里写"提交 JSON"或 `Content-Type: application/json` 就用 `json=`；文档里写"表单提交"或 `application/x-www-form-urlencoded` 就用 `data=`。用错格式服务端会 400 或解析不出字段。

**demo：向 JSON API 提交数据**

```python
import requests

# 创建订单的 JSON API
payload = {
    "product_id": "P-1001",
    "quantity": 2,
    "address": {"city": "杭州", "detail": "文一西路 969 号"},
    "coupons": ["NEW10", "FREESHIP"],
}
headers = {"Authorization": "Bearer eyJhbGciOi..."}
resp = requests.post(
    "https://httpbin.org/post",
    json=payload,
    headers=headers,
    timeout=10,
)
body = resp.json()
# 输出：body["headers"]["Content-Type"] == 'application/json'
# 输出：body["json"] == payload（嵌套结构与列表原样保留）
```

注意嵌套对象 `address` 和列表 `coupons` 被完整保留——这是 JSON 体的优势，表单编码做不到（表单只能平铺，嵌套得用 `address[city]=杭州` 这种约定，容易出错）。

**用 data 也能发 JSON，但更繁琐**

等价写法是用 `data=json.dumps(payload)` 并手动设 `Content-Type`：

```python
import json
import requests

payload = {"product_id": "P-1001", "quantity": 2}
resp = requests.post(
    "https://httpbin.org/post",
    data=json.dumps(payload),
    headers={"Content-Type": "application/json"},
)
# 与 json=payload 等价，但需手动序列化+设头，不推荐
```

绝大多数情况直接用 `json=` 更简洁。

**json 参数与 json 模块的命名冲突**

注意 `requests.post(url, json=...)` 里的 `json` 是关键字参数名。如果你的代码顶部 `import json`，再用 `json=` 传参不会冲突，因为在调用点 `json` 作为关键字被解析。但若写成 `requests.post(url, json.dumps(payload))`（位置参数），会报错——`json` 参数必须用关键字传。养成习惯：第二个位置参数默认是 `data`，要发 JSON 永远写 `json=`。

### 2.5 files：上传文件

`files` 用于文件上传，`requests` 会用 `multipart/form-data` 格式发送——这是一种用 boundary 边界分隔多段内容的编码，允许在一次请求里同时传文件和普通字段。对应 HTML `<form enctype="multipart/form-data">`。

**demo：上传单个文件**

```python
import requests

# open 返回的文件对象作为 files 的值
with open("/tmp/avatar.png", "rb") as f:
    resp = requests.post(
        "https://httpbin.org/post",
        files={"avatar": f},
    )
body = resp.json()
# 输出：body["headers"]["Content-Type"] 以 'multipart/form-data; boundary=' 开头
# 输出：body["files"]["avatar"] 非空（文件内容回显）
```

几个要点：

- 用 `"rb"` 二进制模式打开，避免文本模式在 Windows 上引发 `\r\n` 转换破坏二进制内容。
- `with` 语句保证文件在请求结束后关闭。
- `files` 的 key 是表单字段名（服务端用这个名字取文件），value 是文件对象。

**指定文件名与 Content-Type**

只传文件对象时，`requests` 会从文件对象推断文件名，但有时文件对象没有 `name` 属性（如 `io.BytesIO`），或你想覆盖文件名/MIME 类型。这时 value 用三元组 `(文件名, 文件内容, MIME 类型)`：

```python
import requests
from io import BytesIO

# 内存中构造一段"文件内容"，演示无需真实文件
content = b"fake image bytes"
resp = requests.post(
    "https://httpbin.org/post",
    files={"upload": ("report.csv", content, "text/csv")},
)
body = resp.json()
# 输出：body["files"]["upload"] == 'fake image bytes'
# 输出：服务端看到的文件名是 report.csv，MIME 是 text/csv
```

**同时上传文件与普通字段**

`multipart/form-data` 允许一次请求里既有文件又有普通表单字段。文件放 `files`，普通字段放 `data`，两者会合并进同一个 multipart 体：

```python
import requests

with open("/tmp/report.pdf", "rb") as f:
    resp = requests.post(
        "https://httpbin.org/post",
        data={"title": "月度报告", "category": "finance"},
        files={"file": f},
    )
body = resp.json()
# 输出：body["form"] 含 title 和 category（普通字段）
# 输出：body["files"] 含 file（文件字段）
```

**上传多个文件**

同名 key 多文件用列表：

```python
with open("/tmp/a.png", "rb") as fa, open("/tmp/b.png", "rb") as fb:
    resp = requests.post(
        "https://httpbin.org/post",
        files=[("images", fa), ("images", fb)],
    )
```

### 2.6 cookies：传 Cookie

`cookies` 接收一个字典，`requests` 把它写进 `Cookie` 请求头（`k=v; k2=v2` 格式）。Cookie 常用于：登录后服务端下发 `sessionid`，后续请求带着它就能保持登录态；或某些反爬用 Cookie 做指纹校验。

```python
import requests

# 假设从登录响应拿到 sessionid
cookies = {"sessionid": "abc123def456", "csrftoken": "xyz"}
resp = requests.get("https://httpbin.org/cookies", cookies=cookies)
body = resp.json()
# 输出：body["cookies"] == {'sessionid': 'abc123def456', 'csrftoken': 'xyz'}
```

**cookies 参数 vs headers 里的 Cookie**

两者等价但层级不同：`cookies=` 是语义化写法，`requests` 帮你拼成 `Cookie` 头；`headers={"Cookie": "sessionid=abc123"}` 是手工写法。优先用 `cookies=`，它更易读且和 `Session` 对象配合更好。

**与 Session 的关系**

单次请求用 `cookies=` 传 Cookie 只对这一次有效。若要在多次请求间保持 Cookie（如登录后连续访问多个页面），应该用 `requests.Session()`——它的 `cookies` 属性会自动累积响应 set 的 Cookie。这在《05-Session 会话保持》会详讲。

### 2.7 auth：HTTP Basic 认证

`auth` 接收一个 `(用户名, 密码)` 元组，`requests` 会把 `用户名:密码` 做 base64 编码，放进 `Authorization: Basic <编码>` 头。这是 HTTP 1.0 就有的 Basic 认证协议，常见于内网系统、旧式 API、Elasticsearch 等。

```python
import requests

resp = requests.get("https://httpbin.org/basic-auth/alice/secret", auth=("alice", "secret"))
body = resp.json()
# 输出：resp.status_code == 200
# 输出：body == {'authenticated': True, 'user': 'alice'}
```

**Basic 与 Bearer 的区别**

- `auth=` → Basic 认证，用户名密码 base64 编码，**不是加密**，必须配 HTTPS。
- `headers={"Authorization": "Bearer <token>"}` → Bearer Token，用一个换来的 Token 鉴权，现代 API 主流。

新项目优先用 Bearer；`auth=` 主要用于对接遗留系统。

**auth 也支持自定义认证对象**

`requests.auth.AuthBase` 可子类化，实现 `__call__(request)` 返回修改后的 request。这在需要动态生成签名头（如 HMAC 签名）时有用：

```python
from requests.auth import AuthBase
import requests

class TokenAuth(AuthBase):
    def __init__(self, token):
        self.token = token
    def __call__(self, r):
        r.headers["X-Api-Token"] = self.token
        return r

resp = requests.get("https://httpbin.org/get", auth=TokenAuth("my-secret"))
# 输出：resp.json()["headers"]["X-Api-Token"] == 'my-secret'
```

### 2.8 参数组合与优先级

实际请求常常同时用多个参数。下表汇总它们"去了请求的哪里"：

| 参数 | 放置位置 | 触发的 Content-Type |
|------|----------|---------------------|
| `headers` | 请求头 | 手动设 |
| `params` | URL query string | 无 |
| `data`（dict） | 请求体，表单编码 | `application/x-www-form-urlencoded` |
| `json` | 请求体，JSON | `application/json` |
| `files` | 请求体，multipart | `multipart/form-data` |
| `cookies` | `Cookie` 头 | 无 |
| `auth` | `Authorization` 头 | 无 |

**冲突规则**

- `data` 与 `json` 不能同时用于"请求体主导"：都传时会优先用 `data`，`json` 被忽略（具体依版本，实践中不要同时传）。
- `files` 与 `data` 可共存（合并进 multipart 体），`files` 与 `json` 不要混用。
- 你手动在 `headers` 设的 `Content-Type` 可能被 `json=` / `files=` 的自动设置覆盖——遇到自定义 Content-Type 不生效时先检查是不是被覆盖了。

**demo：综合请求**

```python
import requests

resp = requests.post(
    "https://httpbin.org/anything?id=100",
    params={"from": "cli"},          # 追加到 URL: ?id=100&from=cli
    headers={                         # 自定义头
        "User-Agent": "MyApp/2.0",
        "Authorization": "Bearer t0ken",
        "Accept": "application/json",
    },
    json={"action": "sync"},          # JSON 请求体
    cookies={"region": "cn"},         # Cookie 头
    timeout=10,
)
body = resp.json()
# 输出：body["args"] 含 id 与 from
# 输出：body["headers"]["User-Agent"] == 'MyApp/2.0'
# 输出：body["headers"]["Authorization"] == 'Bearer t0ken'
# 输出：body["json"] == {'action': 'sync'}
# 输出：body["cookies"]["region"] == 'cn'
```

这个例子同时用了 `params`、`headers`、`json`、`cookies`，数据各归其位，是真实 API 调用的常见组合。

**常见搭配 / 进阶用法**

**Referer 与 Referer 防盗链**

有些图片/资源站点校验 `Referer`，非本站来源返回 403。下载这类资源时带上同站 Referer：

```python
import requests

headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://example.com/gallery",
}
resp = requests.get("https://example.com/images/pic.jpg", headers=headers)
# 输出：resp.status_code == 200（绕过简单 Referer 防盗链）
```

**自定义 Accept 控制响应格式**

```python
import requests

# 要 JSON
r1 = requests.get("https://httpbin.org/get", headers={"Accept": "application/json"})
# 要纯文本
r2 = requests.get("https://httpbin.org/get", headers={"Accept": "text/plain"})
# 输出：多数 API 会根据 Accept 返回对应格式；httpbin 不区分，真实 API 会
```

**Session + headers 持久化**

如果每个请求都要带相同的 `User-Agent` / `Authorization`，逐个传很啰嗦。用 `Session` 设一次，后续自动带上：

```python
import requests

s = requests.Session()
s.headers.update({
    "User-Agent": "MyApp/2.0",
    "Authorization": "Bearer persistent-token",
})
# 之后 s.get(...) / s.post(...) 都自动带这两个头
resp = s.get("https://httpbin.org/get")
# 输出：resp.json()["headers"]["User-Agent"] == 'MyApp/2.0'
```

这在《05-Session 会话保持》会展开，这里只点出"headers 可以复用"。

---

## 3. 最佳实践

**用 headers= 而不是手工拼 Cookie 头**

`headers={"Cookie": "a=1; b=2"}` 能用，但 `cookies={"a": 1, "b": 2}` 更清晰、不易拼错分号空格。同理鉴权用 `auth=` 或专门的 `Authorization` 头，别把凭证塞进 URL（会进日志、进浏览器历史）。

**永远在发请求前确认 Content-Type 与服务端期望一致**

这是 400 错误的高频原因。排查顺序：看后端文档期望的 `Content-Type` → 选 `data=` 还是 `json=` → 用 `httpbin.org/post` 验证请求体格式与头是否如预期。不要同时传 `data` 和 `json`。

**不要把敏感信息硬编码在 headers 里**

```python
# 不推荐：token 写死在代码里，易被提交进 git
headers = {"Authorization": "Bearer hardcoded-secret"}

# 推荐：从环境变量读
import os
headers = {"Authorization": f"Bearer {os.environ['API_TOKEN']}"}
```

结合 `python-dotenv`（见《08-python-dotenv 环境变量管理》）把 `.env` 纳入 `.gitignore`，是最稳妥的做法。

**User-Agent 伪装是反爬底线，但不是万能**

改 UA 只能过"看 UA 字符串"的初级反爬。更严的站会校验 `Accept-Language`、`Referer`、TLS 指纹、请求频率。组合 headers 模拟真实浏览器特征、加 `time.sleep` 控制频率、必要时用 `Session` 保持 Cookie，是反爬的常规组合拳。爬取前先确认目标站点的 `robots.txt` 与法律边界。

**params 值为 None 的语义**

`requests` 对 `params={"k": None}` 会跳过该字段（不拼进 URL）。利用这点可写"可选过滤条件"：

```python
params = {
    "page": page,
    "keyword": keyword or None,   # keyword 为空字符串时不传
    "category": category if category else None,
}
resp = requests.get(url, params=params)
```

比 `if` 分支拼字典更简洁。

**上传文件务必用 rb 模式**

```python
# 不推荐：文本模式，Windows 上会把 \n 转 \r\n，二进制文件损坏
with open(path, "r") as f:
    requests.post(url, files={"file": f})

# 推荐：二进制模式
with open(path, "rb") as f:
    requests.post(url, files={"file": f})
```

**大文件用流式上传**

`files` 会把整个文件读进内存。上百 MB 的文件用 `requests-toolbelt` 的 `MultipartEncoder` 流式发送，避免内存爆掉：

```python
# 伪代码示意，需 pip install requests-toolbelt
from requests_toolbelt import MultipartEncoder
import requests

m = MultipartEncoder(fields={"file": ("big.bin", open("/tmp/big.bin", "rb"), "application/octet-stream")})
resp = requests.post(url, data=m, headers={"Content-Type": m.content_type})
```

**鉴权信息放进 Session 持久化**

Token 一类需要每次请求都带的头，放进 `Session.headers` 比每个请求写一遍好维护。跨函数调用时只传 `session` 对象，不传 token 字符串，降低泄漏面。

**photoshop 请求体前先确认不是 GET**

GET 请求带 `data` / `json` / `files` 是无意义的（HTTP 规范不保证 GET 有 body），部分服务器/代理会直接丢弃或 400。需要发请求体的场景用 POST/PUT/PATCH。

**headers 键名大小写**

HTTP 头字段名是大小写不敏感的，`requests` 内部会规范化。你写 `"user-agent"` 还是 `"User-Agent"` 都行，但为可读性建议遵循惯例写法（首字母大写连字符式）。

**requests.post vs requests.call 的 data/json 位置参数陷阱**

`requests.post(url, payload)` 这种把 payload 当第二个位置参数的写法是 `data=payload`，不是 `json=payload`。新手常以为"post 就是发数据"而写成位置参数，结果发成了表单编码，服务端按 JSON 解析报错。务必显式写 `json=` 或 `data=`，不要省略关键字。

**编码与 Content-Type 的 charset**

`json=` 自动设的 `Content-Type` 是 `application/json`，不带 `charset`（JSON 规范默认 UTF-8，无需声明）。若服务端死板要求 `application/json; charset=utf-8`，在 `headers` 里先设好完整值，`requests` 不会覆盖你的已有头。`data=dict` 的表单编码默认按 UTF-8。传中文时若服务端报乱码，先确认服务端解析表单时用的编码，必要时改用 `data=urllib.parse.urlencode(form, encoding="utf-8").encode()` 手工控制。

**超时与参数传递的关系**

无论用哪个参数，`timeout=` 都应始终带，避免请求卡死。`timeout` 只影响网络层等待，不影响 `files` 读取大文件的时间（文件读在请求发送前完成）。大文件上传超时建议适当放大。

**日志脱敏**

在日志里打印 `resp.request.headers` 会把 `Authorization` 明文带出来。线上代码若要记录请求头，先脱敏：

```python
def dump_headers(h):
    safe = dict(h)
    for k in ("Authorization", "Cookie", "X-Api-Token"):
        if k in safe:
            safe[k] = "***"
    return safe
# 输出：{'User-Agent': 'MyApp/2.0', 'Authorization': '***'}
```

---

## 4. 原理

理解参数如何变成 HTTP 报文，能帮你解释那些"明明传了却没生效"的诡异现象。本章从 `requests` 内部走到 `urllib3`、再到 HTTP 报文层，逐个参数拆解。

### 4.1 headers 如何写入请求头

`requests` 的每个请求都构造一个 `PreparedRequest` 对象。调用链大致是：

1. `requests.get(...)` → `requests.api.get` → `sessions.Session.request`。
2. `Session.request` 创建 `Request` 对象，把 `headers` 传进去。
3. `Request.prepare()` 调用 `PreparedRequest.prepare_headers(headers)`：把传入的 `CaseInsensitiveDict` 与 `Session` 级别的默认 headers 合并（传入覆盖默认同名键）。
4. 合并后的 headers 存在 `PreparedRequest.headers`（一个 `CaseInsensitiveDict`，键大小写不敏感）。
5. `urllib3` 发送时遍历这张表，逐行写入 HTTP 请求头字段。

默认头里包含 `User-Agent: python-requests/x.y.z`、`Accept-Encoding: gzip, deflate`、`Connection: keep-alive`、`Accept: */*`。你传 `headers={"User-Agent": "..."}` 会覆盖默认 UA，但 `Accept-Encoding` 等你没提到的字段保留。这就是"合并而非替换"的由来。

`CaseInsensitiveDict` 是关键：它让 `headers["content-type"]` 与 `headers["Content-Type"]` 返回同一个值，所以服务端大小写不同的头名不会让你取不到。但注意它只对键不敏感，值是大小写敏感的。

### 4.2 params 的 urlencode 编码

`PreparedRequest.prepare_url(url, params)` 做 URL 准备：

1. 用 `urllib.parse.urlparse` 拆 URL 成 scheme/netloc/path/query 等。
2. 若 `params` 是字典，转成 `[(k, v), ...]` 列表；若是列表 of 元组，直接用。值为 `None` 的项被过滤掉。
3. 对每个 `(k, v)`，用 `urllib.parse.urlencode` 基于 `quote_via`（默认 `quote_plus`）做百分号编码：空格变 `+`，中文变 `%E4%B8%AD...`，`&` `=` 等保留字符也被编码以避免歧义。
4. 把编码后的 query string 与 URL 已有 query 合并（已有在前或后，依实现），用 `urllib.parse.urlencode` 重新拼装。
5. 最终 URL 存入 `PreparedRequest.url`，形如 `https://host/path?page=2&q=%E4%B8%AD%E6%96%87`。

这解释了三件事：为什么中文不会乱码（编码发生在客户端）；为什么 `None` 值消失（过滤步骤）；为什么已有 `?a=1` 再传 `params` 不会变成 `??`（是合并 query 再重组，不是字符串拼接）。

同一个 key 多值（`{"tag": ["a", "b"]}`）时，`urlencode` 生成 `tag=a&tag=b`，而不是 `tag=["a","b"]`。服务端按多值参数解析。

### 4.3 data 表单的编码与 Content-Type

`PreparedRequest.prepare_body(data, files, json)` 处理请求体。当 `data` 是字典（或元组列表）时：

1. `requests` 检测到 `files` 为空、`json` 为空，判定这是表单提交。
2. 用 `urllib.parse.urlencode(data)` 把字典编成 `k=v&k2=v2` 字符串（编码规则同 params）。
3. 把这个字符串作为请求体 `body`。
4. 若 `headers` 里没有 `Content-Type`，自动设为 `application/x-www-form-urlencoded`。

注意步骤 4 的"若没有"：如果你在 `headers` 里手动设了别的 `Content-Type`，`requests` 不会覆盖；但 `data` 仍被表单编码。这会导致"头说是 JSON，体却是表单编码"的矛盾——服务端按 JSON 解析必然失败。所以用 `data=dict` 时不要手动设 `Content-Type: application/json`，要么改用 `json=`，要么别设头。

当 `data` 是 `str` / `bytes` 时，`requests` 跳过编码步骤，原样作为 body，且**不**自动设 `Content-Type`——你得自己在 `headers` 里指定。这是发 XML、原始文本、Protobuf 的路径。

### 4.4 json 的序列化与 Content-Type

`json` 参数走的路径与 `data` 平行但独立：

1. `prepare_body` 检测到 `json is not None`，调用 `requests.models.complexjson.dumps(json)`（`complexjson` 指向标准库 `json`，若装了 `simplejson` 则用后者）。
2. `json.dumps` 把字典序列化成 JSON 字符串（默认 `ensure_ascii=True`，中文会被转成 `\uXXXX`；要保留中文需服务端约定或自定义序列化器，但 `requests` 默认不暴露这个开关）。
3. 字符串编码成字节作为请求体。
4. 若 `headers` 里没有 `Content-Type`，设为 `application/json`。

同样有"不覆盖已有头"的逻辑。若你刻意要设 `application/json; charset=utf-8`，可以在 `headers` 里先设好，`requests` 不会改它。

`json` 参数只接受能被 `json.dumps` 处理的对象。传一个自定义类实例会抛 `TypeError`；datetime 等类型需先用 `default=` 钩子转成基本类型，这种场景应退回 `data=json.dumps(obj, default=str)` 手工序列化。

### 4.5 files 的 multipart/form-data 分块

`multipart/form-data` 是为"一次请求传多段不同类型内容"设计的格式。`prepare_body` 与 `urllib3.filepost.encode_multipart_formdata` 协作完成：

1. 生成一个 boundary 字符串，形如 `----WebKitFormBoundaryXXXX`，随机且不出现在内容里。
2. 把 `files` 里每个字段写成一段：以 `--boundary` 起头，跟一段 `Content-Disposition: form-data; name="字段名"; filename="文件名"` 头，空行后是文件内容字节。
3. 把 `data` 里的普通字段也写成一段（不带 filename，只有 `Content-Disposition: form-data; name="字段名"` + 值）。
4. 最后以 `--boundary--` 结尾。
5. `Content-Type` 设为 `multipart/form-data; boundary=...`。

生成的 body 长这样（简化）：

```
--boundary
Content-Disposition: form-data; name="title"

月度报告
--boundary
Content-Disposition: form-data; name="file"; filename="report.pdf"
Content-Type: application/pdf

<文件二进制>
--boundary--
```

boundary 必须出现在 `Content-Type` 里，服务端靠它切分 body。`requests` 自动完成这些，你只管传文件对象。文件对象需有 `read()` 方法；`requests` 会读出内容并探测 `Content-Type`（用 `mimetypes` 库按文件名后缀猜），猜不到就用 `application/octet-stream`。

因为要读全文进内存拼 body，大文件会占内存。流式方案（`requests-toolbelt` 的 `MultipartEncoder`）的原理是提供一个可迭代、边读边 `yield` 边界的 body，`urllib3` 分块发送，内存占用恒定。

### 4.6 auth 与 Authorization 头的生成

`auth` 参数接收 `AuthBase` 实例。内置的 `HTTPBasicAuth` 的 `__call__` 做的是：

1. 把 `username:password` 拼成字符串。
2. `base64.b64encode(...)` 编码。
3. 设 `request.headers["Authorization"] = "Basic " + 编码字符串`。

所以 `auth=("alice", "secret")` 等价于 `headers={"Authorization": "Basic YWxpY2U6c2VjcmV0"}`（`alice:secret` 的 base64）。Basic 认证没有加密，base64 只是"可逆编码"，必须配 HTTPS 才安全。

`HTTPDigestAuth`（摘要认证）更复杂：服务器先返回 401 带 `WWW-Authenticate: Digest realm=..., nonce=...`，客户端用 nonce + 密码做 MD5/HMAC 挑战应答，再重发请求。`requests.auth.HTTPDigestAuth` 封装了这整套握手。

自定义 `AuthBase` 的原理就是利用 `__call__` 钩子——`requests` 在 `prepare_auth` 阶段调用 `auth(request)`，让你有机会修改 request 对象（通常是设头）。框架把"鉴权"抽象成一个可调用对象， auth 既能设标准 Basic 头，也能设自定义签名头（如 AWS Signature V4、阿里云 ACSSignature），实现统一。

### 4.7 完整报文组装顺序

把前面各步串起来，一个带 headers + params + json 的请求在 `PreparedRequest.prepare()` 里的组装顺序是：

1. `prepare_method`：确定 HTTP 方法。
2. `prepare_url`：合并 `params`，编码 query，得到最终 URL。
3. `prepare_headers`：合并默认 headers 与传入 headers。
4. `prepare_body`：按 `files` → `data` → `json` 优先级确定 body 与 `Content-Type`（`files` 优先 multipart，其次 `json`，再其次 `data` 表单）。
5. `prepare_auth`：调用 `auth(request)`，可能覆盖 `Authorization` 头。
6. `prepare_cookies`：合并 `cookies` 进 `Cookie` 头。
7. `urllib3` 据此发送报文。

理解顺序能解释几个易混点：`auth` 设的 `Authorization` 头在 `prepare_headers` 之后执行，所以会覆盖你手动在 `headers` 里写的 `Authorization`；`json` 触发的 `Content-Type` 在 `prepare_body`，早于你无权再改的时点——这就是"手动 Content-Type 被覆盖"的真相（严格说是不覆盖已有，但若你设了 `Content-Type` 又用 `json=`，体与头可能不一致）。

### 4.8 从 PreparedRequest 反查实际报文

排查"参数没生效"最有效的手段是打印 `PreparedRequest`。`requests` 暴露了请求被"准备"后的完整状态，可在发送前/后检查它到底组装成了什么报文：

```python
import requests

resp = requests.post(
    "https://httpbin.org/anything?id=100",
    params={"from": "cli"},
    headers={"Authorization": "Bearer t0ken"},
    json={"action": "sync"},
)
req = resp.request   # 拿到实际发送的 PreparedRequest

# 追查三要素
print(req.url)                       # 输出：...?id=100&from=cli（params 已并入 URL）
print(req.headers["Content-Type"])   # 输出：application/json（json= 触发）
print(req.headers["Authorization"])  # 输出：Bearer t0ken
print(req.body)                      # 输出：b'{"action": "sync"}'（已序列化的 JSON 体）
```

这套反查路径对应的原理：`Session.request` 在调 `adapter.send(prepared)` 之前，`PreparedRequest` 已完成前述全部 `prepare_*` 步骤，`resp.request` 指向的就是这个准备好的对象。所以 `url` / `headers` / `body` 反映的是"真正发出去的报文"，而非你传入参数的原始形态。遇到 400/403 先看这三项是否与文档一致，比盲猜有效得多。

**常见跳坑对照**

| 现象 | 检查点 | 常见根因 |
|------|--------|----------|
| 服务端收不到 JSON 字段 | `req.headers["Content-Type"]` 与 `req.body` | 用了 `data=` 发了表单编码，服务端按 JSON 解析为空 |
| `params` 中文乱码 | `req.url` | 自己 `f"{url}?q={kw}"` 手拼绕过了 urlencode |
| `Authorization` 不见了 | `req.headers["Authorization"]` | 同时传了 `auth=` 覆盖了手动头 |
| 文件上传服务端拿不到文件名 | `req.body` 里的 `Content-Disposition` | value 只传了文件对象而非三元组 |
| `Content-Type` 含错误的 boundary | 同上 | 手动设了 multipart 头但用了 `data=` 非 `files=` |

---

## 5. 总结

### 5.1 本文内容要点

- `headers=dict` 自定义请求头，覆盖默认头（`User-Agent`/`Authorization`/`Accept`/`Content-Type`），是反爬与鉴权的主战场。
- `params=dict` 把查询条件自动 `urlencode` 拼到 URL `?` 后，处理中文编码、`None` 跳过、多值。
- `data=dict` 表单提交，请求体按 `application/x-www-form-urlencoded` 编码；`data=str/bytes` 发原始字节，需手动设头。
- `json=dict` 直接发 JSON 请求体，自动 `json.dumps` + 设 `application/json`，天然支持嵌套结构，调现代 API 首选。
- `files` 用 `multipart/form-data` 分块上传文件，可同 `data` 共存传普通字段，大文件需流式。
- `cookies=dict` 写入 `Cookie` 头，单次请求传会话标识；跨请求保持用 `Session`。
- `auth=(user, pass)` 生成 Basic 认证 `Authorization` 头，`AuthBase` 可扩展自定义签名。
- 关键区别：`params` 在 URL，`data`/`json`/`files` 在请求体；`data` 表单 vs `json` JSON 体的选择取决于服务端期望的 `Content-Type`。
- 参数组合时的优先级：`files` > `json` > `data`（请求体主导权），`auth` 覆盖手动 `Authorization`，手动 `Content-Type` 与自动设置可能冲突。

### 5.2 读完应能掌握

- 能根据服务端文档正确选用 `data` / `json` / `files` / `params`，并解释它们在 HTTP 报文里的位置差异。
- 能用 `headers` 自定义 `User-Agent` 绕过基础反爬、用 `Authorization: Bearer <token>` 调用鉴权 API、用 `Accept` 控制响应格式。
- 能用 `params` 实现分页/过滤查询，处理中文编码与 `None` 值跳过。
- 能用 `json=` 提交带嵌套结构的 JSON 请求体，并知道何时退回 `data=json.dumps(...)` 手动序列化。
- 能用 `files` 上传单/多文件及附加普通字段，知道为何用 `rb` 与何时需流式上传。
- 能用 `cookies` / `auth` 完成会话标识与 Basic 认证，并说清 Basic 与 Bearer 的安全差异。
- 能解释 `requests` 如何把 `headers/params/data/json/files/auth/cookies` 组装成 HTTP 报文（合并默认头、urlencode、multipart boundary、base64），据此排查"参数没生效"类问题。