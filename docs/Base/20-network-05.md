---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 5
title: requests.Session 会话保持
nav:
  title: Python
  order: 1
---

## 1. 介绍

### 1.1 什么是 requests.Session

`requests` 是 Python 最流行的第三方 HTTP 客户端库，日常写法 `requests.get(url)` 每次调用都会新建一个"一次性"请求：新开 TCP 连接、完成 TLS 握手、发请求、收响应、关闭连接，Cookie 也不会留存到下一次。这在只发一个请求时没问题，但当你需要连续发多个请求（登录后访问受保护接口、爬取分页列表、调用一组 RPC），这种"用完即弃"的方式既慢又无法保持登录状态。

`requests.Session` 就是用来解决这个问题的会话对象。它是一个持久化的 HTTP 会话容器，跨多个请求复用同一套底层资源：TCP 连接池、TLS 上下文、Cookie 存储、默认 headers/cookies/auth/proxies 配置。你可以把它理解为一个"带了记忆的浏览器标签页"——在它上面发的所有请求共享同一份状态。

核心能力有三点：

- **Cookie 自动保持**：服务器通过 `Set-Cookie` 下发的 cookie 会被 Session 自动保存，并在后续请求中自动带上，无需手动传递。
- **TCP 连接复用**：Session 内部持有一个 urllib3 连接池，对同一主机多次请求会复用已建立的 TCP/TLS 连接，免去重复握手，显著提速。
- **统一默认配置**：在 Session 上设置的 headers、cookies、auth、proxies 等会作为所有请求的默认值，每次请求只需写差异部分。

Series 适用于几乎所有"多次请求"场景：登录后保持会话、批量调用 API、爬虫连续抓取、统一 User-Agent 的服务调用。可以说，只要你的脚本要发超过一次请求，就应该用 Session 而不是裸 `requests.get`。

### 1.2 基础语法与最小用法

创建 Session 对象后，用它发请求的方式与裸 `requests` 几乎完全一样——`s.get()`、`s.post()`、`s.put()`、`s.delete()` 等方法签名一致，只是调用对象从模块级函数变成了会话方法。

```python
import requests

# 创建会话对象
s = requests.Session()

# 在 Session 上发请求，方式与 requests.get() 一致
resp = s.get("https://httpbin.org/get")
print(resp.status_code)
# 输出：200
```

与裸 `requests.get` 的差异，用一个对比就能看清：同一个站点连续发三次请求，裸调用之间互不相干，Session 则会复用连接并保持 cookie。

```python
import requests
import time

url = "https://httpbin.org/get"

# 裸调用：每次新连接、不保 cookie
t0 = time.perf_counter()
for _ in range(3):
    requests.get(url)
t_bare = time.perf_counter() - t0

# Session：复用连接、保 cookie
t0 = time.perf_counter()
with requests.Session() as s:
    for _ in range(3):
        s.get(url)
t_session = time.perf_counter() - t0

print(f"裸调用 3 次: {t_bare:.3f}s")
print(f"Session 3 次: {t_session:.3f}s")
# 输出：（数值因网络而异，Session 通常明显更快，尤其首请求后）
```

这个最小示例已经体现出 Session 的价值：代码没复杂多少，但性能与状态保持都拿到了。后续章节展开每一项能力。

---

## 2. 核心内容

### 2.1 创建会话与发请求

`requests.Session()` 创建一个空会话对象，随后通过它的方法发请求。所有方法（`get`/`post`/`put`/`patch`/`delete`/`head`/`options`）的签名与模块级函数一致，支持 `params`、`data`、`json`、`headers`、`cookies`、`auth`、`timeout`、`proxies`、`verify` 等参数。

```python
import requests

s = requests.Session()

# GET 带查询参数
r1 = s.get("https://httpbin.org/get", params={"page": 1, "size": 20})
print(r1.json()["args"])
# 输出：{'page': '1', 'size': '20'}

# POST JSON
r2 = s.post("https://httpbin.org/post", json={"username": "alice"})
print(r2.json()["json"])
# 输出：{'username': 'alice'}

# PUT 更新
r3 = s.put("https://httpbin.org/put", json={"id": 1, "name": "alice2"})
print(r3.status_code)
# 输出：200
```

**与模块级函数的关键差异**

`requests.get()` 等模块级函数内部其实也用了 Session，但每次调用会"借"一个临时 Session 用完就丢——相当于每次都从零开始。而 `s.get()` 是复用你持有的这个 Session，所有跨请求状态（cookie、连接、默认配置）都在它身上累积。所以一旦要发第二个请求，Session 就是更合理的选择。

### 2.2 Cookie 自动保持

这是 Session 最常用的能力。当服务器响应中带有 `Set-Cookie` 头时，Session 会自动把 cookie 存入它内部的 `RequestsCookieJar`，并在后续对任意 URL 的请求中自动带上匹配的 cookie。你完全不需要手动把上一次响应的 cookie 取出来再塞进下一次请求。

一个登录后保持会话的典型场景：

```python
import requests

# 模拟一个需要登录的站点：httpbin 的 /cookies/set 会下发 cookie
s = requests.Session()

# 第一步："登录"——服务器下发 Set-Cookie
login_resp = s.get("https://httpbin.org/cookies/set", params={"token": "abc123", "role": "admin"})
# Session 已自动保存这两个 cookie

# 第二步：访问受保护接口——无需手动传 cookie，Session 自动带上
profile = s.get("https://httpbin.org/cookies")
print(profile.json())
# 输出：{'cookies': {'token': 'abc123', 'role': 'admin'}}
```

`httpbin.org/cookies/set` 会返回 `Set-Cookie` 头设置 cookie，`/cookies` 会把你请求中带的 cookie 回显出来。可以看到第二次请求自动带上了第一次拿到的 cookie，全程没有手动处理。

**session.cookies 查看/管理 cookie**

`Session.cookies` 是一个 `RequestsCookieJar` 对象（继承自标准库 `http.cookiejar.CookieJar`），可以像字典一样读取，也可以迭代、修改、删除。

```python
import requests

s = requests.Session()
s.get("https://httpbin.org/cookies/set", params={"sid": "xyz", "lang": "zh"})

# 查看所有 cookie（按域名）
for cookie in s.cookies:
    print(f"{cookie.name} = {cookie.value}  (domain={cookie.domain})")
# 输出：
# sid = xyz  (domain=httpbin.org)
# lang = zh  (domain=httpbin.org)

# 像字典一样取值
print(s.cookies["sid"])
# 输出：xyz

# 手动设置 cookie（无需经过服务器）
s.cookies.set("custom", "hello", domain="httpbin.org", path="/")

# 删除某个 cookie
s.cookies.clear(domain="httpbin.org", path="/", name="lang")
print(dict(s.cookies))
# 输出（不含 lang）：{'sid': 'xyz', 'custom': 'hello'}
```

**手动设置 cookie 的两种方式**

除了 `s.cookies.set()`，也可以在创建 Session 后用 `s.cookies.update()` 批量塞入，或直接在发起请求时用 `cookies` 参数临时覆盖（这只影响当次请求，不会清空 Session 里已有的 cookie）。

```python
import requests

s = requests.Session()

# 方式一：在 cookies jar 上直接设
s.cookies.update({"debug": "1"})

# 方式二：请求级临时 cookie（与 Session cookie 合并）
r = s.get("https://httpbin.org/cookies", cookies={"temp": "once"})
print(r.json())
# 输出：{'cookies': {'debug': '1', 'temp': 'once'}}  —— debug 来自 Session，temp 来自请求级
```

请求级 `cookies` 与 Session 级 `cookies` 会合并：同名时请求级覆盖 Session 级（仅当次），不同名则都带上。

### 2.3 Session 默认配置：headers / cookies / auth / proxies

Session 的另一大价值是"统一默认配置"。在 Session 上设置的 headers、cookies、auth、proxies、cert、verify 等属性，会成为它发出的每一个请求的默认值。每次请求只需写差异部分，避免在每个 `s.get()` 里重复塞一堆相同的头。

**默认 headers**

```python
import requests

s = requests.Session()

# 设置全局默认 headers：所有请求都会带上
s.headers.update({
    "User-Agent": "MySpider/1.0",
    "Accept": "application/json",
    "X-Client": "python-demo",
})

# 发请求时无需再写这些头
r = s.get("https://httpbin.org/headers")
print(r.json()["headers"])
# 输出（节选）：
# {'Accept': 'application/json', 'User-Agent': 'MySpider/1.0', 'X-Client': 'python-demo', ...}

# 请求级 headers 会与 Session 默认合并，同名则请求级覆盖
r2 = s.get("https://httpbin.org/headers", headers={"X-Client": "override", "X-Extra": "hi"})
print(r2.json()["headers"]["X-Client"])
# 输出：override
print(r2.json()["headers"]["X-Extra"])
# 输出：hi
```

合并规则很重要：Session 级 headers 与请求级 headers 是**合并**而非替换，请求级同名 key 覆盖 Session 级。这意味着你可以把"所有请求都要带"的头放 Session 上，把"这次特有"的头放请求参数里。

**默认 auth**

```python
import requests
from requests.auth import HTTPBasicAuth

s = requests.Session()
# 设默认 Basic Auth——所有请求自动带认证头
s.auth = HTTPBasicAuth("admin", "secret")

r = s.get("https://httpbin.org/basic-auth/admin/secret")
print(r.status_code, r.json())
# 输出：200 {'authenticated': True, 'user': 'admin'}

# 无需每次都写 auth=...
r2 = s.get("https://httpbin.org/basic-auth/admin/secret")
print(r2.status_code)
# 输出：200
```

`auth` 同样可作为 Session 属性设默认值，对需要鉴权的 API 群组尤其方便——配一次，全链路自动带认证。

**默认 proxies**

```python
import requests

s = requests.Session()
# 统一走代理（按协议分别配）
s.proxies.update({
    "http": "http://proxy.local:8080",
    "https": "http://proxy.local:8080",
})

# 所有请求经代理发出，无需每个请求单独传 proxies
r = s.get("https://httpbin.org/ip")
print(r.json())
# 输出：{'origin': '<代理出口 IP>'}
```

**默认 cookies / cert / verify**

- `s.cookies`：见 2.2，作为所有请求默认 cookie。
- `s.verify`：默认 `True`（校验证书），设为 `False` 关闭校验（不推荐生产用）。
- `s.cert`：客户端证书路径，HTTPS 双向认证场景用。
- `s.trust_env`：是否读取系统环境变量（`HTTP_PROXY` 等）和 `~/.netrc`，默认 `True`。在容器/CLI 工具里常设为 `False` 以避免环境干扰。

```python
import requests

s = requests.Session()
s.verify = True         # 显式校验证书
s.trust_env = False     # 不读取系统代理/netrc，配置完全自控
```

把"公共配置"集中在 Session 上、把"每次差异"留在请求参数里，是 Session 使用的核心心智模型。

### 2.4 复用 TCP 连接池提速

裸 `requests.get()` 每次都要新建 TCP 连接、（HTTPS 还要）完成 TLS 握手，发起一次 HTTP 请求。对 HTTPS 而言，TLS 握手本身就要 1~2 个 RTT，开销往往比传输数据还大。Session 内部维护一个 urllib3 连接池，对同一 `host:port` 的后续请求会复用已建立的连接，省掉重复握手，提速效果在跨多个请求时非常明显。

一个直观对比：对同一 HTTPS 接口连续请求 5 次，分别用裸调用与 Session。

```python
import requests
import time

URL = "https://httpbin.org/get"
N = 5

# 裸调用：每次新连接、新 TLS 握手
t0 = time.perf_counter()
for _ in range(N):
    requests.get(URL)
t_bare = time.perf_counter() - t0

# Session：首请求建连接，后续复用
t0 = time.perf_counter()
with requests.Session() as s:
    for _ in range(N):
        s.get(URL)
t_session = time.perf_counter() - t0

print(f"裸调用 {N} 次: {t_bare:.3f}s")
print(f"Session {N} 次: {t_session:.3f}s")
print(f"提速: {t_bare / t_session:.1f}x")
# 输出（数值因网络而异，典型情况 Session 明显更快，尤其 N 较大时）：
# 裸调用 5 次: 1.20s
# Session 5 次: 0.55s
# 提速: 2.2x
```

提速幅度取决于网络 RTT、TLS 实现与服务端 keep-alive 策略。RTT 越大（跨境、弱网），复用收益越大；服务端关闭 keep-alive 则复用会受限。但即便在国内同区，连续几十个请求时 Session 通常也比裸调用快一截。

**为什么不是永远更快**

首请求仍然要建连接、握手，无法避免。提速来自"第二个请求开始"的复用。如果你只发一个请求，Session 与裸调用差异不大；Session 的价值在"多请求"场景才显现。

### 2.5 with requests.Session() as s：资源管理

Session 持有连接池，里面Maintain着若干个已建立的 TCP 连接。用完后应该释放它们，否则连接会一直挂着直到超时或被 GC 回收（CPython 下 GC 时机不确定，长时间运行的脚本可能积累大量空闲连接）。

`Session` 实现了上下文管理器协议（`__enter__`/`__exit__`），推荐用 `with` 语句：

```python
import requests

with requests.Session() as s:
    s.get("https://httpbin.org/get")
    s.get("https://httpbin.org/status/200")
# 退出 with 块时自动调用 s.close()，释放连接池
```

等价的手动写法：

```python
s = requests.Session()
try:
    s.get("https://httpbin.org/get")
finally:
    s.close()
```

`s.close()` 并不会粗暴中断进行中的请求，它只是把连接池里的空闲连接关闭、清理池结构。之后再在已关闭的 Session 上发请求会报错或重新建连接，所以 `close` 后不要继续使用。

**何时用 with、何时保留全局 Session**

- 短期、一次性任务（跑完即退出）：用 `with`，干净利落。
- 长期运行的服务/守护进程（如 Web 后台线程池、爬虫常驻进程）：保留一个长期 Session，不频繁 close。连接池会自我管理，空闲超时的连接会被 urllib3 自动回收。这样可以持续享受连接复用，不必每次重建。

```python
# 长期运行场景：模块级共享 Session
_session = requests.Session()
_session.headers.update({"User-Agent": "MyService/1.0"})

def fetch_user(uid):
    return _session.get(f"https://api.example.com/users/{uid}").json()
```

### 2.6 HTTPAdapter：统一连接池与重试

`Session` 默认已经自带连接池（通过 urllib3），但如果你要调整池大小（并发连接数）、或给请求加上自动重试，就需要挂载 `HTTPAdapter`。`HTTPAdapter` 是 requests 的"传输适配器"，负责把请求交给底层 urllib3 执行；挂到 Session 后会对匹配的 URL 生效。

**挂载适配器与调整池大小**

```python
import requests
from requests.adapters import HTTPAdapter

s = requests.Session()

# 创建适配器：最大连接数 pool_connections=10（池中保留的连接数）、pool_maxsize=10（同主机并发连接上限）
adapter = HTTPAdapter(pool_connections=10, pool_maxsize=10)
# 挂载：http 和 https 都用这个适配器
s.mount("http://", adapter)
s.mount("https://", adapter)

# 之后 s 发的请求按新池配置执行
r = s.get("https://httpbin.org/get")
print(r.status_code)
# 输出：200
```

`pool_connections` 控制连接池为多少个不同 host 保留连接（每个 host 一个池子），`pool_maxsize` 控制单个 host 的并发连接上限。默认都是 10，对大多数脚本够用；高并发场景（如百线程并发请求同一 API）可调大 `pool_maxsize`，否则多出的请求会排队等连接。

**配合 Retry 实现自动重试**

`HTTPAdapter` 接受一个 `max_retries` 参数，可以传整数（简单重试次数）或 `urllib3.util.retry.Retry` 对象（精细控制重试条件、退避策略）。这是生产环境几乎必备的配置——网络抖动、服务端 5xx 时不至于一个请求失败就整个流程挂掉。

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

s = requests.Session()

retry = Retry(
    total=3,                          # 最多重试 3 次
    backoff_factor=0.5,               # 退避：0.5s, 1s, 2s（每次 ×backoff_factor）
    status_forcelist=[429, 500, 502, 503, 504],  # 这些状态码触发重试
    allowed_methods=["GET", "PUT", "DELETE"],     # 仅这些方法重试（POST 不重试，避免重复提交）
)
adapter = HTTPAdapter(max_retries=retry)
s.mount("http://", adapter)
s.mount("https://", adapter)

# 遇到 503 等会自动按策略重试，调用方无感
r = s.get("https://httpbin.org/status/503")
# 输出：经过最多 3 次重试后，最终返回 503（如果一直失败）或成功
```

**为什么把适配器挂到 Session 而不是每次请求**

`HTTPAdapter` 持有连接池与重试策略。挂到 Session 上意味着这些配置对 Session 所有请求生效——一处配置，全局受益。如果用裸 `requests.get()`，你得每次手工创建适配器并挂到临时 Session，配置无法统一管理。这就是 Session 作为"配置容器"的延伸价值。

### 2.7 会话级 hook 与响应钩子

`Session.hooks` 是一个较少用到但偶尔顺手的特性：你可以注册 `response` 钩子，在每次响应返回后自动执行一个回调。

```python
import requests
import time

s = requests.Session()

def log_timing(response, *args, **kwargs):
    print(f"[{time.strftime('%H:%M:%S')}] {response.request.method} "
          f"{response.url} -> {response.status_code} ({response.elapsed.total_seconds():.3f}s)")

s.hooks["response"].append(log_timing)

s.get("https://httpbin.org/get")
s.get("https://httpbin.org/status/204")
# 输出：
# [14:25:01] GET https://httpbin.org/get -> 200 (0.320s)
# [14:25:01] GET https://httpbin.org/status/204 -> 204 (0.105s)
```

适合统一打日志、统一错误告警、统一性能采集，不必在每个调用点重复写。

### 2.8 Session vs 每次 requests.get：何时用哪个

把两种方式的差异列成对照表更清晰：

| 维度 | `requests.get()`（裸调用） | `requests.Session()` |
|---|---|---|
| 连接 | 每次新建 TCP/TLS，用完丢弃 | 复用连接池，跨请求保活 |
| Cookie | 不保持（响应 cookie 丢失） | 自动保存并自动带上 |
| 默认配置 | 每次请求都写一遍 | Session 上配一次，全请求生效 |
| 重试/池大小 | 难统一管理 | 挂 HTTPAdapter 统一控制 |
| 资源管理 | 无需 close（临时 Session 自动 GC） | 用完应 close 或 with |
| 适用 | 单次请求 / 一次性脚本 | 多请求、登录保持、批量调用、长期服务 |

**记忆口诀**：一次请求用 `requests.get`，两次以上用 `Session`。实际工程里几乎所有 HTTP 代码都该默认用 Session，裸调用只在极简一次性场景才合理。

---

## 3. 最佳实践

**用 with 管理短期 Session**

短期脚本里务必用 `with requests.Session() as s:`，确保连接池及时释放。不要依赖 GC——长时间运行的脚本里，未关闭的 Session 会让连接在服务端保持到 keep-alive 超时，浪费对端资源。

```python
# 推荐
with requests.Session() as s:
    s.get(...)

# 不推荐（依赖 GC，关闭时机不确定）
s = requests.Session()
s.get(...)
# 忘了 s.close()
```

长期服务则相反：保留一个模块级/应用级 Session，不要每次请求都 with 新建——那样就丢了连接复用的全部好处。把 Session 做成共享单例，配合连接池与重试配置，是服务端调用外部 API 的标准姿势。

**登录后保持会话：先 post 登录、后用同一 Session 访问**

这是 Session 最经典的用法，关键在于"登录"和"后续访问"必须用同一个 Session 对象。

```python
import requests

with requests.Session() as s:
    # 登录：服务器下发 cookie（如 sessionid / token），Session 自动存
    login = s.post(
        "https://example.com/api/login",
        json={"username": "alice", "password": "******"},
    )
    login.raise_for_status()

    # 后续访问受保护接口：Session 自动带登录 cookie，无需手动处理
    profile = s.get("https://example.com/api/profile")
    print(profile.json())
    # 输出：{'user': 'alice', 'role': 'admin', ...}
```

注意如果登录响应是 JSON 里返回 token（而非 `Set-Cookie` 下发），则 cookie 不会自动存——需要你手动把 token 塞进 `s.headers` 或后续请求的 `Authorization` 头。Session 自动保持的只是 `Set-Cookie` 机制下发的 cookie。

```python
# token 模式：手动维护
with requests.Session() as s:
    r = s.post("https://example.com/api/login", json={"username": "alice", "password": "******"})
    token = r.json()["token"]
    s.headers["Authorization"] = f"Bearer {token}"   # 后续所有请求自动带

    profile = s.get("https://example.com/api/profile")
    print(profile.json())
```

**把公共配置放 Session、差异放请求参数**

不要在每个 `s.get()` 里重复写 `headers={"User-Agent": ...}`。User-Agent、Accept、公共 X- 头、auth、proxies 这些" everybody wants it"的配置统一放 Session；只有"这一次特有"的头才放请求参数。

```python
# 推荐
s = requests.Session()
s.headers.update({"User-Agent": "MyApp/1.0", "Accept": "application/json"})
s.auth = ("key", "secret")

r = s.get(url, headers={"X-Request-Id": "abc"})   # 只写差异
```

**统一 User-Agent 避免被识别为爬虫或被默认阻挡**

很多服务端会对默认的 `python-requests/2.x` User-Agent 做限制（直接 403 或降级）。在 Session 上设一个"正常"的 User-Agent 是最低成本的礼貌配置。

```python
s.headers.update({"User-Agent": "Mozilla/5.0 (compatible; MyApp/1.0)"})
```

**务必设 timeout，避免请求永久挂起**

`Session` 不会"继承"timeout——`s.timeout` 不是一个标准属性。必须在每次请求显式传 `timeout`，或用 hook/包装函数统一注入。一个忘了 timeout 的请求在网络异常时会无限挂起，拖垮整个脚本甚至线程池。

```python
# 不推荐：没 timeout，可能永久阻塞
s.get(url)

# 推荐
s.get(url, timeout=5)            # 总超时 5s
s.get(url, timeout=(3, 10))      # 连接 3s，读取 10s
```

如果想统一 timeout，可以包一层：

```python
def req(s, method, url, **kw):
    kw.setdefault("timeout", 5)
    return s.request(method, url, **kw)

r = req(s, "GET", url)
```

**生产环境挂 Retry 适配器，别裸奔**

线上调用外部 API，一定要挂带 `Retry` 的 `HTTPAdapter`，对 5xx/429 自动退避重试。否则一次服务端小抖动就会让整个流程失败。

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(total=3, backoff_factor=0.5,
              status_forcelist=[500, 502, 503, 504],
              allowed_methods=["GET", "PUT", "DELETE"])
adapter = HTTPAdapter(max_retries=retry)
s.mount("https://", adapter)
s.mount("http://", adapter)
```

注意：`Retry` 默认不重试 POST（怕重复提交），这也是为什么 `allowed_methods` 要显式列出可重试方法。对幂等的 GET/PUT/DELETE 重试安全，对 POST 要确认服务端幂等后再加入。

**关闭 verify 前先想清楚**

有时为了绕过自签证书会 `s.verify = False`，但这关闭了 TLS 证书校验，存在中间人攻击风险。生产环境正确做法是把自签 CA 证书加到信任链，而不是关校验：

```python
# 不推荐（除非调试临时用）
s.verify = False

# 推荐：指定 CA 证书
s.verify = "/path/to/internal-ca.crt"
```

**多线程/协程共享 Session 的注意事项**

`requests.Session` 本身**不是**协程安全的（它是同步阻塞库），但在多线程下共享一个 Session 是被官方支持的——urllib3 连接池是线程安全的，cookies/headers 的读写大致安全（极端并发下可能有竞态，但对绝大多数应用影响极小）。常见做法：多线程共享一个 Session 享受连接复用，或每线程一个 Session 隔离 cookie。

如果要真正并发且非阻塞，请用 `aiohttp` 或 `httpx`（参见第 4 章原理对比）。

---

## 4. 原理

### 4.1 Session 持有的三大状态

要理解 Session 为什么能"记住"东西，先看它内部到底持有什么。一个 `requests.Session` 对象核心持有三样状态：

1. **连接池**：通过 `HTTPAdapter` 间接持有的 urllib3 `PoolManager`，管理对各个 host 的 `HTTPConnectionPool`，每个池子里缓存若干个 keep-alive 的 TCP 连接。
2. **Cookie 存储**：`RequestsCookieJar`（继承自标准库 `http.cookiejar.CookieJar`），保存所有响应下发的 cookie。
3. **默认请求配置**：`headers`、`cookies`、`auth`、`proxies`、`hooks`、`params`、`verify`、`cert`、`trust_env` 等，作为每次请求的默认底座。

```python
import requests

s = requests.Session()
s.get("https://httpbin.org/get")

# 看看内部
print(type(s.adapters))       # 输出：<class 'dict'>  —— {'https://': HTTPAdapter, 'http://': HTTPAdapter}
print(type(s.cookies))        # 输出：<class 'requests.cookies.RequestsCookieJar'>
print(type(s.headers))        # 输出：<class 'requests.structures.CaseInsensitiveDict'>
```

`s.adapters` 是个 dict，存放按 URL 前缀匹配的传输适配器。默认注入了 `https://` 和 `http://` 两个 `HTTPAdapter`。每次请求时，Session 会根据 URL scheme 找到对应适配器，由适配器把请求交给底层 urllib3 执行。

### 4.2 连接池如何复用 TCP/TLS

`HTTPAdapter` 内部持有一个 `urllib3.PoolManager`。当 Session 第一次请求 `https://httpbin.org/get` 时，PoolManager 会按 `httpbin.org:443` 查找池子，找不到就新建一个 `HTTPSConnectionPool`，在池中建立一个新的 TCP 连接并完成 TLS 握手，发请求，拿响应。连接默认不立即关闭——urllib3 会把它标记为空闲保留在池中（keep-alive）。

下一次再请求同一 `host:port` 时，PoolManager 同样查找对应池子，这次发现池里有空闲连接，就复用它直接发请求，跳过 TCP 三次握手和 TLS 握手。这就是"第二个请求开始"的提速来源。

```
请求 1: new TCP → TLS handshake → GET → 响应 → 连接留池
请求 2: 复用连接 ───────────────→ GET → 响应 → 连接留池
请求 3: 复用连接 ───────────────→ GET → 响应 → 连接留池
```

对 HTTPS，一次完整 TLS 1.2 握手至少 1 个 RTT（TLS 1.3 可 1-RTT 甚至 0-RTT），再加上 TCP 的 1 个 RTT，新建连接的首请求成本可能比复用连接的后续请求高出 100ms 以上（跨地域更甚）。复用连接把这个成本摊薄到只在首请求支付一次。

连接何时会被丢弃：

- 服务器响应 `Connection: close`，或响应不含 keep-alive——urllib3 主动关闭。
- 连接超过 `socket_options`/keep-alive 超时——服务端或客户端关闭。
- 池满且新连接需要腾位——最旧的空闲连接被淘汰。
- `s.close()`——整个池子被清空，所有连接关闭。

`pool_connections`（保留多少个不同 host 的池）与 `pool_maxsize`（单 host 池里最多多少并发连接）共同决定池容量。并发超过 `pool_maxsize` 时，多出来的请求会阻塞等待空连接（而不是新建），这是为了控制对单 host 的并发压力。

### 4.3 CookieJar 如何自动保持 cookie

Session 的 cookie 自动保持，依赖于 `RequestsCookieJar` 与 `HTTPCookieProcessor` 的协作，流程是这样的：

```
Session.prepare_request(req)
  → 合并 session.cookies 与请求级 cookies 到 req.cookies
  → urllib3 发请求
  → 收到响应
  → Session.cookies.extract_cookies(response)   # 解析 Set-Cookie
  → 写入 jar
```

核心是两步：

1. **发请求前**：`PreparedRequest` 准备阶段，Session 会从 `self.cookies`（jar）里取出与目标 URL 匹配的 cookie，合并到请求的 `Cookie` 头里。匹配规则由 `CookieJar` 按 domain/path/secure/expiry 判断，与浏览器行为一致。
2. **收响应后**：Session 调用 jar 的 `extract_cookies()`，解析响应的 `Set-Cookie` 头，把新 cookie 存进 jar。下一次请求时，第 1 步就会自动带上它们。

```python
import requests

s = requests.Session()
s.get("https://httpbin.org/cookies/set", params={"k": "v"})

# 截至此刻，jar 里已有 k=v
print(s.cookies["k"])
# 输出：v

# 下一个请求，prepare 阶段会自动把 k=v 塞进 Cookie 头
r = s.get("https://httpbin.org/cookies")
print(r.json())
# 输出：{'cookies': {'k': 'v'}}
```

这就是"无需手动传 cookie"的原理——jar 在请求前注入、在响应后收集，全自动。

**为什么 cookie 匹配要按 domain/path**

CookieJar 遵循 RFC 6265 的 cookie 作用域规则：domain 为 `httpbin.org` 的 cookie 不会带到 `example.com` 的请求上；path 为 `/api` 的 cookie 不会带到 `/public` 路径上。这与浏览器一致，避免 cookie 误带到无关站点。你可以用 `s.cookies.set(name, value, domain=..., path=...)` 显式指定作用域来精确控制。

### 4.4 默认配置如何合并到每次请求

Session 的 `headers`/`cookies`/`auth`/`proxies` 不是"全局变量"那种粗暴覆盖，而是通过 `Session.request()` → `Session.prepare_request()` 在每次请求时做一次**合并**。大致流程：

1. 构造 `Request` 对象（包含本次请求的 url、method、headers、data 等）。
2. `prepare_request` 把 `Session` 级 headers 与 `Request` 级 headers 合并——同名 key 以 Request 级为准。
3. cookies 同样合并：Session.cookies + 请求级 cookies，同名请求级覆盖（当次）。
4. auth：Request 没 auth 就用 Session.auth；Request 有就优先 Request.auth。
5. proxies：合并 `trust_env` 读到的系统代理 + Session.proxies + 请求级 proxies。
6. 把合并后的 `PreparedRequest` 交给匹配的 adapter 发送。

```python
import requests

s = requests.Session()
s.headers.update({"X-Common": "A", "X-Shared": "S1"})

# 请求级 headers：X-Shared 覆盖，X-Only 新增
r = s.get("https://httpbin.org/headers", headers={"X-Shared": "S2", "X-Only": "O"})
h = r.json()["headers"]
print(h["X-Common"])   # 输出：A     —— 来自 Session
print(h["X-Shared"])   # 输出：S2    —— 请求级覆盖 Session
print(h["X-Only"])     # 输出：O     —— 来自请求级
```

合并语义是"分层覆盖"：Session 提供 base，请求级提供 override。这与"配置继承"的经典模型一致，让你既享受统一默认，又保留单次定制能力。

### 4.5 with 关闭时发生了什么

`Session.__exit__` 调用 `self.close()`。`close()` 遍历所有 adapter，调用每个 adapter 的 `close()`，最终把 `PoolManager` 里的连接全部关闭、清空池结构。此后这个 Session 不应再被使用——再用相当于在一个已清空的适配器集合上发请求，需要重新挂载适配器或重建池。

```python
import requests

s = requests.Session()
s.get("https://httpbin.org/get")
# 此时 s.adapters['https://'] 持有含连接的池

s.close()
# 池被清空，连接全部关闭
```

这保证短期任务结束后不留端口占用、不让对端服务端为这些 keep-alive 连接白白等待超时。对长期服务，不频繁 close、让连接池持续自我管理（urllib3 会在连接失效时自动剔除并重建）才是对的。

### 4.6 为何复用连接能提速：耗时拆解

把一次 HTTPS 请求的耗时拆开看：

```
DNS 解析        —— 通常缓存，可忽略（首次几十 ms）
TCP 三次握手    —— 1 RTT
TLS 握手        —— TLS1.2 约 1-2 RTT；TLS1.3 约 1 RTT
发送请求 + 等响应 —— 取决于服务端处理 + 网络传输
```

新建连接时，握手开销是"固定税"，与请求体大小无关。对跨地域链路（RTT 200ms+），TLS+TCP 握手可能就吃掉 500ms+。如果连续发 10 个小请求，裸调用要付 10 次握手税；Session 只付 1 次（首请求），后 9 次直接走已建立的连接，仅付传输 + 服务端处理时间。

```
裸调用 10 次：  10 × (握手 RTT + 传输)
Session 10 次：1 × (握手 RTT + 传输) + 9 × (传输)
节省：        9 × 握手 RTT
```

RTT 越大、请求数越多，收益越大。这也是为什么爬虫、API 客户端、调用第三方服务的后台代码"默认用 Session"几乎是行业共识——同样的代码，换个 Session 就可能省一半时间。

### 4.7 与裸 requests.get 的实现差异

模块级 `requests.get()` 内部长这样（简化）：

```python
# requests.api.get 实质
def get(url, **kwargs):
    with Session() as s:
        return s.get(url, **kwargs)
```

每次模块级调用都创建一个临时 Session，发完一个请求就 close。所以"裸调用不保 cookie、不复用连接"不是因为它没有 Session，而是因为它的 Session 用完即弃，状态无法跨调用留存。这也解释了为什么 `requests.get()` 与 `s.get()` 的方法签名完全一样——底层都是 Session，只是生命周期不同。

理解了这一点，"何时该用 Session"的答案就非常清晰：只要你想让"上一次请求的状态/连接影响到下一次请求"，就必须让 Session 跨调用存活，也就是自己持有 `Session` 对象。

### 4.8 与 aiohttp.ClientSession 的类比

在异步 HTTP 世界，`aiohttp.ClientSession` 扮演的角色与 `requests.Session` 几乎一致——同样是持久化会话对象，同样持连接池、同样自动 cookie 保持、同样支持默认 headers。核心差异在于"同步 vs 异步"与"生命周期约束"。

| 维度 | `requests.Session` | `aiohttp.ClientSession` |
|---|---|---|
| 模型 | 同步阻塞 | 异步（asyncio） |
| 连接池 | urllib3 PoolManager | aiohttp 自有连接池 |
| Cookie 自动保持 | 是（RequestsCookieJar） | 是（aiohttp.CookieJar） |
| 用法 | `s.get(url)` 直接返回 Response | `async with s.get(url) as r: await r.json()` |
| 生命周期 | `with` 或 `s.close()` | **必须在事件循环内** `async with`，且不应跨事件循环使用 |
| 并发 | 多线程共享 | 单事件循环内并发（`asyncio.gather`） |

一个对比示例：同样的"登录后访问受保护接口"，同步版与异步版。

```python
# 同步版：requests.Session
import requests

with requests.Session() as s:
    s.post("https://example.com/api/login", json={"user": "alice"})
    profile = s.get("https://example.com/api/profile").json()
    print(profile)
    # 输出：{'user': 'alice', ...}
```

```python
# 异步版：aiohttp.ClientSession（需 pip install aiohttp）
import asyncio
import aiohttp

async def main():
    # 注意：ClientSession 必须在 async 上下文里创建和使用
    async with aiohttp.ClientSession() as s:
        await s.post("https://example.com/api/login", json={"user": "alice"})
        async with s.get("https://example.com/api/profile") as r:
            profile = await r.json()
            print(profile)
            # 输出：{'user': 'alice', ...}

asyncio.run(main())
```

两段代码结构几乎对称：会话对象、登录、后续请求、with 管理。差别只在 `with` 变 `async with`、返回值变 `await`。这个对称性让你在从 `requests` 迁移到 `aiohttp` 时，心智模型可以直接复用——Session 的概念是跨库通用的。`httpx` 同样有 `httpx.Client`（同步）和 `httpx.AsyncClient`（异步），设计思路一致。详见【18】10。

如果你在做高并发 IO 密集型任务（成千上万请求），同步 `requests` 即便用线程池也难以高效，应转向 `aiohttp`/`httpx` 的异步 Session；中等并发或已有同步代码，`requests.Session` + 线程池仍是简单可靠的选择。

---

## 5. 总结

### 5.1 本文内容要点

- **Session 是什么**：`requests.Session` 是持久化 HTTP 会话对象，跨请求复用连接池、Cookie、默认配置，相当于"带记忆的浏览器标签页"。
- **Cookie 自动保持**：响应的 `Set-Cookie` 自动存入 `RequestsCookieJar`，后续请求自动匹配带上，无需手动传递。`s.cookies` 可查看、设置、删除。
- **连接复用提速**：内部 urllib3 `PoolManager` 维护 keep-alive 连接池，对同 host 多次请求复用 TCP/TLS 连接，免去重复握手，连续请求明显更快。
- **默认配置合并**：Session 上的 `headers`/`cookies`/`auth`/`proxies`/`verify` 等作为每次请求默认底座，请求级参数与之合并、同名覆盖。公共配置集中放 Session，差异放请求参数。
- **with 资源管理**：`with requests.Session() as s:` 退出时自动 `close()` 释放连接池；短期任务用 with，长期服务保留共享 Session。
- **HTTPAdapter 挂载**：通过 `s.mount(prefix, adapter)` 统一控制连接池大小与重试策略（`Retry`），生产环境必备。
- **Session vs 裸 requests.get**：裸调用每次新建临时 Session、不保 cookie、不复用连接；Session 高效且保状态。一次请求可用裸调用，两次以上应首选 Session。
- **登录后保持会话**：先 `s.post` 登录、后用同一 `s` 访问受保护接口，登录 cookie 自动带上。token 模式则手动设 `s.headers["Authorization"]`。
- **原理**：连接池复用 TCP/TLS（首请求付握手、后续免握手），CookieJar 在 prepare 阶段注入 + extract 阶段收集实现自动 cookie，默认配置通过 `prepare_request` 分层合并，`close()` 清空所有池中连接。
- **异步对照**：`aiohttp.ClientSession` / `httpx.AsyncClient` 与 `requests.Session` 概念对称，差异在异步模型与生命周期约束，高并发场景应迁移到异步 Session（关联【18】10）。

### 5.2 读完应能掌握

- 能说明 `Session` 与裸 `requests.get` 的本质区别（临时 Session 用完即弃 vs 持久化 Session 跨请求保持状态与连接）。
- 能用 `Session` 实现登录后保持会话访问受保护接口，并能区分 `Set-Cookie` 自动保持与 token 手动维护两种模式。
- 能在 Session 上设置默认 headers/cookies/auth/proxies，并说清请求级参数与 Session 级配置的合并规则（同名请求级覆盖）。
- 能用 `with` 管理短期 Session、用共享 Session 服务长期任务，并解释为何复用连接能提速（握手成本只在首请求支付）。
- 能挂载 `HTTPAdapter` 配合 `Retry` 统一控制连接池大小与自动重试策略，知道 POST 默认不重试的原因。
- 能查看/设置/删除 `session.cookies`，并按 domain/path 解释 cookie 作用域匹配。
- 能对照 `aiohttp.ClientSession` 说明异步 Session 的生命周期约束与迁移要点。