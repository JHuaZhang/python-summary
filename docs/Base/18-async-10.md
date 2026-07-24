---
group:
  title: 【18】异步协程
  order: 18
order: 10
title: aiohttp 异步 HTTP 请求
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 异步程序里为什么不能直接用 requests

`requests` 是 Python 里最流行的 HTTP 客户端库，简单好用，绝大多数同步代码里发请求都靠它。但它是**同步阻塞**库——调用 `requests.get(url)` 时，当前线程会一直卡在底层的阻塞 socket 读写上，直到响应完全返回或超时，期间什么都干不了。

在普通的同步程序里，"卡一会儿"不是问题，反正这个线程本来就只做这一件事。但在 `asyncio` 异步程序里这是灾难：事件循环（event loop）运行在单一线程里，所有协程都靠这个线程轮流驱动。一旦某个协程调用了 `requests.get`，在它返回之前，整个事件循环被冻结——网络心跳协程发不出包、定时任务到点跑不了、其它协程全部停滞。一个"发个 HTTP 请求"的操作，就把整个异步程序退化成同步程序。

```python
import asyncio
import time
import requests

async def blocking_request(url):
    # 错误示范：requests.get 是同步阻塞调用，写在 async def 里不会变异步
    # 在它返回之前，事件循环被钉死，其它协程得不到调度
    resp = requests.get(url, timeout=5)
    return resp.status_code

async def tick():
    # 每 0.2 秒打印一次的心跳协程，用来观察事件循环是否被卡住
    for i in range(8):
        print(f'心跳 {i} {time.strftime("%H:%M:%S")}')
        await asyncio.sleep(0.2)

async def main():
    t1 = asyncio.create_task(tick())
    await asyncio.sleep(0.3)                       # 让心跳先跑起来
    code = await blocking_request('https://httpbin.org/delay/2')  # 模拟慢响应
    print('状态码：', code)
    await asyncio.sleep(0.3)
    t1.cancel()

# asyncio.run(main())
# 输出（请求期间心跳沉默约 2 秒，事件循环被卡）：
# 心跳 0 14:10:01
# 心跳 1 14:10:01
# 状态码： 200
# 心跳 2 14:10:03        <-- 这一下比预期晚了近 2 秒
# 心跳 3 14:10:03
# ...
```

问题不在于 `requests` 写得不好，而在于它的设计假设是"一个线程一个请求"——调用线程阻塞等待响应天经地义。`async def` 关键字只赋予函数"可以被 `await`"的能力，并不会把函数体内的阻塞调用变成非阻塞。所以 `requests.get` 写在 `async def` 里依然是阻塞的，只是多了一层没用的协程包装。

`aiohttp` 就是为解决这个问题而生的第三方库。它基于 `asyncio`，提供了一套完整的异步 HTTP 客户端（同时也提供异步服务端，但本篇只讲客户端）。核心用法是 `async with session.get(url) as resp: data = await resp.text()`——每一次 `await` 都是真正的"让出事件循环"，在底层 socket 数据没就绪时立即挂起协程，事件循环去跑别的协程；数据就绪后再回来继续。这样单线程内可以同时挂起成百上千个 HTTP 请求，互不阻塞。

**一句话定位**：aiohttp 是 asyncio 生态下的事实标准 HTTP 客户端，用非阻塞 socket + 事件循环驱动，让"并发发大量 HTTP 请求"在单线程内成为可能，不再像 requests 那样卡住事件循环。

### 1.2 aiohttp 的安装与最小用法

安装：

```bash
pip install aiohttp
```

最小可运行示例——异步发起一个 GET 请求并读取响应文本：

```python
import asyncio
import aiohttp

async def main():
    # ClientSession 是整个客户端的入口，内部维护连接池
    # 整个应用应复用同一个 session，这里最小示例先建一个
    async with aiohttp.ClientSession() as session:
        # session.get 返回一个可异步上下文管理的响应对象
        async with session.get('https://httpbin.org/get') as resp:
            print('状态码：', resp.status)        # int，如 200
            print('内容类型：', resp.headers['Content-Type'])
            text = await resp.text()              # 异步读取响应体为 str
            print('前 60 字符：', text[:60])

asyncio.run(main())
# 输出：
# 状态码： 200
# 内容类型： application/json
# 前 60 字符： {
#   "args": {},
#   "headers": {
#     "Accept": "*/*",
#     "Accept-Encoding
```

这段代码和 `requests.get` 长得有点像，但行为本质不同：`session.get` 不会阻塞线程直到响应返回，它只是发起请求并返回一个响应对象；真正的"等数据"发生在 `await resp.text()` 这一步——此时如果响应体还没到，协程挂起，事件循环自由。这就是 aiohttp 的全部门面：用 `async`/`await` 包装 HTTP 交互，使其融入 asyncio 事件循环。

## 2. 核心内容

### 2.1 ClientSession —— 复用连接池的会话

`aiohttp.ClientSession` 是异步 HTTP 客户端的核心对象。它不仅仅是一个"发请求的工具"，更重要的是它**内部维护了一个连接池**：每个 session 会缓存到各个主机的 TCP 连接（含 Keep-Alive 连接），后续请求如果命中同一主机，就直接复用已建立的连接，省掉 TCP 三次握手和 TLS 握手的开销。

**为什么连接池复用如此重要**

一次 HTTP 请求的网络成本不仅是"传数据"，建立连接本身就很贵：TCP 三次握手要一个 RTT，HTTPS 还要 TLS 握手又要 1~2 个 RTT。如果对同一主机连续发 10 个请求，每次都重新建连，光握手就花掉十几倍的时间；而复用连接则只有第一次需要握手，后面 9 个请求直接走已建立的连接。在并发抓取同一站点多页面的场景里，复用连接的收益非常显著。

`ClientSession` 的常用构造参数：

| 参数 | 含义 | 常用取值 |
|------|------|----------|
| `base_url` | 基础 URL，后续请求的相对路径会拼到它后面 | `'https://api.example.com'` |
| `timeout` | 默认超时配置，是一个 `ClientTimeout` 对象 | `aiohttp.ClientTimeout(total=30)` |
| `headers` | 对该 session 下所有请求生效的默认请求头 | `{'User-Agent': 'myapp/1.0'}` |
| `cookies` | 默认携带的 cookies | `{'session_id': 'abc'}` |
| `auth` | 默认认证信息 | `aiohttp.BasicAuth('user', 'pass')` |
| `connector` | 自定义连接器（控制连接池大小、是否限制等） | `aiohttp.TCPConnector(limit=100)` |
| `raise_for_status` | 是否对所有非 2xx 响应自动抛异常 | `False`（默认）/`True` |

**最小 demo：用 base_url 复用 session 发多个请求**

```python
import asyncio
import aiohttp

async def main():
    # base_url 让后续请求只需写路径
    async with aiohttp.ClientSession(base_url='https://httpbin.org') as session:
        # 三个请求复用同一个 session（同一连接池），到同一主机的连接被复用
        async with session.get('/get') as resp:
            print('/get 状态：', resp.status)
        async with session.get('/headers') as resp:
            print('/headers 状态：', resp.status)
        async with session.get('/ip') as resp:
            print('/ip 状态：', resp.status)

asyncio.run(main())
# 输出：
# /get 状态： 200
# /headers 状态： 200
# /ip 状态： 200
```

**一个应用一个 session**

这是 aiohttp 最重要的使用原则之一。`ClientSession` 设计为长期复用，不要每次请求都新建。每次新建 session 不仅浪费连接池（建好的连接没机会复用就被关闭），还会带来显著的性能损失。

推荐写法 vs 不推荐写法：

```python
import asyncio
import aiohttp

# 推荐：整个应用复用一个 session
async def good_fetch_all(urls):
    async with aiohttp.ClientSession() as session:   # 只建一次
        results = []
        for url in urls:
            async with session.get(url) as resp:     # 复用连接
                results.append(await resp.text())
        return results

# 不推荐：每次请求新建 session，连接池形同虚设
async def bad_fetch_all(urls):
    results = []
    for url in urls:
        async with aiohttp.ClientSession() as session:  # 每次都新建+关闭
            async with session.get(url) as resp:
                results.append(await resp.text())
    return results
```

`bad_fetch_all` 的问题在于：每个请求都建一个新 session，新 session 意味着新连接池，连接还没攒下来就被关掉了，复用完全失效。在后面并发对比里会看到，复用 session 的并发请求快得多。

### 2.2 发起请求与读取响应

aiohttp 客户端的核心交互模式是一个"双层 async with"：

```python
async with aiohttp.ClientSession() as session:
    async with session.get(url) as resp:
        data = await resp.text()
```

外层 `async with ClientSession()` 管理 session 的生命周期（退出时关闭连接池）；内层 `async with session.get(url)` 管理单个响应的连接（退出时把连接归还连接池）。这两层 `async with` 都不能省——省了会导致连接泄漏。

**请求方法**

`ClientSession` 提供与 HTTP 方法同名的方法，每个都返回一个可作为异步上下文管理的响应对象：

```python
session.get(url, **kwargs)
session.post(url, **kwargs)
session.put(url, **kwargs)
session.delete(url, **kwargs)
session.patch(url, **kwargs)
session.head(url, **kwargs)
session.options(url, **kwargs)
```

这些方法的第一个参数 `url` 可以是 `str` 或 `yarl.URL` 对象（aiohttp 依赖 `yarl` 库处理 URL）。如果 session 构造时传了 `base_url`，这里的 url 可以是相对路径。

**请求常用参数**

| 参数 | 含义 |
|------|------|
| `params` | URL 查询参数，dict 或 list of tuples，自动做 URL 编码 |
| `headers` | 请求头 dict，会与 session 级 headers 合并 |
| `cookies` | 本次请求额外携带的 cookies |
| `data` | 请求体，dict（表单）、bytes、str、file-like 对象 |
| `json` | 请求体，Python 对象，会自动 `json.dumps` 并设 `Content-Type: application/json` |
| `timeout` | 本次请求的超时配置，覆盖 session 级默认 |
| `allow_redirects` | 是否自动跟随重定向，默认 `True` |
| `ssl` | SSL 验证配置，`True`（默认验证）/`False`（不验证）/SSLContext |
| `proxy` | 代理地址 |

**响应对象 ClientResponse 的常用属性与方法**

| 属性 / 方法 | 含义 |
|------------|------|
| `resp.status` | HTTP 状态码，`int`（如 200、404） |
| `resp.reason` | 状态码文字说明（如 `'OK'`、`'Not Found'`） |
| `resp.headers` | 响应头，类 dict 的 `CIMultiDictProxy`，大小写不敏感 |
| `resp.cookies` | 响应里的 cookies，`SimpleCookie` 对象 |
| `await resp.text(encoding=None, errors='strict')` | 读取响应体为 `str`，自动按 charset 解码 |
| `await resp.json(content_type=None)` | 读取并 `json.loads` 响应体为 Python 对象 |
| `await resp.read()` | 读取响应体为 `bytes` |
| `resp.raise_for_status()` | 状态码非 2xx 时抛 `ClientResponseError` |
| `resp.url` | 最终请求 URL（可能经过重定向） |
| `resp.content` | 流式响应体（`StreamReader`），支持分块读 |

**读取响应体的三种方式**

`text()`、`json()`、`read()` 是读取响应体的三个主要方法，它们互斥——响应体只能读一次，因为底层是流。选哪种取决于你要的数据形态：

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        # 方式一：resp.text() —— 拿到 str，适合 HTML、纯文本
        async with session.get('https://httpbin.org/html') as resp:
            html = await resp.text()
            print('text 长度：', len(html))

        # 方式二：resp.json() —— 拿到解析后的 dict/list，适合 JSON API
        async with session.get('https://httpbin.org/json') as resp:
            data = await resp.json()
            print('json 键：', list(data.keys()))

        # 方式三：resp.read() —— 拿到 bytes，适合图片、压缩包等二进制
        async with session.get('https://httpbin.org/image/png') as resp:
            raw = await resp.read()
            print('bytes 长度：', len(raw))

asyncio.run(main())
# 输出：
# text 长度： 374
# json 键： ['slideshow']
# bytes 长度： 8090
```

`resp.json()` 默认会检查响应头 `Content-Type` 是否为 `application/json`，不是的话抛错。如果接口确实返回 JSON 但 Content-Type 不规范，传 `content_type=None` 关闭检查：`await resp.json(content_type=None)`。

`resp.text()` 不传 encoding 时按响应头里的 charset 解码，没有 charset 时按 UTF-8。明确知道编码时可以显式传：`await resp.text(encoding='gbk')`。

**URL 查询参数 params**

`params` 接收 dict，aiohttp 会自动做 URL 编码拼接，不需要自己拼 `?key=value`：

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        # params 会拼成 https://httpbin.org/get?foo=bar&baz=qux
        async with session.get(
            'https://httpbin.org/get',
            params={'foo': 'bar', 'baz': 'qux'}
        ) as resp:
            data = await resp.json()
            print('服务端收到的查询参数：', data['args'])

asyncio.run(main())
# 输出：
# 服务端收到的查询参数： {'baz': 'qux', 'foo': 'bar'}
```

参数值含特殊字符（空格、中文、`&` 等）时，aiohttp 会自动做百分号编码，无需手动 `urllib.parse.urlencode`：

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get(
            'https://httpbin.org/get',
            params={'q': 'Python 异步', 'page': 1}
        ) as resp:
            print('最终 URL：', resp.url)
            data = await resp.json()
            print('服务端解码后：', data['args'])

asyncio.run(main())
# 输出：
# 最终 URL： https://httpbin.org/get?q=Python+%E5%BC%82%E6%AD%A5&page=1
# 服务端解码后： {'q': 'Python 异步', 'page': '1'}
```

注意 `page` 传的是 `int`，服务端拿到的是字符串 `'1'`——URL 查询参数本质上都是字符串。

### 2.3 POST、JSON、表单、headers 与 cookies

**POST JSON —— 最常见的 API 交互**

现代 Web API 几乎都用 JSON 交换数据。aiohttp 的 `json=` 参数让 POST JSON 变得直接：

```python
import asyncio
import aiohttp

async def main():
    payload = {'username': 'alice', 'age': 28, 'tags': ['py', 'async']}
    async with aiohttp.ClientSession() as session:
        # json= 会自动 json.dumps 并设 Content-Type: application/json
        async with session.post('https://httpbin.org/post', json=payload) as resp:
            data = await resp.json()
            # httpbin.org/post 会回显我们发的数据
            print('服务端收到的 JSON：', data['json'])

asyncio.run(main())
# 输出：
# 服务端收到的 JSON： {'username': 'alice', 'age': 28, 'tags': ['py', 'async']}
```

`json=` 等价于手动 `data=json.dumps(payload).encode()` + `headers={'Content-Type': 'application/json'}`，但更简洁、不易出错。

**POST 表单 —— data 传 dict**

如果要提交传统的 HTML 表单（`application/x-www-form-urlencoded`），用 `data=` 传 dict：

```python
import asyncio
import aiohttp

async def main():
    form = {'grant_type': 'password', 'username': 'alice', 'password': 'secret'}
    async with aiohttp.ClientSession() as session:
        async with session.post('https://httpbin.org/post', data=form) as resp:
            data = await resp.json()
            print('服务端收到的表单：', data['form'])
            print('请求头 Content-Type：', data['headers'].get('Content-Type'))

asyncio.run(main())
# 输出：
# 服务端收到的表单： {'grant_type': 'password', 'username': 'alice', 'password': 'secret'}
# 请求头 Content-Type： application/x-www-form-urlencoded
```

`data=` 传 dict 时 aiohttp 自动按表单编码并设对应 Content-Type。传 `bytes`/`str` 时则原样作为请求体，Content-Type 需自己设。

**POST 原始字节 —— data 传 bytes/str**

```python
import asyncio
import aiohttp

async def main():
    raw_xml = b'<?xml version="1.0"?><request><id>42</id></request>'
    headers = {'Content-Type': 'application/xml'}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            'https://httpbin.org/post',
            data=raw_xml,
            headers=headers,
        ) as resp:
            data = await resp.json()
            print('服务端收到的原始数据：', data['data'])

asyncio.run(main())
# 输出：
# 服务端收到的原始数据： <?xml version="1.0"?><request><id>42</id></request>
```

**自定义 headers**

`headers=` 设置本次请求头，会与 session 级 headers 合并（本次覆盖同名）。最常见用途是设 `User-Agent`（很多接口会挡默认 UA）、`Authorization`、`Accept` 等：

```python
import asyncio
import aiohttp

async def main():
    headers = {
        'User-Agent': 'myapp/1.0 (contact@example.com)',
        'Authorization': 'Bearer fake-token-abc',
        'Accept': 'application/json',
    }
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/headers', headers=headers) as resp:
            data = await resp.json()
            print('服务端收到的请求头：')
            for k, v in data['headers'].items():
                print(f'  {k}: {v}')

asyncio.run(main())
# 输出：
# 服务端收到的请求头：
#   Accept: application/json
#   Authorization: Bearer fake-token-abc
#   Host: httpbin.org
#   User-Agent: myapp/1.0 (contact@example.com)
#   ...
```

如果一批请求都要带同一组 headers（比如 token），可以放在 session 级别，避免每次都传：

```python
async def main():
    headers = {'Authorization': 'Bearer token-xyz', 'User-Agent': 'myapp/1.0'}
    async with aiohttp.ClientSession(headers=headers) as session:
        # 这两个请求都会带上面两个头
        async with session.get('https://httpbin.org/headers') as resp:
            print(resp.status)
        async with session.get('https://httpbin.org/anything') as resp:
            print(resp.status)
```

**cookies**

`cookies=` 设置本次请求携带的 cookies。session 级别也可以设。注意 aiohttp 默认会把响应里 `Set-Cookie` 的 cookie 存进 session 的 cookie jar，后续请求自动携带——这点和 requests 行为一致。

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        # 先访问一个会 Set-Cookie 的端点
        async with session.get('https://httpbin.org/cookies/set?token=abc123') as resp:
            pass  # cookie 已被 session 的 cookie jar 保存

        # 再访问 cookies 端点，session 会自动带上刚才的 cookie
        async with session.get('https://httpbin.org/cookies') as resp:
            data = await resp.json()
            print('自动携带的 cookies：', data['cookies'])

asyncio.run(main())
# 输出：
# 自动携带的 cookies： {'token': 'abc123'}
```

如果不想让 session 自动存 cookie（比如做无状态爬虫），可以构造 session 时传一个禁用的 cookie jar：

```python
async with aiohttp.ClientSession(
    cookie_jar=aiohttp.DummyCookieJar()
) as session:
    ...
```

### 2.4 并发请求 —— asyncio.gather

aiohttp 的真正威力在于并发。单个请求的 `await resp.text()` 看起来和 `requests.get` 差不多，但当你要抓 100 个 URL 时，requests 只能一个接一个串行（每个都要等响应回来才能发下一个），aiohttp 可以把这 100 个请求同时挂起在事件循环里，总耗时近似等于最慢的那一个，而不是全部累加。

**串行 vs 并发对比**

```python
import asyncio
import aiohttp
import time

URLS = [
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
]

async def fetch_one(session, url):
    async with session.get(url) as resp:
        return resp.status

async def fetch_serial(urls):
    # 串行：一个接一个，总耗时 = 累加
    async with aiohttp.ClientSession() as session:
        results = []
        for url in urls:
            results.append(await fetch_one(session, url))
        return results

async def fetch_concurrent(urls):
    # 并发：全部同时挂起，总耗时 ≈ 最慢一个
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def main():
    t0 = time.perf_counter()
    print('串行结果：', await fetch_serial(URLS))
    print(f'串行耗时：{time.perf_counter() - t0:.2f}s')

    t0 = time.perf_counter()
    print('并发结果：', await fetch_concurrent(URLS))
    print(f'并发耗时：{time.perf_counter() - t0:.2f}s')

asyncio.run(main())
# 输出：
# 串行结果： [200, 200, 200, 200, 200]
# 串行耗时：5.13s
# 并发结果： [200, 200, 200, 200, 200]
# 并发耗时：1.04s
```

5 个各延迟 1 秒的请求，串行要 5 秒，并发只要约 1 秒——因为 5 个请求几乎同时发出，事件循环在它们各自的 socket 数据没就绪时切换，谁先就绪先处理谁，最后一起完成。这就是异步并发的收益。

**并发抓取多 URL 的实用模式**

```python
import asyncio
import aiohttp

async def fetch_title(session, url):
    # 抓取一个页面的 <title>（简化版，不做完整 HTML 解析）
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
        text = await resp.text()
        start = text.find('<title>')
        end = text.find('</title>')
        if start != -1 and end != -1:
            return url, text[start + 7:end]
        return url, '(无 title)'

async def main():
    urls = [
        'https://example.com',
        'https://www.python.org',
        'https://httpbin.org',
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_title(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for item in results:
            if isinstance(item, Exception):
                print('某请求失败：', repr(item))
            else:
                url, title = item
                print(f'{url} -> {title}')

asyncio.run(main())
# 输出：
# https://example.com -> Example Domain
# https://www.python.org -> Welcome to Python.org
# https://httpbin.org -> httpbin.org
```

注意两个细节：一是 `asyncio.gather(*tasks)` 把多个协程包装成 Task 并发执行；二是 `return_exceptions=True` 让某个请求失败时不会让整个 gather 抛错，而是把异常对象作为结果返回，便于逐个处理。

**限制并发数 —— Semaphore**

并发 5 个请求没问题，并发 5000 个就有问题了：本地端口可能不够、对方服务器可能直接封你、单机内存可能被大量挂起的响应体撑爆。生产环境几乎总是要用 `asyncio.Semaphore` 限制同时进行的请求数。

```python
import asyncio
import aiohttp

URLS = [f'https://httpbin.org/delay/1?i={i}' for i in range(20)]

async def fetch_one(session, sem, url):
    # 信号量保证同一时刻最多 N 个请求在飞
    async with sem:
        async with session.get(url) as resp:
            return resp.status

async def main():
    sem = asyncio.Semaphore(5)        # 同时最多 5 个请求
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, sem, url) for url in URLS]
        results = await asyncio.gather(*tasks)
        print('全部完成，状态码集合：', set(results))

asyncio.run(main())
# 输出：
# 全部完成，状态码集合： {200}
```

Semaphore 的 `async with` 会"占一个名额"，离开时归还。超过名额的协程会在这行挂起，等前面有人归还才继续。这样 20 个请求被切成 4 批，每批 5 个并发，既享受并发收益又不会压垮双方。

### 2.5 超时配置 ClientTimeout

网络请求永远要考虑超时——服务器可能卡住、网络可能中断、对方可能永远不响应。aiohttp 的超时通过 `aiohttp.ClientTimeout` 配置，可以精细控制不同阶段的超时。

**ClientTimeout 的参数**

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `total` | 整个请求（含连接+读取）的总超时，5 分钟 | 300 |
| `connect` | 连接建立（TCP+TLS 握手）超时 | None（不限） |
| `sock_connect` | 单次连接尝试超时 | None |
| `sock_read` | 两次 socket 读之间的超时（数据多久没来算超时） | None |
| `ceil_threshold` | total 的取整阈值 | 5 |

最常用的是 `total`——整个请求最多花多久。`sock_read` 在流式响应里很有用：数据应该持续流来，如果某次读之后很久没新数据，说明对方卡住了，应超时断开。

**在 session 级别设默认超时**

```python
import asyncio
import aiohttp

async def main():
    timeout = aiohttp.ClientTimeout(total=10)   # 整个请求最多 10 秒
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get('https://httpbin.org/delay/5') as resp:
            print('状态：', resp.status)

asyncio.run(main())
# 输出：
# 状态： 200
```

**单次请求覆盖超时**

```python
import asyncio
import aiohttp

async def main():
    # session 默认 30 秒
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
        # 这次请求单独放宽到 60 秒（比如知道对方是个慢接口）
        async with session.get(
            'https://httpbin.org/delay/3',
            timeout=aiohttp.ClientTimeout(total=60),
        ) as resp:
            print('状态：', resp.status)
        # 这次请求收紧到 1 秒（故意触发超时）
        try:
            async with session.get(
                'https://httpbin.org/delay/3',
                timeout=aiohttp.ClientTimeout(total=1),
            ) as resp:
                print('不会走到这里')
        except asyncio.TimeoutError:
            print('1 秒超时，触发')

asyncio.run(main())
# 输出：
# 状态： 200
# 1 秒超时，触发
```

注意 aiohttp 超时抛的是 `asyncio.TimeoutError`（Python 3.11+ 等同于内置 `TimeoutError`），这是最外层捕获的异常类型。

**区分连接超时与读取超时**

```python
import asyncio
import aiohttp

async def main():
    # connect=2 限制建连，sock_read=2 限制读，total=10 兜底
    timeout = aiohttp.ClientTimeout(total=10, connect=2, sock_read=2)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            # delay/5 让服务器 5 秒后才返回，超过 sock_read 会触发
            async with session.get('https://httpbin.org/delay/5') as resp:
                print(await resp.text())
        except asyncio.TimeoutError as e:
            print('触发超时（多半是 sock_read）：', type(e).__name__)

asyncio.run(main())
# 输出：
# 触发超时（多半是 sock_read）： TimeoutError
```

`sock_read` 的语义不是"读完响应体最多多久"，而是"一次 socket 读之后，多久没新数据算超时"。对正常快响应，数据哗一下就到了，远低于 `sock_read`；对故意拖延的响应，数据迟迟不来就触发。

### 2.6 异常处理与 raise_for_status

**非 2xx 默认不抛**

aiohttp 默认和 requests 一样，HTTP 状态码非 2xx（如 404、500）不会自动抛异常，`resp.status` 会如实反映状态码。这给业务逻辑留了灵活判断空间——你可能想对 404 做一种处理、对 500 做另一种，而不是一概捕获异常。

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        # 访问不存在的路径，返回 404
        async with session.get('https://httpbin.org/status/404') as resp:
            print('状态码：', resp.status)
            if resp.status == 404:
                print('页面不存在，走 404 逻辑')
            else:
                print('其它情况')

asyncio.run(main())
# 输出：
# 状态码： 404
# 页面不存在，走 404 逻辑
```

**raise_for_status —— 主动让非 2xx 抛异常**

如果希望"任何非 2xx 都抛异常，用 try/except 统一处理"，调用 `resp.raise_for_status()`。状态码 4xx 抛 `ClientResponseError`（含 `status`、`message` 属性），5xx 也抛同类型异常。

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/status/500') as resp:
            try:
                resp.raise_for_status()
                print('不会走到这里')
            except aiohttp.ClientResponseError as e:
                print(f'HTTP 错误：status={e.status}, message={e.message}')

asyncio.run(main())
# 输出：
# HTTP 错误：status=500, message=INTERNAL SERVER ERROR
```

也可以在 session 级别设 `raise_for_status=True`，让所有响应自动调 `raise_for_status`：

```python
async with aiohttp.ClientSession(raise_for_status=True) as session:
    async with session.get('https://httpbin.org/status/403') as resp:
        ...  # 403 会在这里抛 ClientResponseError
```

**常见异常类型层次**

aiohttp 的异常都继承自 `aiohttp.ClientError`，捕获 `ClientError` 就能涵盖大部分请求层错误：

| 异常 | 触发场景 |
|------|---------|
| `ClientConnectionError` | 连接建立失败（DNS 解析失败、拒绝连接等） |
| `ClientOSError` | 底层 OS socket 错误（连接重置、网络不可达） |
| `ClientConnectorError` | 连接器层面错误（含 `ClientConnectorCertificateError` 等子类） |
| `ServerDisconnectedError` | 服务器在响应完成前断开连接 |
| `ClientResponseError` | 调用 `raise_for_status` 后非 2xx |
| `ClientPayloadError` | 响应体读取过程中连接断开或分块解码错误 |
| `asyncio.TimeoutError` | 超时（不继承自 `ClientError`，是 asyncio 层异常） |

**完整的异常处理模板**

```python
import asyncio
import aiohttp

async def safe_fetch(session, url):
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            resp.raise_for_status()                  # 把非 2xx 转成异常
            return await resp.text()
    except asyncio.TimeoutError:
        print(f'[超时] {url}')
    except aiohttp.ClientResponseError as e:
        print(f'[HTTP {e.status}] {url}: {e.message}')
    except aiohttp.ClientConnectionError:
        print(f'[连接失败] {url}')
    except aiohttp.ClientError as e:
        print(f'[其它客户端错误] {url}: {e!r}')
    return None

async def main():
    urls = [
        'https://httpbin.org/get',
        'https://httpbin.org/status/500',
        'https://httpbin.org/delay/10',
        'https://nonexistent-host-xyz.example',
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [safe_fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        for url, r in zip(urls, results):
            print(f'{url} -> {"成功" if r else "失败"}')

asyncio.run(main())
# 输出：
# [HTTP 500] https://httpbin.org/status/500: INTERNAL SERVER ERROR
# [超时] https://httpbin.org/delay/10
# [连接失败] https://nonexistent-host-xyz.example
# https://httpbin.org/get -> 成功
```

注意 `asyncio.TimeoutError` 不继承自 `aiohttp.ClientError`，所以它的 except 必须单独写，否则会被漏掉。这也是初学者容易踩的坑。

### 2.7 流式响应与分块读取

前面 `await resp.text()`/`read()`/`json()` 都是一次性把整个响应体读进内存。响应体很小时没问题，但下载大文件（图片、视频、压缩包）时一次性读会把几十 MB 甚至几 GB 数据全塞进内存。这时应该用流式读取——一次读一块，处理一块，内存占用恒定。

aiohttp 的响应体流是 `resp.content`（一个 `StreamReader`），它提供分块读取方法：

**`resp.content.read(n)` —— 读指定字节数**

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/bytes/1024') as resp:
            total = 0
            while True:
                # 每次最多读 256 字节，不足则返回实际读到的
                chunk = await resp.content.read(256)
                if not chunk:
                    break
                total += len(chunk)
            print('共读到字节：', total)

asyncio.run(main())
# 输出：
# 共读到字节： 1024
```

**`resp.content.iter_chunked(n)` —— 按固定大小迭代（推荐）**

这是最常用、最简洁的分块方式，每次迭代给出最多 n 字节：

```python
import asyncio
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://httpbin.org/bytes/4096') as resp:
            total = 0
            # async for 自动在每块之间让出事件循环
            async for chunk in resp.content.iter_chunked(1024):
                total += len(chunk)
                print(f'收到一块 {len(chunk)} 字节')
            print('共收到：', total)

asyncio.run(main())
# 输出：
# 收到一块 1024 字节
# 收到一块 1024 字节
# 收到一块 1024 字节
# 收到一块 1024 字节
# 共收到： 4096
```

`iter_chunked` 的每一块之间是 `await` 边界，事件循环可以在块之间切换到其它协程——这就是"边下边处理"的异步形态。

**`iter_any()` —— 有多少读多少**

不固定块大小，每次读"当前能读到的全部"：

```python
async for chunk in resp.content.iter_any():
    process(chunk)
```

适合"数据到达就处理、不刻意分块"的场景。

**`iter_chunks()` —— 读 + 元信息**

返回 `(data, end_of_http_chunk)` 元组，粒度更细，一般用 `iter_chunked` 就够了。

**结合 aiofiles 实现下载落盘**

流式读取最常见的工程场景：边下载边写文件，内存占用恒定。这里和 aiofiles 配合：

```python
import asyncio
import aiohttp
import aiofiles

async def download(session, url, save_path):
    async with session.get(url) as resp:
        resp.raise_for_status()
        async with aiofiles.open(save_path, 'wb') as f:
            async for chunk in resp.content.iter_chunked(64 * 1024):  # 64KB 块
                await f.write(chunk)
    return save_path

async def main():
    async with aiohttp.ClientSession() as session:
        path = await download(session, 'https://httpbin.org/image/png', '/tmp/dl.png')
        print('下载完成：', path)

asyncio.run(main())
# 输出：
# 下载完成： /tmp/dl.png
```

整个下载过程中，内存里始终只有 64KB 的当前块，无论文件多大都不会撑爆内存。网络读取（`resp.content`）和磁盘写入（`aiofiles.open`）都是异步的，互不阻塞事件循环。

### 2.8 Session 与连接池的配置进阶

`ClientSession` 内部用 `Connector` 管理连接池。默认是 `TCPConnector`，它控制连接池的关键参数。需要精细控制并发连接数、是否限制单主机、SSL、DNS 缓存等时，可以自定义 connector 传给 session。

**TCPConnector 常用参数**

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `limit` | 同时打开的连接总数上限 | 100 |
| `limit_per_host` | 单个主机同时打开的连接上限 | 0（不限，受 limit 总票限制） |
| `ssl` | 是否验证 SSL 证书 | `True` |
| `use_dns_cache` | 是否缓存 DNS 解析结果 | `True` |
| `ttl_dns_cache` | DNS 缓存有效期（秒） | 10 |
| `force_close` | 是否在响应结束后强制关闭连接（禁用 Keep-Alive） | `False` |
| `enable_cleanup_closed` | 是否清理已关闭的 SSL 连接 | `False` |

**限制单主机连接数**

抓取同一站点的多页面时，`limit_per_host` 比 Semaphore 更底层——它直接控制连接池到单个主机的同时连接数，避免被对方封 IP：

```python
import asyncio
import aiohttp

async def main():
    conn = aiohttp.TCPConnector(limit=100, limit_per_host=10)  # 单主机最多 10 连接
    async with aiohttp.ClientSession(connector=conn) as session:
        urls = [f'https://httpbin.org/delay/1?i={i}' for i in range(30)]
        tasks = [session.get(url) for url in urls]
        # 这里仅演示，实际要 async with 包装每个响应
        responses = await asyncio.gather(*[__aenter_wrap(t) for t in tasks])
        print('完成数：', len(responses))

async def __aenter_wrap(t):
    # 辅助：把 session.get 返回的上下文管理器正确进入
    cm = t
    resp = await cm.__aenter__()
    await cm.__aexit__(None, None, None)
    return resp.status

asyncio.run(main())
# 输出：
# 完成数： 30
```

实际工程中一般用前面 2.4 的 `fetch_one` 封装（带 `async with`），这里只是为了说明 connector 的作用。

**关闭 SSL 验证（仅用于自签证书或调试）**

```python
import asyncio
import aiohttp

async def main():
    conn = aiohttp.TCPConnector(ssl=False)   # 不验证证书
    async with aiohttp.ClientSession(connector=conn) as session:
        async with session.get('https://self-signed.example') as resp:
            print(resp.status)

# asyncio.run(main())
```

`ssl=False` 会带来中间人攻击风险，只在受控内网或调试场景用，生产环境应正确配置证书。

### 2.9 与 requests 的全面对比

requests 和 aiohttp 是两个时代、两种模型的 HTTP 客户端。把它们放在一起对比，能更清楚什么时候该用哪个。

| 维度 | requests | aiohttp |
|------|---------|---------|
| 同步/异步 | 同步阻塞 | 异步（基于 asyncio） |
| 单次请求用法 | `requests.get(url)` | `async with session.get(url) as resp:` |
| 并发方式 | 多线程（每个线程一个请求） | 单线程事件循环 + 多 Task |
| 事件循环影响 | 在事件循环线程里调会卡住循环 | 原生融入事件循环 |
| 连接池 | 有（`requests.Session`） | 有（`ClientSession` + `TCPConnector`） |
| 并发上限 | 受线程数限制（通常几十到几百） | 单线程可挂起成百上千 |
| 资源开销 | 每线程约 8MB 栈，线程切换有开销 | 协程极轻量（KB 级），无线程切换 |
| 学习成本 | 极低，同步思维 | 需理解 asyncio、事件循环、await |
| 调试 | 简单，调用栈直观 | 多协程交错，调试稍复杂 |
| 适用场景 | 普通脚本、少量请求、CPU 与 IO 混合 | 高并发 IO 密集（爬虫、API 聚合、网关） |

**什么场景该用 requests**

- 一次性脚本、几十个请求以内，并发收益不明显
- 程序本身不是异步的（没有事件循环），强行引入 asyncio 反而增加复杂度
- 需要和大量同步库（如数据库驱动、文件处理）混用，异步改造代价大

**什么场景该用 aiohttp**

- 需要并发抓取大量 URL（爬虫、监控、数据聚合）
- 已有 asyncio 程序（如异步 Web 服务 aiohttp.web/FastAPI），发请求必须异步
- 网关/代理类服务，要把进来的请求转发给多个后端，单线程扛高并发
- 同时维护大量长连接（WebSocket、HTTP 长轮询）

**不要在异步程序里混用 requests**

```python
import asyncio
import requests

async def bad_mixed():
    # 在异步协程里调 requests，整个事件循环在此期间冻结
    resp = requests.get('https://example.com')
    return resp.text
```

这种"异步皮同步骨"的写法是异步程序里最常见的性能杀手。如果实在要用 requests（比如某个复杂场景 aiohttp 不支持），至少用 `asyncio.to_thread` 把它丢到线程池，别让它卡事件循环：

```python
import asyncio
import requests

async def acceptable_mixed(url):
    # 把阻塞的 requests 调用丢到线程池，事件循环在此期间自由
    def _do():
        return requests.get(url).text
    return await asyncio.to_thread(_do)
```

但这等于退化成了"用线程池模拟异步"，失去了 aiohttp 单线程 epoll 并发的优势，只应作为过渡手段。

## 3. 最佳实践

**一个应用一个 session，不要每次请求新建**

这是 aiohttp 最重要的规则。`ClientSession` 的连接池价值完全建立在复用上——每次请求都新建 session 等于每次都重建连接池，Keep-Alive 连接没机会复用，握手开销全白白浪费。正确做法是在应用启动时建一个 session，整个生命周期复用，退出时 `await session.close()`。

```python
# 不推荐：每次请求新建 session
async def bad():
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.text()

# 推荐：长期复用
class MyApp:
    def __init__(self):
        self.session = aiohttp.ClientSession()   # 应用启动时建

    async def fetch(self, url):
        async with self.session.get(url) as resp:
            return await resp.text()

    async def close(self):
        await self.session.close()               # 应用退出时关
```

**务必用 async with，别裸 await**

`session.get(url)` 返回的是一个响应上下文管理器，必须 `async with` 进入、退出，否则连接不会归还连接池，导致连接泄漏。即便是"只看状态码不读 body"也要 `async with`：

```python
# 不推荐：裸 await，连接可能不归还
resp = await session.get(url)
print(resp.status)
# 没有显式 release，连接可能泄漏

# 推荐：async with 自动管理
async with session.get(url) as resp:
    print(resp.status)
```

`async with` 退出时会保证连接被正确释放（正常归还连接池或关闭），是唯一可靠的响应管理方式。

**响应体只能读一次**

`text()`、`json()`、`read()` 共享同一个底层流，读完就空了。再次读会得到空或抛错。如果需要多次用响应体，先读到变量里复用：

```python
# 错误：读两次
async with session.get(url) as resp:
    text1 = await resp.text()
    text2 = await resp.text()   # 空字符串！

# 正确：读一次，复用变量
async with session.get(url) as resp:
    text = await resp.text()
    # 后续都用 text
```

如需"既看原始字节又解析 JSON"，用 `await resp.read()` 读 bytes，再自己 `json.loads`：

```python
async with session.get(url) as resp:
    raw = await resp.read()
    import json
    data = json.loads(raw)   # 同一份 bytes 解析
```

**务必配置超时**

aiohttp 默认 `total=300`（5 分钟），对大多数场景太宽。任意请求都应显式配一个合理 total，避免对方卡住时协程被无限挂起，占着连接池名额。对延迟敏感的接口收紧到 3~10 秒；对可能慢的下载放宽但也要有上限。

```python
timeout = aiohttp.ClientTimeout(total=10)
async with aiohttp.ClientSession(timeout=timeout) as session:
    ...
```

**并发请求数要限流**

无限并发会把对方服务器打挂、把自己端口/内存耗尽、触发对方限流封 IP。用 `asyncio.Semaphore` 或 `TCPConnector(limit_per_host=...)` 限制同时请求数。经验值：对单一站点 5~20 并发较安全；对多站点可放宽到 50~200。

```python
sem = asyncio.Semaphore(10)
async def fetch(session, url):
    async with sem:
        async with session.get(url) as resp:
            return await resp.text()
```

**异常分层捕获，别漏 TimeoutError**

`asyncio.TimeoutError` 不继承自 `aiohttp.ClientError`，只捕获 `ClientError` 会漏掉超时。最外层用 `Exception` 兜底或显式分开 `TimeoutError` 与 `ClientError`：

```python
try:
    ...
except asyncio.TimeoutError:
    ...
except aiohttp.ClientError:
    ...
```

**SSL 验证默认开着，别随意关**

`ssl=False` 会暴露在中间人攻击下。只在受控内网或调试时关，生产环境必须开。遇到自签证书应配置 CA 而非整体关闭验证。

**资源关闭要彻底**

`ClientSession` 持有连接池，不关闭会留下"Transport is still connected"之类的警告和未关闭的连接。长期运行的服务一定要有 `await session.close()` 的退出路径；`async with` 是最省心的方式。`asyncio.run` 结束时事件循环关闭，未显式关的 session 也会被连带清理，但别依赖这个——显式关闭是对资源的尊重。

## 4. 原理

这一章讲清楚 aiohttp 客户端为什么能"单线程并发大量 HTTP 请求而不阻塞"。要理解的核心不是 aiohttp 的源码细节，而是它依赖的两个底层机制：**非阻塞 socket** 与 **asyncio 事件循环对 socket 的就绪通知驱动**。弄懂这层，再去看 aiohttp 的并发能力就是水到渠成。

### 4.1 阻塞 socket 与非阻塞 socket

HTTP 协议跑在 TCP 上，TCP 读写就是对 socket 的读写。一个 socket 默认是阻塞的：调用 `recv(sock, buf)` 时，如果接收缓冲区里还没有数据，当前线程会被挂起（陷入内核态等待），直到有数据到达或连接出错，调用才返回。这段时间线程什么都干不了——这就是 `requests` 底层的模型。

非阻塞 socket 则相反：`recv` 调用时如果没有数据，立即返回一个 `EAGAIN`/`EWOULDBLOCK` 错误，不等待。线程不会卡住，可以去做别的——但数据什么时候到？这就要靠事件循环的就绪通知机制。

```python
# 伪代码：阻塞 socket 的一次读
sock.setblocking(True)
data = sock.recv(4096)   # 没数据就一直卡在这，线程冻结
# 卡住期间这个线程什么也做不了

# 伪代码：非阻塞 socket 的一次读
sock.setblocking(False)
try:
    data = sock.recv(4096)
except BlockingIOError:
    # 没数据可读，但线程没卡住，可以先去做别的
    # 等会儿再来试，或等事件循环通知
    data = None
```

requests 用阻塞 socket，所以每次请求都把线程钉死在 socket 读写上；aiohttp 用非阻塞 socket，所以每次"读"都不会卡住线程，而是让出事件循环。

### 4.2 事件循环与 epoll 对 socket 的就绪通知

非阻塞 socket 解决了"读不卡线程"，但带来了新问题：你怎么知道什么时候数据到了？轮询（不断 `recv` 试）会浪费 CPU。答案是操作系统的就绪通知机制：Linux 的 `epoll`、macOS 的 `kqueue`、Windows 的 IOCP。

这些机制的工作方式是：你把一批 socket 注册给内核，告诉它"这些 socket 我关心可读/可写事件"。然后你在一个单独的地方等待事件通知。当某个 socket 上有数据到达（可读）或发送缓冲区有空位（可写）时，内核会通知你"第 N 号 socket 就绪了，可以去读/写了"。你再去对那个 socket 做一次非阻塞读写，这次读写会立刻成功。

asyncio 的事件循环就是这个机制的封装：

1. 事件循环启动时创建一个 epoll（或对应平台）实例。
2. 每当 aiohttp 建立一个 socket，aiohttp 把它设为非阻塞，注册到 epoll，告诉内核"这个 socket 我关心可读可写"。
3. 事件循环的主循环一直 `epoll.poll(timeout)` 等待事件。没有事件时这步会阻塞等待（但这是"等通知"的阻塞，不是等单个 socket 的阻塞，任意一个注册的 socket 就绪都会唤醒它）。
4. 内核通知"某 socket 可读"，事件循环被唤醒，找到对应的回调（aiohttp 注册的），执行它——通常是 `recv` 把数据读出来，填进对应协程的 Future，唤醒协程。

**关键点**：事件循环线程阻塞在 `epoll.poll` 上，但这是一种"多路复用"的阻塞——它同时盯着成百上千个 socket，任意一个就绪都会唤醒它。这和 requests 阻塞在单个 socket 的 `recv` 上完全不同：前者一个线程管千条连接，后者一个线程只能等一条连接。

### 4.3 await resp.read() 如何让出循环直到数据就绪

把上面的机制套到一次 `await resp.text()` 上，完整的旅程：

1. 你调用 `await resp.text()`。`resp` 内部要读响应体。
2. aiohttp 对响应体所属的 socket 做了一次非阻塞 `recv`。如果数据已经在内核接收缓冲区里，立即拿到，协程继续往下走，`await` 几乎瞬时返回。
3. 如果数据还没到，非阻塞 `recv` 返回 `EAGAIN`。aiohttp 不会傻等，而是向事件循环注册"这个 socket 可读时叫我"，然后协程 `await` 一个未完成的 Future。
4. `await` 一个未完成 Future 时，协程挂起——PC、栈帧、局部变量都被保存，控制权交还给事件循环。
5. 事件循环回到主循环，继续 `epoll.poll`。此时它可以处理其它几百个协程的 socket 事件——别的请求该读的读、该写的写。
6. 某个时刻，目标 socket 上数据到达，内核通知事件循环"这 socket 可读了"。
7. 事件循环唤醒注册的回调，aiohttp 再次 `recv`，这次数据到了，读出来。
8. 数据填进 Future，Future 标记完成。
9. 事件循环在下次迭代中唤醒挂起的协程，`await resp.text()` 返回数据。

步骤 5 是"单线程并发"的关键——在此期间事件循环线程是自由的，能服务其它几百个协程。步骤 3 的"注册+挂起"是非阻塞模型的核心：不让线程傻等，而是"先去干别的，完了叫我"。这是 requests 阻塞模型做不到的——requests 在步骤 3 就把线程钉死在 `recv` 上了。

### 4.4 连接池复用 TCP 连接减少握手

一次 HTTPS 请求的网络成本不只是"传数据"。建立一条连接要：DNS 解析 → TCP 三次握手（1 个 RTT）→ TLS 握手（1~2 个 RTT）→ 才开始传 HTTP 数据。对远端服务器，一个 RTT 可能几十到几百毫秒，握手就要花掉大几百毫秒。

aiohttp 的 `ClientSession` 内部有连接池（`TCPConnector` 管理）。第一次请求某主机时，建一条连接（含握手），用完不关闭——而是标记为 Keep-Alive，放回池里。下次再请求同一主机的 `same host:port`，直接从池里取出已建好的连接，跳过 TCP 和 TLS 握手，直接发 HTTP 请求。

```python
# 伪代码：连接池逻辑
class TCPConnector:
    def __init__(self):
        self._pool = {}   # {(host, port, ssl): [idle_connections]}

    async def acquire(self, host, port, ssl):
        key = (host, port, ssl)
        if self._pool.get(key):             # 池里有空闲连接
            return self._pool[key].pop()    # 复用，跳过握手
        # 没有则新建：DNS + TCP 握手 + TLS 握手
        conn = await self._create_connection(host, port, ssl)
        return conn

    def release(self, conn, key):
        # 用完不关，放回池等下次复用
        self._pool.setdefault(key, []).append(conn)
```

这就是第 2.1 节强调"一个应用一个 session"的原因——复用 session 才能让连接池攒下连接。如果每次请求新建 session，每次都新建连接池，连接完全没机会复用，握手开销全白白浪费。

`force_close=True`（在 `TCPConnector` 构造时设）会禁用 Keep-Alive，每次请求后强制关闭连接——一般不需要，只在对方服务器不支持 Keep-Alive 或调试连接问题时用。

### 4.5 与 requests 阻塞 socket 卡线程的对比

把 requests 和 aiohttp 放在同一个"发一个请求"的场景对比，差异一目了然：

| 阶段 | requests（阻塞 socket） | aiohttp（非阻塞 socket + 事件循环） |
|------|------------------------|------------------------------------|
| 建连 | `connect` 阻塞直到握手完成，线程冻结 | 非阻塞 `connect`，立即返回，挂起协程等 epoll 通知 |
| 发请求 | `send` 阻塞直到内核缓冲区接受，线程冻结 | 非阻塞 `send`，发不出去就挂起等可写通知 |
| 等响应 | `recv` 阻塞直到数据到达，线程冻结 | 非阻塞 `recv`，没数据就挂起等可读通知 |
| 阻塞期间 | 这个线程什么也干不了 | 事件循环去跑其它协程，处理其它几百个 socket |
| 并发模型 | 一个线程一个请求 | 一个线程管成百上千个请求，靠 epoll 多路复用 |

requests 的并发只能靠多线程：开 100 个线程，每个线程一个 requests 请求。每个线程约 8MB 栈，100 个线程就 800MB 内存，且线程切换有内核开销。aiohttp 开 1000 个协程只要几 MB 内存，且没有线程切换——协程的"切换"只是事件循环在就绪协程之间的回调跳转，纯用户态。

这就是为什么 aiohttp 能在单线程内并发大量请求，而 requests 不行——不是 requests 实现差，而是它选了阻塞 socket 这条赛道，注定一个线程只能等一条连接。

### 4.6 并发请求靠多 Task 各自 await 自己的 socket

第 2.4 节的并发抓取，底层是怎么并发的？关键不是"aiohttp 内部有什么魔法并发"，而是 asyncio 的 Task 调度。

当你写：

```python
tasks = [fetch_one(session, url) for url in urls]
await asyncio.gather(*tasks)
```

`asyncio.gather` 把每个协程包装成 `Task`，一次性调度它们。这些 Task 都进入了事件循环的就绪队列。事件循环开始轮转：

1. Task A 跑到 `await session.get(url_a)`——发请求，非阻塞 `connect`/`send`，可能立即完成（发出去就行），也可能挂起等握手完成。挂起。
2. Task B 同样跑到 `await session.get(url_b)`，发请求，挂起。
3. Task C、D、E……同样，每个都在自己的 socket 上发请求后挂起。
4. 所有 Task 都挂起在各自的 socket 等待上。事件循环回到 `epoll.poll`，同时盯着所有这些 socket。
5. 哪个 socket 数据先到，epoll 通知，事件循环唤醒对应 Task 继续往下跑——通常是 `await resp.text()`→`recv` 把数据读出来。
6. 读完的 Task 完成，未完的继续等。事件循环不断在就绪 Task 之间切换。

这里没有"多线程"，也没有"aiohttp 主动多路复用"——多路复用是事件循环 + epoll 做的，aiohttp 只是老老实实把每个请求的 socket 设成非阻塞、注册给事件循环。每个 Task 的 `await` 各自挂起各自的协程，互不影响。事件循环在统一的 epoll 里盯着所有 socket，谁就绪就唤醒谁。

**单线程并发 = 多协程各自 await + 一个事件循环统一调度**。这就是 aiohttp 单线程并发成百上千请求的底层图景。

### 4.7 单线程事件循环并发成百上千连接的机制基础

这一节把前面的机制总结成"为什么单线程能扛大量连接"。

**1. 协程极轻量**

一个协程只是一个挂起的栈帧对象，KB 级别。1000 个挂起的协程只占几 MB 内存。对比 1000 个线程每个 8MB 栈就是 8GB——根本开不出来。这是单线程并发的内存基础。

**2. epoll 是 O(1) 事件通知，不是 O(n) 轮询**

老式的 `select`/`poll` 每次都要遍历所有注册的 socket 检查状态，连接数多了就慢。`epoll` 用内核维护的就绪列表，事件发生时直接告诉你是哪个 socket 就绪，复杂度与连接数无关。这是单线程并发大量连接的性能基础——10 个连接和 10000 个连接，`epoll_wait` 的开销基本一样。

**3. 没有线程切换开销**

线程切换要陷入内核、保存/恢复寄存器、TLB 失效等，微秒级开销，高频率切换会显著拖慢。协程切换是用户态的事件循环回调跳转，纳秒级，且只在"有事件发生"时才动——闲时事件循环就安静 `epoll_wait`，不空转。

**4. 所有 IO 都是 await 形式**

aiohttp 把 socket 读写、连接建立、DNS 解析都做成 `await` 形式。这意味着任何一步要等，协程就挂起，事件循环自由。整个客户端没有任何一处"把线程钉住等"的同步调用。这是"不阻塞"的语义基础。

**5. 连接池避免连接暴增**

连接池不仅复用连接减少握手，也通过 `limit`/`limit_per_host` 限制同时打开的连接数。即便你挂起 1000 个请求，连接池也会让实际并发连接数保持在配置上限内——多余的请求在连接池队列里排队等可用连接，不会把对方的 socket 资源和自己本地的端口耗尽。

把这五点合起来：协程轻量 + epoll 高效 + 无线程切换 + 全异步 IO + 连接池限流，就是 aiohttp 在单线程内并发成百上千 HTTP 请求的机制基础。这不是某个库的巧妙实现，而是 asyncio 生态"事件循环 + 非阻塞 socket + 就绪通知"这套通用机制在 HTTP 客户端领域的具体应用——同样的机制也支撑着 aiohttp 的服务端、aiofiles（虽然 aiofiles 用了线程池，见 aiofiles 笔记）、asyncio 的网络协议实现等。

**与 aiofiles 的原理差异（顺带对比）**

aiohttp 的异步是"真异步"——靠 epoll 直接通知 socket 就绪，事件循环线程自己做非阻塞读写，全程没有额外线程。aiofiles 的异步是"线程池模拟"——文件 IO 没有 epoll 就绪通知，只能把阻塞调用丢到线程池。两者都让协程能 `await`、都让事件循环不被阻塞，但底层机制本质不同：网络 IO 有就绪通知，文件 IO 没有。这就是为什么 aiohttp 能单线程真并发大量连接，而 aiofiles 的并发受线程池大小限制。

## 5. 总结

### 5.1 本文内容要点

- `requests` 是同步阻塞库，在 asyncio 事件循环线程里直接调用会卡住整个循环，网络协程、定时任务、其它协程全部停滞。`async def` 不会让函数体内的阻塞调用变异步。
- aiohttp 是基于 asyncio 的异步 HTTP 客户端（兼服务端），用非阻塞 socket + 事件循环驱动，让"单线程并发大量 HTTP 请求"成为可能。安装 `pip install aiohttp`。
- `ClientSession` 是客户端入口，内部维护连接池，复用 TCP/TLS 连接减少握手。整个应用应复用一个 session，不要每次请求新建。
- 客户端标准模式：`async with aiohttp.ClientSession() as session: async with session.get(url) as resp: data = await resp.text()/json()/read()`。两层 `async with` 都不能省。
- 响应读取：`await resp.text()` 读文本、`await resp.json()` 读 JSON、`await resp.read()` 读字节，三者共享流且只能读一次。`resp.status` 是状态码，`resp.headers`/`resp.cookies` 是响应头/cookie。
- POST/JSON/表单：`json=` 传 Python 对象自动序列化，`data=` 传 dict 自动按表单编码，`headers`/`cookies` 设请求头/cookie，session 级别可设默认值。
- 并发请求：多个 `session.get` 配 `asyncio.gather` 并发，总耗时≈最慢一个而非累加；用 `asyncio.Semaphore` 或 `TCPConnector(limit_per_host=...)` 限流。
- 超时：`aiohttp.ClientTimeout(total=...)` 配 session 级默认，单次请求传 `timeout=` 覆盖；超时抛 `asyncio.TimeoutError`。
- 异常：非 2xx 默认不抛，`resp.raise_for_status()` 主动抛 `ClientResponseError`；`ClientConnectionError`/`ServerDisconnectedError`/`ClientPayloadError` 等继承自 `ClientError`，但 `TimeoutError` 不继承，需分开捕获。
- 流式大响应：`resp.content.iter_chunked(n)` 分块读取，配合 aiofiles 边下边写，内存占用恒定。
- 资源关闭：`async with` 自动管理 session 与响应的生命周期；长期服务要显式 `await session.close()`。
- 原理：aiohttp 用非阻塞 socket，socket 无数据时 `recv` 立即返回 `EAGAIN`，协程挂起、事件循环经 `epoll` 监听所有 socket 的可读/可写事件；事件就绪后非阻塞读写、唤醒对应协程。连接池复用 Keep-Alive 连接跳过握手。并发靠多 Task 各自 await 自己的 socket + 单一事件循环统一 epoll 调度，协程轻量、epoll O(1)、无线程切换共同支撑单线程扛成百上千连接。
- 与 requests 对比：同步阻塞 vs 异步非阻塞，多线程并发 vs 单线程事件循环并发，适合少量 vs 适合高并发 IO 密集；异步程序里不要混用 requests。

### 5.2 读完应能掌握

- 能说清"为什么在 asyncio 事件循环里直接用 requests 会出问题"，并用一个心跳协程对比演示阻塞请求与 aiohttp 请求的差异。
- 能正确使用 `async with aiohttp.ClientSession() as session: async with session.get(url) as resp:` 的双层模式发起请求，用 `resp.text()/json()/read()` 读取响应，说明为何不能用裸 `await session.get`。
- 能说清 `ClientSession` 连接池复用机制，坚持"一个应用一个 session"原则，用 `base_url`/`headers`/`timeout` 配置 session 级默认。
- 能用 `json=`/`data=`/`params`/`headers`/`cookies` 发 POST JSON、POST 表单、带查询参数与请求头的请求。
- 能用 `asyncio.gather` 并发抓取多 URL，对比串行与并发的耗时差异，并用 `Semaphore` 限制并发数。
- 能配置 `ClientTimeout(total=...)` 超时，说清 `total`/`connect`/`sock_read` 各自含义，正确捕获 `asyncio.TimeoutError`。
- 能用 `resp.raise_for_status()` 处理非 2xx，分层捕获 `TimeoutError` 与 `ClientError` 系列异常。
- 能用 `resp.content.iter_chunked(n)` 流式下载大文件，配合 aiofiles 边下边写，说清为何内存恒定。
- 能说清 aiohttp 的非阻塞 socket + epoll 事件驱动原理：socket 无数据时协程挂起、事件循环紧盯所有 socket、就绪后唤醒；并与 requests 阻塞 socket 卡线程、aiofiles 线程池模拟异步对比，说清为什么 aiohttp 能单线程并发大量连接。
- 能在"用 aiohttp"与"用 asyncio.to_thread + requests"之间根据场景合理取舍，避免异步程序里混用阻塞库。