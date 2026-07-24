---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 3
title: requests 响应处理
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是响应对象

用 `requests` 发出一个请求后，得到的返回值是一个 `requests.models.Response` 对象，简称响应对象。它封装了服务器对这个请求的全部回应：状态码、响应头、响应体、最终 URL、重定向历史、耗时等。前面两篇讲的是"如何把请求发出去"——设置方法、URL、请求头、参数；本篇讲的是"请求发出去之后，如何把回应接住、读懂、用对"。

一次 HTTP 交互可以笼统地分为"请求"和"响应"两半。请求这半由 `requests.get/post/...` 的参数控制，响应这半则全部挂在 `Response` 对象上。很多初学者只会 `r.json()` 一招，遇到非 JSON 接口、大文件下载、重定向链、状态码异常时就束手无策。本篇的目标就是把 `Response` 对象上那些常用、该用、却容易被忽略的属性和方法一次讲透，让你在面对任意一种响应时都知道该取哪个属性、该调哪个方法、该防哪类异常。

### 1.2 响应对象的最小用法

最小用法：发请求拿到 `Response`，看状态码，取正文。

```python
import requests

r = requests.get("https://httpbin.org/get")

print(r.status_code)   # 状态码
print(r.ok)             # 是否成功
print(r.text)           # 响应正文（文本）
```

运行结果示例：

```
# 输出：
# 200
# True
# {
#   "args": {},
#   ...
# }
```

这就是最朴素的"拿到响应、判断成败、取出内容"三步。本篇余下部分会逐步展开：用 `raise_for_status()` 替代手动判断状态码、用 `content` 取字节、用 `encoding` 控制解码、用 `json()` 解析结构化数据、用 `headers/cookies/url/history/elapsed` 读取元信息、用 `iter_content` 流式处理大文件，最后用异常体系把所有失败情况兜住。

## 2. 核心内容

### 2.1 status_code：状态码语义

`response.status_code` 是一个整数，表示服务器对这次请求的处理结果。它直接来自 HTTP 响应状态行的状态码字段，取值范围 100~599。理解状态码的语义，是判断"这个请求到底成没成、要不要重试、是不是我写错了"的根基。

HTTP 状态码按首位数字分为五大类：

| 首位 | 类别 | 含义 | 典型状态码 |
|------|------|------|-----------|
| 1xx | 信息响应 | 请求已接收，继续处理 | 100 Continue |
| 2xx | 成功 | 请求被正确接收并处理 | 200 OK、201 Created、204 No Content |
| 3xx | 重定向 | 需要进一步动作才能完成请求 | 301、302、304 |
| 4xx | 客户端错误 | 请求有错，责任在调用方 | 400、401、403、404、429 |
| 5xx | 服务端错误 | 服务器处理失败，责任在服务端 | 500、502、503、504 |

在 `requests` 的日常使用中，最常打交道的是 2xx/4xx/5xx 三类：2xx 意味着可以放心取正文；4xx 意味着要检查自己的请求（URL 对不对、鉴权带了没、参数格式对不对、是不是被限流了），重试通常无意义；5xx 意味着服务端出了问题，适度重试可能恢复。

```python
import requests

def describe_status(url):
    r = requests.get(url)
    code = r.status_code
    if 200 <= code < 300:
        bucket = "成功（2xx）"
    elif 300 <= code < 400:
        bucket = "重定向（3xx）"
    elif 400 <= code < 500:
        bucket = "客户端错误（4xx）"
    else:
        bucket = "服务端错误（5xx）"
    print(f"{url} -> {code} {bucket}")

describe_status("https://httpbin.org/status/200")
describe_status("https://httpbin.org/status/301")   # requests 默认跟随重定向，最终看到的是 200
describe_status("https://httpbin.org/status/404")
describe_status("https://httpbin.org/status/500")
```

```
# 输出：
# https://httpbin.org/status/200 -> 200 成功（2xx）
# https://httpbin.org/status/301 -> 200 成功（2xx）
# https://httpbin.org/status/404 -> 404 客户端错误（4xx）
# https://httpbin.org/status/500 -> 500 服务端错误（5xx）
```

**几点关键说明**

- `status_code` 一定是整数，不要和字符串比较，写 `r.status_code == 200` 而非 `== "200"`。
- `requests` 默认会自动跟随 301/302 等重定向，所以你看到的 `status_code` 通常是重定向链末端的最终状态码。若想拿到原始的 3xx，传 `allow_redirects=False`。
- 不要只判断 `== 200`。有些接口成功会返回 201（创建成功）或 204（无内容），写 `r.ok` 或 `r.status_code < 400` 更稳。

### 2.2 ok 与 raise_for_status()：成败判断的两把刀

判断一个响应是否"成功"，有两个层次：轻量判断用 `r.ok`，要抛异常用 `r.raise_for_status()`。

**response.ok**

`ok` 是一个布尔属性，等价于 `self.status_code < 400`。也就是说，只要状态码在 2xx 和 3xx 区间，`ok` 就是 `True`。它不区分 2xx 成功和 3xx 重定向——因为跟随重定向后通常就是 2xx，这个粒度对"能不能用这个响应"的判断已经够用。

```python
import requests

for url in ["https://httpbin.org/status/200", "https://httpbin.org/status/404"]:
    r = requests.get(url)
    if r.ok:
        print(f"{url}: 成功，可以处理正文")
    else:
        print(f"{url}: 失败（{r.status_code}），别盲目取正文")
```

```
# 输出：
# https://httpbin.org/status/200: 成功，可以处理正文
# https://httpbin.org/status/404: 失败（404），别盲目取正文
```

`ok` 适合用在"失败时只是跳过、不致命"的场景，比如爬虫抓到一个 404 链接，跳过即可，不必中断整个流程。

**response.raise_for_status()**

`raise_for_status()` 是一个方法，调用后若状态码是 4xx/5xx，就抛出 `requests.exceptions.HTTPError`；若是 2xx/3xx，什么都不做、返回 `None`。它和 `ok` 的区别在于"失败时怎么反应"：`ok` 让你自己写 if/else，`raise_for_status()` 直接把失败变成异常，配合 try/except 统一处理。

```python
import requests

try:
    r = requests.get("https://httpbin.org/status/500", timeout=5)
    r.raise_for_status()          # 500 会抛 HTTPError
    print("业务处理：", r.text)
except requests.exceptions.HTTPError as e:
    print("HTTP 错误：", e)
```

```
# 输出：
# HTTP 错误： 500 Server Error: INTERNAL SERVER ERROR for url: https://httpbin.org/status/500
```

**何时用哪个**

- 写库、刷数据等"失败必须停下、必须报错"的流程：用 `raise_for_status()`，把异常往上抛，由上层统一记日志或重试。
- 爬虫遍历一批 URL、个别失败无所谓：用 `ok` 跳过坏链接，保证整体流程不中断。
- 两者都不是只能选一个——可以先 `raise_for_status()` 保证非 2xx 一定被捕获，再在 except 里按 `status_code` 细分处理（429 限流就 sleep 重试，404 就记死链）。

### 2.3 text 与 content：取正文的两种姿势

响应正文可以按"文本"取，也可以按"字节"取，分别对应 `response.text` 和 `response.content`。

**response.content：原始字节**

`content` 是 `bytes` 类型，是服务器返回的原始字节流，未经任何解码。当你下载图片、PDF、压缩包、视频等二进制文件时，必须用 `content`，因为把它们按文本解码会乱码甚至报错。

```python
import requests

r = requests.get("https://httpbin.org/bytes/8")  # 返回 8 个随机字节
print(type(r.content), r.content)
```

```
# 输出：
# <class 'bytes'> b'\x8f\x1a\xc7...'
```

保存二进制文件的标准写法：

```python
import requests

r = requests.get("https://httpbin.org/image/png")
r.raise_for_status()
with open("logo.png", "wb") as f:       # 注意 "wb" 二进制写
    f.write(r.content)
print("已保存，字节数：", len(r.content))
```

```
# 输出：
# 已保存，字节数： 8090
```

**response.text：解码后的文本**

`text` 是 `str` 类型，是 `requests` 用某个编码把 `content` 解码后的字符串。它适合取 HTML、JSON、纯文本等文本类响应。解码用的编码由 `response.encoding` 决定（下一节详述）。

```python
import requests

r = requests.get("https://httpbin.org/encoding/utf8")
print(type(r.text))
print(r.text[:60])
```

```
# 输出：
# <class 'str'>
# <!DOCTYPE html>
# <html>
#   <head>
#     <meta charset="utf-8">
```

**两者怎么选**

- 是二进制（图片/音视频/压缩包/可执行文件）：用 `content`。
- 是文本（HTML/JSON/CSV/纯文本）：用 `text`。
- 拿不准时：先看 `Content-Type` 响应头，`image/*`、`application/octet-stream`、`application/pdf` 等走 `content`；`text/*`、`application/json`、`application/xml` 走 `text`。
- 一个常见的坑：`r.json()` 内部用的是 `text`（先解码再 loads），如果编码识别错了，`text` 乱码，`json()` 也会跟着失败。所以遇到 `json()` 报错时，先排查 `encoding`。

### 2.4 encoding 与 apparent_encoding：控制解码

上一节说 `text` 用 `response.encoding` 指定的编码来解码 `content`。那么 `encoding` 从哪来、什么时候会错、怎么修正？这一节讲清楚。

**encoding 的来源**

`requests` 给 `response.encoding` 赋值的过程是这样的：

1. 优先看 HTTP 响应头里的 `Content-Type`，如果带 `charset=xxx`，就用这个 charset。例如 `Content-Type: text/html; charset=utf-8` 会把 `encoding` 设为 `utf-8`。
2. 如果响应头里没有 charset，但响应对应的 URL 是一个 HTML 页面，`requests` 会解析 HTML 里的 `<meta charset=xxx>` 标签来推断编码。
3. 如果上面两步都没有结果，`encoding` 默认设为 `ISO-8859-1`（HTTP/1.1 规范的默认值）。

第 3 步的默认值是乱码高发区：很多中文页面响应头没带 charset、又不是标准 HTML（比如某些 API 返回 GBK 编码的纯文本），`requests` 就会按 `ISO-8859-1` 解码，中文全成乱码。

**apparent_encoding：自动检测**

`response.apparent_encoding` 用 `chardet`（或内置的字符集检测）分析 `content` 的字节分布，猜出一个 Probably 编码。当你发现 `text` 乱码时，把 `encoding` 设成 `apparent_encoding` 通常就能修正。

```python
import requests

r = requests.get("https://httpbin.org/encoding/utf8")
print("encoding:           ", r.encoding)            # 头里没 charset 时可能是 ISO-8859-1
print("apparent_encoding:  ", r.apparent_encoding)    # 检测出的编码

# 修正解码
r.encoding = r.apparent_encoding
print(r.text[:40])
```

```
# 输出：
# encoding:            ISO-8859-1
# apparent_encoding:   utf-8
# <!DOCTYPE html>
# <html>
# <head>
```

**手动指定编码**

如果你已经知道目标接口用的是什么编码（比如对接一个老系统，约定 GBK），不用等自动检测，直接赋值最快最稳：

```python
import requests

r = requests.get("https://example-legacy-api/endpoint")
r.encoding = "gbk"          # 直接按约定设
print(r.text)
```

**优先级建议**

- 响应头带了正确的 charset：什么都不用做，`requests` 会用对。
- 响应头没带、但你有文档约定编码：直接 `r.encoding = "xxx"`。
- 没文档、不确定：用 `r.encoding = r.apparent_encoding`，依赖检测结果。
- 永远不要无脑相信 `ISO-8859-1` 默认值——含中文的响应基本都会错。

### 2.5 json()：解析 JSON 响应

现代 Web API 大多返回 JSON。`response.json()` 把响应正文解析成 Python 对象（dict/list/str/int/...），等价于 `json.loads(r.text)`。

**基本用法**

```python
import requests

r = requests.get("https://httpbin.org/json")
r.raise_for_status()
data = r.json()
print(type(data))
print(data)
```

```
# 输出：
# <class 'dict'>
# {'slideshow': {'author': 'Yours Truly', 'date': 'date of publication', 'slides': [{'title': 'Wake up to WonderWidgets!', 'type': 'all'}, ...], 'title': 'Sample Slide Show'}}
```

拿到 dict 后，就可以像普通字典一样取值：

```python
print(data["slideshow"]["title"])          # 取嵌套字段
for slide in data["slideshow"]["slides"]:
    print("-", slide["title"])
```

```
# 输出：
# Sample Slide Show
# - Wake up to WonderWidgets!
# - Overview
```

**失败情况：JSONDecodeError**

`json()` 在以下情况会抛异常：

- 响应不是 JSON（比如返回 HTML 错误页、空字符串、纯文本）。
- JSON 格式不合法（缺括号、多逗号等）。

在较新的 `requests` 版本中，解析失败抛的是 `requests.exceptions.JSONDecodeError`（它继承自 `json.JSONDecodeError`）；老版本可能直接抛 `json.JSONDecodeError` 或 `ValueError`。无论哪种，都属于"响应体不是合法 JSON"。

```python
import requests

r = requests.get("https://httpbin.org/html")   # 返回 HTML，不是 JSON
try:
    data = r.json()
except requests.exceptions.JSONDecodeError as e:
    print("JSON 解析失败：", e)
    print("响应前 80 字符：", r.text[:80])
```

```
# 输出：
# JSON 解析失败： Expecting value: line 1 column 1 (char 0)
# 响应前 80 字符： <!DOCTYPE html>
# <html>
#   <head>
#     <style>
#       body { ...
```

**调 API 的典型模式**

真实的 API 调用通常是"判断状态 + 解析 JSON"两步合一：

```python
import requests

def fetch_json(url):
    r = requests.get(url, timeout=10)
    r.raise_for_status()             # 非 2xx/3xx 抛 HTTPError
    return r.json()                  # 解析失败抛 JSONDecodeError

try:
    data = fetch_json("https://httpbin.org/json")
    print("拿到数据 keys：", list(data.keys()))
except requests.exceptions.HTTPError as e:
    print("状态码错误，不解析：", e)
except requests.exceptions.JSONDecodeError:
    print("返回的不是合法 JSON，可能是个错误页面")
```

```
# 输出：
# 拿到数据 keys： ['slideshow']
```

**一个隐蔽的坑**

`json()` 依赖 `text`，`text` 依赖 `encoding`。如果 `encoding` 被错误地设成 `ISO-8859-1`，而响应体里含中文（UTF-8 编码），`text` 会产生乱码字符，`json()` 可能因为非法字符而抛 `JSONDecodeError`。遇到"明明用浏览器看是合法 JSON，`json()` 却报错"时，先 `print(r.encoding, r.apparent_encoding)` 排查编码。

### 2.6 headers：响应头

`response.headers` 是一个 `requests.structures.CaseInsensitiveDict`，封装了服务器返回的全部响应头。它的特殊之处在于键不区分大小写：`r.headers["Content-Type"]`、`r.headers["content-type"]`、`r.headers["CONTENT-TYPE"]` 拿到的是同一个值。

**为什么不分大小写**

HTTP 规范规定头部字段名是大小写不敏感的。不同服务器、不同网关可能把同一个头写成 `Content-Type`、`content-type` 或 `CONTENT-TYPE`。如果用普通 dict，你就得自己处理键的大小写问题；`CaseInsensitiveDict` 在内部把键统一存成小写，对外提供大小写不敏感的访问，省掉了这层麻烦。

**常见用法**

```python
import requests

r = requests.get("https://httpbin.org/response-headers?X-Custom=hello&Content-Type=application/json")

print(r.headers["Content-Type"])          # 大写
print(r.headers["content-type"])          # 小写，同一个值
print(r.headers.get("X-Custom"))          # 自定义头

for name, value in r.headers.items():
    print(f"{name}: {value}")
```

```
# 输出：
# application/json
# application/json
# hello
# Content-Type: application/json
# X-Custom: hello
# Content-Length: ...
# ...
```

注意 `CaseInsensitiveDict` 仅指键的大小写不敏感，值的字符串本身是保留原样的。

**几个常读的响应头**

| 响应头 | 用途 | 典型场景 |
|--------|------|---------|
| `Content-Type` | 响应体类型与字符集 | 判断走 text/content/json 哪条路 |
| `Content-Length` | 响应体字节数 | 进度条、预估内存 |
| `Content-Encoding` | 压缩方式（gzip/br） | requests 自动解压，一般不用管 |
| `Set-Cookie` | 服务器下发的 Cookie | 会写入 response.cookies |
| `Location` | 重定向目标 URL | 配合 3xx 状态码 |
| `Retry-After` | 重试前应等待秒数 | 处理 429/503 限流 |
| `ETag` / `Last-Modified` | 缓存标识 | 条件请求 If-None-Match |

**Retry-After 实战**

碰到 429 限流或 503 暂不可用时，规范的接口会在 `Retry-After` 头里告诉你等多久再试：

```python
import requests
import time

def get_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        r = requests.get(url)
        if r.ok:
            return r
        if r.status_code in (429, 503):
            wait = int(r.headers.get("Retry-After", "2"))  # 没给就默认 2 秒
            print(f"第 {attempt+1} 次请求被限流（{r.status_code}），等 {wait}s 重试")
            time.sleep(wait)
        else:
            r.raise_for_status()
    raise RuntimeError(f"重试 {max_retries} 次仍失败")

# 假设接口限流
try:
    r = get_with_retry("https://httpbin.org/status/429")
except Exception as e:
    print("最终失败：", e)
```

```
# 输出：
# 第 1 次请求被限流（429），等 2s 重试
# 第 2 次请求被限流（429），等 2s 重试
# 第 3 次请求被限流（429），等 2s 重试
# 最终失败： 重试 3 次仍失败
```

### 2.7 cookies：响应中的 Cookie

`response.cookies` 是一个 `RequestsCookieJar`，保存了服务器通过 `Set-Cookie` 响应头下发的 Cookie。它和请求侧的 `cookies` 参数对偶：响应收到后，里面的 Cookie 可以在下一次请求里带上，从而维持会话。

**查看响应 Cookie**

```python
import requests

r = requests.get("https://httpbin.org/cookies/set?token=abc123&lang=zh")
for cookie in r.cookies:
    print(cookie.name, "=", cookie.value, "| domain:", cookie.domain, "| path:", cookie.path)
```

```
# 输出：
# token = abc123 | domain: httpbin.org | path: /
# lang = zh | domain: httpbin.org | path: /
```

也可以按键取单个值：

```python
print(r.cookies["token"])   # abc123
print(r.cookies.get("token"))  # abc123
```

```
# 输出：
# abc123
# abc123
```

**Cookie 的属性**

每个 Cookie 对象除了 `name`/`value`，还有这些常用属性：

- `domain`：生效域名。
- `path`：生效路径。
- `expires`：过期时间（字符串或 `None`）。
- `secure`：是否只在 HTTPS 下发送。
- `httponly`：是否禁止 JS 访问。

**手动把响应 Cookie 带到下一个请求**

不用 Session 也能手动传递：

```python
import requests

r1 = requests.get("https://httpbin.org/cookies/set?sid=xyz789")
# 把 r1 拿到的 Cookie 带到下一个请求
r2 = requests.get("https://httpbin.org/cookies", cookies=r1.cookies)
print(r2.json())   # 服务端回显收到的 Cookie
```

```
# 输出：
# {'cookies': {'sid': 'xyz789'}}
```

不过更省事的做法是用 `requests.Session()`，它会自动维护 Cookie（下一篇会讲）。这里只需要知道：`response.cookies` 是会话保持的"原材料"。

### 2.8 url 与 history：重定向追踪

`response.url` 是请求最终落地的 URL（经过所有重定向之后），`response.history` 是重定向过程中经过的中间响应列表。

**默认跟随重定向**

`requests` 默认对 301/302/303/307/308 跟随重定向（GET/HEAD 自动跟，POST 在 301/302 下通常被改成 GET）。所以 `r.url` 可能和你传入的 URL 不同——这是正常的，不是 bug。

```python
import requests

r = requests.get("https://httpbin.org/redirect-to?url=https://example.com&status_code=302")
print("最终 URL：", r.url)
print("重定向链长度：", len(r.history))
for h in r.history:
    print("  ", h.status_code, "->", h.url)
print("最终状态码：", r.status_code)
```

```
# 输出：
# 最终 URL： https://example.com
# 重定向链长度： 1
#    302 -> https://httpbin.org/redirect-to?url=https://example.com&status_code=302
# 最终状态码： 200
```

`history` 里的每个元素都是一个 `Response` 对象（代表一次中间的 3xx 响应），它的 `status_code` 是 3xx，`url` 是被重定向前的地址。`history` 是个列表，顺序就是重定向发生的顺序；列表为空说明没有发生重定向。

**禁止跟随重定向**

想自己处理 3xx（比如只拿到 `Location` 不真的跳过去），传 `allow_redirects=False`：

```python
import requests

r = requests.get("https://httpbin.org/redirect-to?url=https://example.com", allow_redirects=False)
print(r.status_code)                          # 302
print(r.headers["Location"])                 # 重定向目标
print(r.history)                             # []，没有跟随
```

```
# 输出：
# 302
# https://example.com
# []
```

**限制重定向次数**

为避免无限重定向，可以传 `max_redirects`：

```python
import requests

# httpbin 的 /absolute-redirect/N 会连续重定向 N 次
try:
    r = requests.get("https://httpbin.org/absolute-redirect/5", max_redirects=2)
except requests.exceptions.TooManyRedirects as e:
    print("重定向次数超限：", e)
```

```
# 输出：
# 重定向次数超限： Exceeded 2 redirects.
```

**为什么要关注 url 和 history**

- 调试"为什么拿到的内容和预期不一样"——可能被重定向到了登录页、移动版、另一个 CDN。
- 记录最终 URL，用于去重（爬虫里同一资源常有多个短链指向同一最终 URL）。
- 校验重定向链是否走了 HTTPS（有些站点 HTTP 会被 301 到 HTTPS，确认链路安全）。

### 2.9 elapsed：请求耗时

`response.elapsed` 是一个 `datetime.timedelta` 对象，表示从请求发出到响应头到达所经过的时间。注意它衡量的是"拿到响应头"的耗时，不含响应体传输时间——对于大文件下载，`elapsed` 很小但实际传输很久。

```python
import requests

r = requests.get("https://httpbin.org/delay/1")   # 服务端延迟 1 秒
print(r.elapsed)
print(r.elapsed.total_seconds())    # 浮点秒数
print(f"耗时 {r.elapsed.total_seconds()*1000:.0f} ms")
```

```
# 输出：
# 0:00:01.008123
# 1.008123
# 耗时 1008 ms
```

**与 timeout 的区别**

`elapsed` 是"这次请求实际花了多久"，是事后的统计；`timeout` 是"我允许这次请求最多花多久"，是事前的限制。`elapsed` 超过 `timeout` 不会触发什么——`timeout` 在网络层就掐断了，能拿到 `Response` 说明没超时。

**用途**

- 记录接口监控指标：慢接口报警。
- 选择更快的镜像源：测多个源的 `elapsed` 取最快。
- 压测时统计 P95/P99 延迟。

```python
import requests
import statistics

def probe(url, n=5):
    times = []
    for _ in range(n):
        r = requests.get(url)
        times.append(r.elapsed.total_seconds())
    return times

latencies = probe("https://httpbin.org/get")
print("各次耗时：", [f"{t*1000:.0f}ms" for t in latencies])
print(f"平均 {statistics.mean(latencies)*1000:.0f}ms，中位数 {statistics.median(latencies)*1000:.0f}ms")
```

```
# 输出：
# 各次耗时： ['320ms', '280ms', '295ms', '270ms', '310ms']
# 平均 295ms，中位数 295ms
```

### 2.10 iter_content 与 iter_lines：流式处理大响应

到此为止讲的 `text/content/json()` 都是一次性把整个响应体读进内存。对于几十 KB 的 API 响应没问题，但如果是几百 MB 的日志文件、几 GB 的视频，一次性读进内存会让进程 OOM 崩掉。这时候要用流式读取。

**前提：stream=True**

流式读取必须在请求时传 `stream=True`，告诉 `requests`"先别急着把响应体全读进来，等我慢慢读"。这样 `requests` 只建立连接、读完响应头，响应体保持为网络流，直到你主动读。

```python
import requests

r = requests.get("https://httpbin.org/stream/5", stream=True)   # 服务端会流式发 5 行
print(r.headers["Content-Type"])     # 响应头已就绪
# 此时响应体还没读
```

**iter_content：按字节块读**

`iter_content(chunk_size)` 返回一个生成器，每次 yield 最多 `chunk_size` 字节的 `bytes`。`chunk_size` 控制每块大小，常见取 8192、65536 等。

```python
import requests

r = requests.get("https://httpbin.org/stream/5", stream=True)
total = 0
for chunk in r.iter_content(chunk_size=8192):
    total += len(chunk)
    print(f"读到一块 {len(chunk)} 字节，累计 {total}")
r.close()   # 用完关掉，释放连接
```

```
# 输出：
# 读到一块 670 字节，累计 670
```

`iter_content` 适合下载二进制大文件：每读到一块就写盘，内存里始终只有一块。

**流式下载大文件**

```python
import requests

def download(url, path):
    with requests.get(url, stream=True) as r:      # with 会自动 close
        r.raise_for_status()
        with open(path, "wb") as f:
            for chunk in r.iter_content(chunk_size=64 * 1024):   # 64KB/块
                if chunk:                 # 过滤掉 keep-alive 的空块
                    f.write(chunk)
    print("下载完成：", path)

download("https://httpbin.org/bytes/10240", "data.bin")
```

```
# 输出：
# 下载完成： data.bin
```

实测内存占用：无论文件多大，这种写法内存峰值大约就是 `chunk_size` 量级（几十 KB），而不是文件大小。

**iter_lines：按行读**

`iter_lines()` 返回一个生成器，每次 yield 一行（`str`，已按 `encoding` 解码）。它适合处理流式 JSON Lines（NDJSON）、流式日志、SSE 等"一行一条记录"的响应。

```python
import requests
import json

r = requests.get("https://httpbin.org/stream/5", stream=True)
for line in r.iter_lines():
    if not line:
        continue
    obj = json.loads(line)           # 每行一个 JSON 对象
    print("收到记录 id =", obj.get("id"))
```

```
# 输出：
# 收到记录 id = 0
# 收到记录 id = 1
# 收到记录 id = 2
# 收到记录 id = 3
# 收到记录 id = 4
```

**注意事项**

- `stream=True` 下务必把 `Response` 关掉（用 `with` 最省心），否则连接不会归还连接池，长时间运行会耗尽连接数。
- `iter_lines` 不是按 `\n` 简单切分，它内部也是用 `iter_content` 累积字节再按行分隔；块大、行小时效率没问题，但不要指望它有严格的实时性（一行可能跨多个网络包）。
- 流式响应不能用 `r.text`/`r.content`/`r.json()` 之后再 `iter_content`——这些方法会把流读空。

### 2.11 异常体系：把失败兜住

网络请求的失败场景比本地函数多得多：连不上、连上了被重置、发了没响应、响应了状态码错误、状态码对但内容不是 JSON……`requests` 用一套异常体系覆盖这些情况，配合 try/except 把它们兜住。

**异常层次**

`requests.exceptions` 下主要异常的继承关系：

```
RequestException                   # 所有 requests 异常的基类
├── ConnectionError               # 网络层问题：DNS 失败、拒绝连接、连接被重置
│   └── ProxyError                # 代理相关问题
├── HTTPError                     # 响应回来但状态码是 4xx/5xx（raise_for_status 触发）
├── Timeout                       # 超时：连不上或等不到响应
│   ├── ConnectTimeout            # 连接阶段超时
│   └── ReadTimeout               # 读取阶段超时
├── URLRequired                   # URL 非法
├── TooManyRedirects              # 重定向次数超限
└── InvalidURL                    # URL 格式无效
```

其中 `HTTPError`、`ConnectionError`、`Timeout`、`TooManyRedirects` 是日常最常捕获的四类。`Timeout` 包含 `ConnectTimeout` 和 `ReadTimeout`，一般捕 `Timeout` 就够了。

**各异常对应的失败场景**

| 异常 | 什么时候抛 | 含义 |
|------|-----------|------|
| ConnectionError | DNS 解析失败、TCP 连不上、连接被对端重置 | 网络/服务端不可达 |
| ConnectTimeout | 在指定时间内 TCP 连接建立失败 | 连接阶段超时 |
| ReadTimeout | TCP 连上了但响应迟迟不来 | 服务端处理慢或卡住 |
| Timeout | ConnectTimeout / ReadTimeout 的基类 | 任一阶段超时 |
| HTTPError | raise_for_status() 后状态码 4xx/5xx | 请求发出去了，服务器回错 |
| TooManyRedirects | 重定向次数超 max_redirects | 重定向环路或太长 |
| JSONDecodeError | r.json() 解析失败 | 响应体不是合法 JSON |
| SSLError | TLS 握手失败、证书校验不过 | HTTPS 配置/证书问题 |
| RequestException | 上述所有异常的基类 | 兜住一切 requests 抛错 |

**统一捕获的推荐写法**

按"从具体到一般"的顺序捕获，最外层用 `RequestException` 兜底：

```python
import requests

def safe_get_json(url):
    try:
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        print("网络连不上，检查 DNS/网络/服务是否在线")
    except requests.exceptions.Timeout:
        print("请求超时，服务端可能卡住或网络太慢")
    except requests.exceptions.HTTPError as e:
        print(f"HTTP 错误 {e.response.status_code}：服务器拒绝了请求")
    except requests.exceptions.JSONDecodeError:
        print("返回的不是合法 JSON，可能拿到了错误页")
    except requests.exceptions.RequestException as e:
        print(f("其他请求异常：{e}"))
    return None

print(safe_get_json("https://httpbin.org/status/500"))
print(safe_get_json("https://httpbin.org/html"))
print(safe_get_json("https://nonexistent-host-xyz.example/get"))
```

```
# 输出：
# HTTP 错误 500：服务器拒绝了请求
# None
# 返回的不是合法 JSON，可能拿到了错误页
# None
# 网络连不上，检查 DNS/网络/服务是否在线
# None
```

**带重试的完整示例**

把状态码判断、异常捕获、限流退避、重试次数合并成一个健壮的调用函数：

```python
import requests
import time

def robust_get(url, max_retries=3, timeout=5):
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url, timeout=timeout)
            # 429/503 限流：按 Retry-After 退避后重试
            if r.status_code in (429, 503):
                wait = int(r.headers.get("Retry-After", str(attempt * 2)))
                print(f"[{attempt}] 被限流（{r.status_code}），等 {wait}s")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            # 网络/超时类：可重试
            last_exc = e
            print(f"[{attempt}] 网络异常：{e.__class__.__name__}，{attempt}s 后重试")
            time.sleep(attempt)
        except requests.exceptions.HTTPError as e:
            # 4xx 客户端错误：重试无意义，直接抛
            code = e.response.status_code
            if 400 <= code < 500 and code != 429:
                raise
            # 5xx：可重试
            last_exc = e
            print(f"[{attempt}] 服务端错误 {code}，{attempt}s 后重试")
            time.sleep(attempt)
    raise last_exc

# 调用
try:
    r = robust_get("https://httpbin.org/status/500", max_retries=3)
except Exception as e:
    print("最终失败：", e.__class__.__name__)
```

```
# 输出：
# [1] 服务端错误 500，1s 后重试
# [2] 服务端错误 500，2s 后重试
# [3] 服务端错误 500，3s 后重试
# 最终失败： HTTPError
```

这个函数的设计原则是：4xx（非 429）立即抛、不重试（请求本身有问题，重试也是一样的错）；网络异常和 5xx 重试，因为它们有概率自愈；429/503 按 `Retry-After` 退避，尊重服务端的限流节奏。生产环境的调用封装基本都遵循这个套路。

## 3. 最佳实践

**判断成败优先用 raise_for_status，而非手写 if status == 200**

不推荐：

```python
r = requests.get(url)
if r.status_code == 200:
    data = r.json()
```

推荐：

```python
r = requests.get(url)
r.raise_for_status()
data = r.json()
```

原因：`== 200` 漏掉了 201/204 等同样成功的状态码；`raise_for_status` 把所有 4xx/5xx 统一变成异常，和 try/except 配合后控制流更清晰，也不会"忘了判断就盲目取正文"。

**永远给请求加 timeout**

不推荐：`requests.get(url)`——默认无超时，服务端不响应时进程会一直挂着。
推荐：`requests.get(url, timeout=5)` 或 `timeout=(连接超时, 读取超时)`。

网络请求不设超时是生产事故的常见源头。哪怕你觉得接口很快，也要兜一个上限（比如 10 秒），防止偶发的网络抖动把整个流程卡死。

**二进制一定用 content，别用 text**

取图片/文件时误用 `r.text` 会触发解码，二进制被强行按 Latin-1 解释成乱码字符串，再 `encode` 回去已经损坏。下载文件、保存二进制，固定用 `r.content`。

**乱码先查 encoding 再干活**

`r.text` 出现乱码时，别急着换库。先 `print(r.encoding, r.apparent_encoding)`：若 `encoding` 是 `ISO-8859-1` 而内容是中文，`r.encoding = r.apparent_encoding` 或直接指定正确编码即可解决。

**大文件务必 stream=True + iter_content**

下载几百 MB 以上的文件，一定 `stream=True` 并用 `iter_content` 分块写盘。一次性 `r.content` 会让内存峰值等于文件大小，在容器/小内存机器上直接 OOM。配合 `with` 语句保证连接释放。

**异常捕获分清"可重试"和"不可重试"**

- 可重试：`ConnectionError`、`Timeout`、5xx（服务端临时故障）、429（限流）。
- 不可重试：4xx（非 429）——请求本身有错，重试一万次还是错。
盲目对所有异常重试，既浪费资源也掩盖了代码 bug。

**r.json() 前先确认 Content-Type**

虽然 `json()` 会尝试解析，但先看 `Content-Type` 能更早发现问题。若响应头是 `text/html`，基本不是 JSON，直接走错误分支，避免把一个 404 HTML 错误页喂给 `json()` 再失败一次。

**history 非空时留意"被重定向到了哪"**

爬虫和 API 调用里，`r.history` 非空说明被重定向过。检查 `r.url` 落地地址，确认没被重定向到登录页、错误页或意外域名；也要注意 POST 在 301/302 后可能被改成 GET，导致服务端没收到你的 body。

**elapsed 只算到响应头，别拿它当总耗时**

测接口延迟用 `elapsed` 没问题；但评估"用户实际等待时间"或"下载总耗时"时，要在客户端自己计 `time.time()`，包含响应体传输。

## 4. 原理

这一章拆解 `Response` 对象背后那些机制的运作方式，让你理解前面那些属性和方法"为什么这么设计、为什么这么用能生效"。

### 4.1 HTTP 响应的结构

理解 `Response` 各属性，要先看 HTTP 响应本身的物理结构。一个 HTTP 响应由三部分组成：

```
HTTP/1.1 200 OK\r\n            <- 状态行：协议版本 + 状态码 + 原因短语
Content-Type: application/json\r\n   <- 响应头（多行，每行一个头）
Content-Length: 1234\r\n
Set-Cookie: sid=abc; Path=/\r\n
\r\n                           <- 空行，分隔头和体
{"key": "value"}              <- 响应体（任意字节）
```

- 状态行：第一行，包含协议版本（HTTP/1.1）、状态码（200）、原因短语（OK）。`response.status_code` 就来自这里的状态码字段。`response.reason` 是原因短语（如 "OK"、"Not Found"）。
- 响应头：空行之前的所有行，每行 `名: 值`。`requests` 把它们解析进 `response.headers`。
- 空行：`\r\n\r\n`，标志头部结束、体开始。
- 响应体：空行之后的全部字节。`response.content` 就是这部分原始字节。

`requests` 的底层（`urllib3`）读取响应时，先把状态行和头部读到 `\r\n\r\n` 为止，解析出状态码和 headers；响应体则按需读取——不开 `stream` 时一次性读完存进 `content`，开了 `stream` 时保留一个可读的文件对象，等你调 `iter_content`。

### 4.2 status_code 的来源

`status_code` 是一个整数属性，是怎么从原始字节变成我们看到的 `200`/`404` 的？过程大致是：

1. `urllib3` 从 socket 读到响应的第一行（状态行）。
2. 状态行形如 `HTTP/1.1 200 OK`，按空格拆分，第二段 `200` 就是状态码字符串。
3. `int("200")` 得到整数 200，赋给 `response.status_code`。
4. 第三段 `OK` 作为 `response.reason`。

因为这个来源，`status_code` 一定是 100~599 的整数（规范范围内）。`raise_for_status()` 判断的就是这个整数：`if 400 <= self.status_code < 600` 就构造一个 `HTTPError` 抛出，异常对象里挂上 `response` 引用，所以 `except HTTPError as e` 里可以用 `e.response.status_code` 拿到具体状态码。

`ok` 属性更简单：`return self.status_code < 400`，一个布尔判断。

### 4.3 text 如何用 encoding 解 content

`text` 是一个 property，每次访问时（在未缓存的情况下）执行解码：

```
response.text = response.content.decode(response.encoding, errors="replace")
```

也就是：拿原始字节 `content`，用 `encoding` 指定的编码，按"遇到无法解码的字节就替换"的策略，解码成 `str`。所以同样的 `content`，`encoding` 设不同值，`text` 就不同。

`encoding` 的取值优先级，第 2.4 节已说过：响应头 charset → HTML meta charset → `ISO-8859-1` 默认值。这个默认值来自 HTTP/1.1 规范 RFC 7230 的历史规定：当 `Content-Type` 是 `text/*` 且未指定 charset 时，默认 `ISO-8859-1`。这个规定在纯英文时代没问题，但中文站点一旦不显式声明 charset，就会被默认成 Latin-1，解码出乱码。这也是为什么"中文乱码先查 encoding"是必修课。

`apparent_encoding` 走的是另一条路：它调用 `chardet.detect(response.content)`，用统计学方法分析字节分布（字节频率、双字节组合模式等），返回一个"最可能的编码"。检测是启发式的，多数情况下准，但对短文本、纯 ASCII、混合编码可能误判。所以 `apparent_encoding` 是"兜底"而非"首选"——有明确 charset 时应优先用它。

### 4.4 json() 的内部实现

`response.json()` 的核心等价于：

```python
import json
return json.loads(self.text)
```

也就是说它分两步：先把 `content` 按 `encoding` 解码成 `text`（一个 `str`），再把这个字符串交给 `json.loads` 解析成 Python 对象。这就解释了几个现象：

- 编码错 → `text` 乱码 → `json.loads` 解析失败 → 抛 `JSONDecodeError`。修 `encoding` 即可修 `json()`。
- 响应体是 HTML 错误页 → 第一个字符是 `<` 不是 `{` 或 `[` → `json.loads` 立刻报 `Expecting value: line 1 column 1`。
- 响应体是空字符串 → `json.loads("")` 同样报 `Expecting value`。

较新版本的 `requests` 还支持传 `json()` 的 `**kwargs` 透传给 `json.loads`，比如 `r.json(parse_float=Decimal)` 用自定义方式解析浮点数。这进一步印证 `json()` 就是 `loads` 的薄封装。

### 4.5 headers 的 CaseInsensitiveDict

普通 `dict` 用哈希表存键，键的哈希基于键本身的值，`"Content-Type"` 和 `"content-type"` 哈希不同，所以是两个不同的键。`CaseInsensitiveDict` 的做法是在存取时对键统一做 `.lower()`：

- 存：`data[key.lower()] = value`，但额外保留原始键用于显示（`items()` 时回显原大小写）。
- 取：`data[key.lower()]`，所以无论你传什么大小写，底层查的都是小写键。

这样既保证了 `r.headers["Content-Type"]` 和 `r.headers["content-type"]` 指向同一个值，又能在遍历时显示成服务器原始的大小写形式。它的代价是每次存取多一次 `lower()` 调用，对头部这种小规模数据可以忽略不计。

这个设计直接映射了 HTTP 规范：RFC 7230 规定字段名大小写不敏感。`requests` 用数据结构把规范内化了，使用者就不必自己处理大小写。

### 4.6 iter_content 的流式分块机制

不开 `stream` 时，`requests`（底层 `urllib3`）在拿到响应头后会一次性 `read()` 整个响应体存进 `response._content`，`content`/`text`/`json()` 都直接读这个内存副本。

开 `stream=True` 时，`urllib3` 不再主动读完响应体，而是把底层 socket 的文件对象挂在 `response.raw` 上。`iter_content(chunk_size)` 的工作流程就成了：

1. 调用 `response.raw.read(chunk_size)`，从 socket 读最多 `chunk_size` 字节。
2. 如果响应是 gzip/deflate/br 压缩的，这一步还包含解压（`urllib3` 会按 `Content-Encoding` 自动解压，解压后的字节再交给 `chunk_size` 切分）。
3. yield 这块字节给上层。
4. 重复直到 read 返回空（EOF），生成器结束。

因为每次只在内存里保留一块，所以处理几个 GB 的文件时，内存占用仍是几十 KB 级别。这也是为什么"大文件必须 stream"——不是流式更块，而是非流式会把整个文件灌进内存。

`iter_lines` 在 `iter_content` 基础上再加一层：它用一个内部缓冲区累积字节，遇到行分隔符（`\n` 或 `\r\n`）就把缓冲区里已累积的内容作为一行 yield 出去，剩余字节留在缓冲区等下一块。所以 `iter_lines` 的"行"可能跨越多个网络包，它的实时性取决于缓冲策略。

一个重要的副作用：`stream=True` 时，`Response` 对象持有底层连接，不关闭的话连接不会归还连接池。`with requests.get(...) as r:` 利用 `Response.__exit__` 调用 `close()` 释放连接，是流式读取的标准写法。`urllib3` 的连接池有上限（默认每个 host 10 个连接），泄漏连接会在高并发时表现为"卡住等连接"。

### 4.7 异常如何对应失败阶段

`requests` 的异常体系是按"请求失败发生在哪个阶段"设计的：

- 连接阶段：DNS 解析 → TCP 三次握手 → （HTTPS）TLS 握手。任一步失败抛 `ConnectionError`（DNS 失败、拒绝连接、连接重置），TLS 失败抛 `SSLError`（继承自 `ConnectionError`）。这一阶段的超时抛 `ConnectTimeout`。
- 读取阶段：连接已建立，等待响应头或响应体。超时抛 `ReadTimeout`。`ConnectTimeout` 和 `ReadTimeout` 共同继承 `Timeout`，所以捕 `Timeout` 能兜住两者。
- 响应阶段：响应已收到，但状态码是 4xx/5xx。此时不会自动抛异常（因为 HTTP 层面请求"成功了"），需要手动 `raise_for_status()` 触发 `HTTPError`。
- 解析阶段：响应体不是合法 JSON，`json()` 抛 `JSONDecodeError`。

`RequestException` 是这棵树的根，所有 `requests` 抛出的异常都继承自它。所以最外层 `except RequestException` 能兜住一切 requests 相关异常——但兜不住你自己的业务 bug（那是 `ValueError`/`KeyError` 之类），所以不要用它替代正常的业务校验。

`raise_for_status()` 的实现非常简洁：它根据 `status_code` 决定是否抛异常，构造 `HTTPError` 时把 `response=self` 传进去，所以异常对象自带响应引用，捕获方可以直接 `e.response.status_code`/`e.response.text` 取现场信息——这比单纯抛一个字符串有用得多，对日志和重试判断都很友好。

`TooManyRedirects` 发生在重定向阶段：`requests` 每跟随一次重定向就往 `history` 里加一个 `Response`，并比对 `max_redirects`（默认 30），超过就抛 `TooManyRedirects`，把当前已经跟随的 `history` 也保留下来，方便排查是不是环路（A→B→A→B...）。

## 5. 总结

本篇围绕 `requests.models.Response` 对象，系统讲解了如何全面处理 HTTP 响应。

**内容要点**

- `status_code` 按首位分 2xx 成功 / 3xx 重定向 / 4xx 客户端错 / 5xx 服务端错；`ok` 判断 `< 400`，`raise_for_status()` 把 4xx/5xx 变成 `HTTPError`。
- `content` 取原始字节（二进制必用），`text` 取按 `encoding` 解码后的字符串；`encoding` 来自响应头 charset 或默认 `ISO-8859-1`，乱码时用 `apparent_encoding` 或手动指定修正。
- `json()` 等价 `json.loads(r.text)`，响应不是合法 JSON 时抛 `JSONDecodeError`；`encoding` 错会导致 `json()` 间接失败。
- `headers` 是 `CaseInsensitiveDict`，键大小写不敏感；`cookies` 是 `RequestsCookieJar`，可传递到下次请求维持会话。
- `url` 是重定向后的最终地址，`history` 是中间 3xx 响应列表，`elapsed` 是到响应头的耗时（不含响应体传输）。
- 大响应用 `stream=True` 配合 `iter_content(chunk_size)` 分块读、`iter_lines()` 按行读，避免一次性进内存；务必用 `with` 关闭连接。
- 异常体系按失败阶段分：连接/超时阶段抛 `ConnectionError`/`Timeout`（可重试），响应阶段靠 `raise_for_status()` 抛 `HTTPError`（4xx 非限流不可重试，5xx 可重试），解析阶段抛 `JSONDecodeError`；`RequestException` 是总基类兜底。

**读完本文你应能掌握**

- 看到任意状态码能说明它属于哪一类、责任在客户端还是服务端、是否值得重试。
- 根据响应类型正确选用 `content`/`text`/`json()`，遇到乱码能定位到 `encoding` 并修正。
- 读懂 `headers`/`cookies`/`url`/`history`/`elapsed` 各自含义，并在重定向追踪、限流退避、延迟监控等场景中正确使用。
- 用 `stream=True`+`iter_content` 流式下载大文件而不撑爆内存，并理解为什么要用 `with` 关闭连接。
- 写出一个带状态码判断、按异常类型分级重试、限流退避、最终兜底的健壮请求函数，并说明每个 except 分支捕获的是哪个失败阶段。