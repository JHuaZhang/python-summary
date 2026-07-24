---
group:
  title: 【20】网络请求与外部服务
  order: 20
order: 4
title: requests 超时与代理
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是超时与代理

网络请求从来不是"调一定应"那么简单。远端服务器可能宕机、网络可能丢包、代理可能卡在某一步——任何一个环节出问题,都会让"本应毫秒级返回"的请求变成"无限期挂起"。生产环境中最危险的 错误 不是抛异常,而是既不返回也不报错:一个不设超时的 `requests.get(...)` 可以把整个进程拖死,连带线程池、任务队列、上游调用方一起陪葬。

**超时（timeout）** 就是用一个明确的时间上限告诉 requests:"超过这个时间还没拿到响应,就主动放弃,抛异常。"它把"无限挂起"这个最坏情况,降级为一个可捕获、可重试、可告警的 `Timeout` 异常。

**代理（proxy）** 则是让请求经由一台中间服务器转发到目标地址。代理解决的是"我直连不到目标"的问题:公司内网出不去需要走出口代理、爬虫要换 IP、调试 HTTPS 要用 Charles/Fiddler 抓包、某些地区访问境外资源要翻墙——这些场景都得在请求里指定代理。

requests 对这两件事都做了简洁的封装:`timeout` 一个参数搞定超时,`proxies` 一个字典搞定代理。但"会用"和"用对"之间隔着不少坑:`timeout` 到底管的是总时间还是某一阶段的时间?为什么设了超时还是偶尔会卡住?SOCKS 代理为什么报错?`verify=False` 到底关掉了什么?这篇笔记就围着这些疑问展开。

### 1.2 基本语法与最小用法

requests 的超时和代理都是调用级参数,直接传给 `get/post/request` 即可。

最小超时示例:

```python
import requests

# 5 秒内没拿到完整响应就抛 Timeout
resp = requests.get("https://httpbin.org/delay/1", timeout=5)
print(resp.status_code)
# 输出：200
```

最小代理示例:

```python
import requests

proxies = {
    "http": "http://127.0.0.1:8888",
    "https": "http://127.0.0.1:8888",
}
# 经本地抓包代理(如 Charles)转发请求
resp = requests.get("https://httpbin.org/get", proxies=proxies, timeout=5)
print(resp.status_code)
# 输出：200
```

这两段就是全文的起点。后面的章节会逐一拆解 `timeout` 的两种传参形式、超时异常的层次、重试的组合拳、代理的各种协议与鉴权、SSL 证书处理,以及 Session 上挂 `HTTPAdapter` 实现自动重试与连接池复用的工程做法。

## 2. 核心内容

### 2.1 timeout 参数:float 与元组两种形式

`timeout` 是 `requests.get/post/...` 的一个关键字参数,接受两种形式。

**形式一:单个 float**

```python
requests.get(url, timeout=5)
```

这里的 `5` 并不是"整个请求最多 5 秒",而是分别作用于两个阶段:连接阶段最多 5 秒,读取阶段最多 5 秒。也就是说总时长理论上可能到 10 秒(连 5 秒 + 读 5 秒)。这是最容易误解的一点——很多人以为 `timeout=5` 是总时间上限,实际它是"分阶段的上限"。

**形式二:(connect, read) 元组**

```python
requests.get(url, timeout=(3, 10))
```

- `connect` 是**连接超时**:从发起 TCP 连接到三次握手完成的允许时长。
- `read` 是**读取超时**:TCP 连接建立后,连续两次从 socket 读取数据之间允许的最大间隔。注意它是"两次读之间的间隔",不是"读完整个响应体的总时间"。对于一个持续慢慢吐数据的服务器(每 9 秒吐一个字节),`read=10` 会一直不超时,因为每次读间隔都小于 10 秒。

用一个对照表来理解:

| 参数形式            | 连接阶段上限 | 读取阶段上限 | 典型场景                       |
| ------------------- | ------------ | ------------ | ------------------------------ |
| 不传 timeout        | 无限         | 无限         | 生产环境禁忌                   |
| timeout=5           | 5 秒         | 5 秒         | 一般请求                       |
| timeout=(3, 30)     | 3 秒         | 30 秒         | 连接要快、但允许慢响应(大文件下载) |
| timeout=(3, None)   | 3 秒         | 无限         | 连接要快、读取不限(慎用)        |

特别留意 `None` 这个值:在元组里传 `None` 表示"该阶段不限时"。`timeout=None` 等同于完全不设超时。这是 requests 容易踩的坑之一——以为传了 `timeout` 就安全了,结果传了个 `None`。

下面用 httpbin 的 delay 接口演示。`/delay/2` 会让服务器在响应前睡 2 秒。

```python
import requests
import time

url = "https://httpbin.org/delay/2"

# 场景一:超时设得足够大,正常返回
start = time.monotonic()
resp = requests.get(url, timeout=5)
print(f"正常: {time.monotonic() - start:.2f}s, status={resp.status_code}")
# 输出：正常: 2.20s, status=200

# 场景二:读取超时设得比服务器延迟小,触发超时
start = time.monotonic()
try:
    # 连接 3 秒、读取 1 秒;服务器 2 秒后才回,读取阶段必定超时
    resp = requests.get(url, timeout=(3, 1))
    print(f"不该到这: status={resp.status_code}")
except requests.exceptions.ReadTimeout as e:
    print(f"读取超时: {time.monotonic() - start:.2f}s -> {type(e).__name__}")
# 输出：读取超时: 3.20s -> ReadTimeout
```

**为什么是 3.2 秒而不是 1 秒?** 因为连接阶段先花了约 0.2 秒(握手成功),随后进入读取阶段,服务器要等 2 秒才回,而 `read=1` 只容忍 1 秒的读间隔,所以读取阶段在 1 秒后触发超时,总耗时约 0.2(连接) + ... 实际上连接很快,真正卡住的是读取。数字会随网络波动,但能稳定复现"读取超时"这一类异常。

### 2.2 不设 timeout 的危险

requests 的官方文档有一句反复强调的话:**你应当几乎总是为所有请求设置 timeout**。原因是 requests 默认不设超时——`timeout` 参数默认值是 `None`,也就是无限等待。

下面这段"危险写法"在生产环境中是一个高危信号:

```python
# 危险:没有 timeout,目标不可达时整个调用会无限挂起
resp = requests.get("https://10.255.255.1/")  # 一个几乎不会响应的地址
# 这行之后永远执行不到
```

`10.255.255.1` 是一个典型的"黑洞地址"——它不可路由,不会回 SYN-ACK,connect 会一直等。不设 timeout 时,这行代码会永久阻塞,所在线程/协程被占死。如果是在 Web 服务里,一个请求占一个线程,几条这样的请求就能把线程池耗光,整个服务对其他用户也变得不可用。

把上面的例子加上超时,行为就完全可控:

```python
import requests

start = time.monotonic()
try:
    # 3 秒连不上就放弃
    resp = requests.get("https://10.255.255.1/", timeout=3)
except requests.exceptions.ConnectTimeout as e:
    print(f"连接超时: {time.monotonic() - start:.2f}s")
# 输出：连接超时: 3.02s
```

**经验法则**:任何一次 `requests.get/post/...` 调用,都必须带 `timeout`。把它当成和 `url` 一样不可或缺的参数。不想每次手写的话,用 `Session` + 自定义 `request` 方法兜底(见 3.6)。

### 2.3 超时触发的异常层次

超时不是简单地抛一个 `Timeout` 完事——requests 的异常是有层次的。理解这个层次,才能写出精准的异常处理。

```
requests.exceptions.RequestException        # 所有 requests 异常的基类
├── requests.exceptions.Timeout             # 超时类的基类
│   ├── requests.exceptions.ConnectTimeout  # 连接阶段超时
│   └── requests.exceptions.ReadTimeout     # 读取阶段超时
├── requests.exceptions.ConnectionError     # 连接出错(非超时,如拒绝连接、DNS 解析失败)
└── ...
```

- **ConnectTimeout**:TCP 三次握手在 `connect` 时长内没完成。可能原因:服务器宕机、网络不通、防火墙丢包。
- **ReadTimeout**:连接已建立,但响应数据在 `read` 时长内没到来。可能原因:服务器处理慢、响应体很大传输慢、服务端逻辑卡住。
- **Timeout**:上面两个的父类。不确定是哪一阶段时,catch `Timeout` 能兜住两种。

此外,还要区分**连接超时**和**连接错误**。同样是连不上,如果 `connect` 到期了是 `ConnectTimeout`,但如果对方主动 `RST` 拒绝连接,则是 `ConnectionError`(下属 `ConnectionRefusedError`)。DNS 解析失败也是 `ConnectionError`。这两类异常的应对策略不同:超时可以重试(也许只是网络抖动),而 `ConnectionRefusedError` 重试往往没用(服务根本没起)。

下面这个 demo 演示两类超时的捕获:

```python
import requests
import time

def safe_get(url, timeout):
    """带精准异常分类的 GET。"""
    try:
        return requests.get(url, timeout=timeout)
    except requests.exceptions.ConnectTimeout:
        print("  -> 连接阶段超时:目标不可达或握手太慢")
    except requests.exceptions.ReadTimeout:
        print("  -> 读取阶段超时:连上了但响应迟迟不来")
    except requests.exceptions.Timeout:
        print("  -> 超时(未细分阶段)")
    except requests.exceptions.ConnectionError as e:
        print(f"  -> 连接错误(非超时):{e}")
    except requests.exceptions.RequestException as e:
        print(f"  -> 其他请求异常:{type(e).__name__}: {e}")
    return None

# 连接阶段超时:黑洞地址
print("测试 ConnectTimeout:")
safe_get("https://10.255.255.1/", timeout=(2, 5))
# 输出：  -> 连接阶段超时:目标不可达或握手太慢

# 读取阶段超时:连得上但响应慢
print("测试 ReadTimeout:")
safe_get("https://httpbin.org/delay/5", timeout=(3, 1))
# 输出：  -> 读取阶段超时:连上了但响应迟迟不来
```

**捕获顺序**要注意:先 catch 子类(`ConnectTimeout`/`ReadTimeout`),再 catch 父类(`Timeout`),最后 catch 更宽泛的 `RequestException`。如果反过来,子类异常会被父类提前接住,分类就失效了。

### 2.4 超时 + 重试的组合

超时只解决"不无限挂起",不解决"偶发抖动"。一次超时就直接报错给用户,体验很差——网络抖动、服务器瞬时繁忙都很常见,重试一两次往往就成功了。所以工程里**超时 + 重试**几乎总是成对出现。

最朴素的重试:手写 `for` + `try/except` + `time.sleep`。

```python
import requests
import time

def get_with_retry(url, retries=3, timeout=3, backoff=1.0):
    """手写重试:固定退避。"""
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)
            resp.raise_for_status()  # 4xx/5xx 也算需要重试的错误
            return resp
        except (requests.exceptions.Timeout,
                requests.exceptions.ConnectionError,
                requests.exceptions.HTTPError) as e:
            last_exc = e
            print(f"第 {attempt} 次失败: {type(e).__name__}, {backoff}s 后重试")
            if attempt < retries:
                time.sleep(backoff)
    raise last_exc

# 故意打一个会 5 秒才回的接口,读取超时 1 秒,看重试
try:
    get_with_retry("https://httpbin.org/delay/5", retries=3, timeout=(3, 1), backoff=0.5)
except requests.exceptions.ReadTimeout as e:
    print(f"重试耗尽: {type(e).__name__}")
# 输出：
# 第 1 次失败: ReadTimeout, 0.5s 后重试
# 第 2 次失败: ReadTimeout, 0.5s 后重试
# 第 3 次失败: ReadTimeout, 0.5s 后重试
# 重试耗尽: ReadTimeout
```

手写重试能跑,但有局限:退避策略要自己实现、无法区分"可重试"和"不可重试"的状态码、连接池没法复用、并发场景下管理麻烦。生产环境更推荐用 `urllib3` 的 `Retry` + `requests` 的 `HTTPAdapter`,见 2.7。

### 2.5 proxies 参数:HTTP/HTTPS/SOCKS 代理

`proxies` 接受一个字典,key 是协议 scheme(`http`/`https`/`http+https`),value 是代理 URL。

**HTTP/HTTPS 代理**

最常见的形式,代理服务器本身用 HTTP 协议转发(即使目标是 HTTPS):

```python
import requests

proxies = {
    "http": "http://proxy.corp.example.com:8080",
    "https": "http://proxy.corp.example.com:8080",
}
resp = requests.get("https://httpbin.org/get", proxies=proxies, timeout=5)
```

这里有个容易混淆的点:即使 `value` 以 `http://` 开头,它照样可以代理 `https://...` 的请求。这是因为代理协议和目标协议是两回事——HTTP 代理通过 `CONNECT` 方法为 HTTPS 建立隧道(见 4.3)。只有在 value 用 `https://proxy...` 时,才是"代理链路本身也走 HTTPS"(较少见)。

也可以只用一个 scheme 简写:

```python
# 所有 http 流量走代理,https 不走
proxies = {"http": "http://127.0.0.1:8888"}
```

**SOCKS 代理**

SOCKS(尤其是 SOCKS5)是另一类代理协议,常用于翻墙/匿名场景。requests 默认不支持 SOCKS,需要额外装一个依赖:

```bash
pip install "requests[socks]"
# 等价于 pip install requests PySocks
```

装好后,value 用 `socks5://` 或 `socks5h://` 前缀:

```python
import requests

proxies = {
    "http": "socks5h://127.0.0.1:1080",
    "https": "socks5h://127.0.0.1:1080",
}
resp = requests.get("https://httpbin.org/get", proxies=proxies, timeout=10)
```

`socks5://` 和 `socks5h://` 的区别(DNS 在哪解析):

| 前缀         | DNS 解析位置 | 适用场景                         |
| ------------ | ------------ | -------------------------------- |
| `socks5://`  | 本地         | 目标域名本地能解析               |
| `socks5h://` | 代理服务器   | 本地 DNS 解析不到(如翻墙域名) |

翻墙场景几乎总是该用 `socks5h://`——让代理服务器去做 DNS,避免本地 DNS 污染或解析失败。漏了这个 `h` 是 SOCKS 代理最常见的配置错误。

**未装 PySocks 时的报错**

如果你没装 `requests[socks]` 却用了 socks 代理,requests 会抛一个 `MissingSchema`,提示 "Invalid Proxy URL"。遇到这个错,先检查 PySocks 是否装上。

### 2.6 代理鉴权、环境变量与环境兜底

**代理鉴权**

代理服务器要求账号密码时,把鉴权信息直接写进代理 URL:

```python
import requests

proxies = {
    "http": "http://user:pass@proxy.example.com:8080",
    "https": "http://user:pass@proxy.example.com:8080",
}
resp = requests.get("https://httpbin.org/get", proxies=proxies, timeout=5)
```

注意 URL 里的密码是明文,小心别打到日志里。如果密码里有特殊字符(如 `@`、`:`、`#`),要用 `urllib.parse.quote` 编码:

```python
from urllib.parse import quote
password = "p@ss:w0rd"
proxies = {
    "http": f"http://user:{quote(password)}@proxy.example.com:8080",
}
```

**环境变量**

requests 会读 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` 环境变量(以及小写版本 `http_proxy` 等)。如果环境里设了这些变量,即使代码里不传 `proxies`,请求也会走代理。

```bash
export HTTPS_PROXY=http://127.0.0.1:8888
python my_script.py   # 脚本里 requests 的 https 请求都会经 8888
```

这在做抓包调试时很方便:不用改代码,仅靠环境变量就能把所有请求导向 Charles/Fiddler。反过来,如果不希望某次请求走环境变量里的代理,显式传 `proxies={}`(空字典)即可覆盖。

`NO_PROXY` 环境变量则指定"哪些目标不走代理",常用于内网地址直连:

```bash
export NO_PROXY="localhost,127.0.0.1,.corp.example.com"
```

**抓包调试场景**

这是开发中最常用的代理场景:把 App/脚本的 HTTPS 流量导入 Charles(Fiddler/mitmproxy),查看实际请求内容。大致流程:

1. 启动 Charles,开启 HTTP 代理(默认 8888 端口),装好它的根证书。
2. 脚本里设代理到 Charles,同时 `verify=False` 关掉证书校验(因为 Charles 用的是自签证书):

```python
import requests

proxies = {"http": "http://127.0.0.1:8888", "https": "http://127.0.0.1:8888"}
resp = requests.get("https://httpbin.org/get",
                    proxies=proxies,
                    verify=False,   # 抓包用的自签证书,必须关校验
                    timeout=5)
```

抓包期间用 `verify=False` 是权宜之计,调试完务必恢复。`urllib3` 会为每次 `verify=False` 打一条 `InsecureRequestWarning`,提醒你这是一条不安全的连接,可以用 `urllib3.disable_warnings()` 关掉告警,但不建议长期忽略。

### 2.7 verify 与 cert:SSL 证书校验

HTTPS 请求默认会校验服务器证书——校验证书链是否可信、域名是否匹配、是否过期。这个校验由 `urllib3` 依赖的 `ssl` 模块完成。两个参数控制这一行为:

**verify**

- `verify=True`(默认):校验服务器证书,校验失败抛 `SSLError`。
- `verify=False`:跳过校验,接受任何证书。**不安全**,容易遭中间人攻击。
- `verify="/path/to/ca.pem"`:用自定义 CA 证书校验(企业内网自签 CA 场景)。

```python
import requests
import urllib3

# 关闭校验(仅抓包/内网自签用),并静默告警
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
resp = requests.get("https://self-signed.example.com", verify=False, timeout=5)
```

**cert**

`cert` 指定**客户端证书**(mTLS 双向认证场景),传一个 `.pem` 文件路径,或 `(cert, key)` 元组:

```python
# 单文件含证书和私钥
resp = requests.get("https://mtls.example.com", cert="/path/to/client.pem", timeout=5)

# 证书和私钥分开
resp = requests.get("https://mtls.example.com",
                    cert=("/path/to/client.crt", "/path/to/client.key"),
                    timeout=5)
```

**verify=False 的真实风险**

关掉校验意味着:任何能在网络链路上做中间人的人(咖啡店 WiFi、运营商、企业出口)都能用一个自签证书冒充目标服务器,解密你的全部 HTTPS 流量,而你毫无察觉。所以 `verify=False` 只能用于:

- 本地抓包调试(你自己的代理,链路可控);
- 内网自签证书服务(且你有把握链路可控)。

即便如此,生产环境更推荐的做法是把自签 CA 证书装到信任链,用 `verify="/path/to/ca.pem"` 校验,而不是整个关掉。

### 2.8 Session + HTTPAdapter + Retry:自动重试与连接池

到这一节,前面分散的"超时""重试""代理"都要在 `Session` 上收口。`Session` 是 requests 提供的会话对象,带来两个关键能力:

1. **连接池复用**:同一个 Session 对多个请求复用底层 TCP 连接(TCP keep-alive),省去重复握手,性能提升明显。
2. **统一配置**:在 Session 上设一次 `headers`/`proxies`/`verify`,后续所有请求自动带上,不用每次重复传。

**基础用法**

```python
import requests

session = requests.Session()
session.headers.update({"User-Agent": "my-app/1.0"})
session.proxies.update({"https": "http://127.0.0.1:8888"})

# 后续请求自动带 UA、走代理
resp1 = session.get("https://httpbin.org/get", timeout=5)
resp2 = session.get("https://httpbin.org/anything", timeout=5)

session.close()  # 用完关闭,释放连接池
```

**挂载 HTTPAdapter**

`Session.mount(prefix, adapter)` 把一个 `HTTPAdapter` 挂到某个 URL 前缀上。`HTTPAdapter` 负责底层连接池管理和重试策略。

```python
import requests
from requests.adapters import HTTPAdapter

session = requests.Session()
adapter = HTTPAdapter(
    pool_connections=10,    # 连接池保留多少条连向不同 host 的连接
    pool_maxsize=10,        # 每个连接池最多多少条连接
    max_retries=3,          # 重试次数(简写,等价于 Retry(total=3))
)
session.mount("https://", adapter)
session.mount("http://", adapter)
```

`max_retries` 可以直接传整数(简写),但更强大的是传一个 `urllib3.util.retry.Retry` 对象,精细控制重试策略。

**用 Retry 精细控制重试**

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(
    total=3,                      # 最多重试 3 次
    connect=2,                    # 其中连接错误最多重试 2 次
    read=2,                       # 其中读取错误最多重试 2 次
    backoff_factor=0.5,           # 退避因子:第 n 次重试前睡 0.5 * 2^(n-1) 秒
    status_forcelist=[500, 502, 503, 504],  # 这些状态码也触发重试
    allowed_methods=["GET", "HEAD"],        # 仅幂等方法重试(默认)
    raise_on_status=False,        # 状态码在 forcelist 内、重试耗尽后不抛(返回最后一个响应)
)

adapter = HTTPAdapter(max_retries=retry)
session = requests.Session()
session.mount("https://", adapter)
session.mount("http://", adapter)

# 现在所有经 session 发的请求,遇到超时/连接错误/指定状态码都会自动重试
resp = session.get("https://httpbin.org/status/500", timeout=5)
print(resp.status_code)
# 输出：500  (重试 3 次后仍是 500,返回最后一个响应)
```

**backoff_factor 退避公式**

`Retry` 的退避时间是 `backoff_factor * 2 ** ( Retry 尝试次数 - 1 )`,但第一次重试不睡(0 秒)。设 `backoff_factor=0.5` 时:

| 重试轮次 | 睡眠时间 |
| -------- | -------- |
| 第 1 次  | 0 秒     |
| 第 2 次  | 1.0 秒   |
| 第 3 次  | 2.0 秒   |

指数退避的好处是:一次小抖动很快重试就能恢复;如果是服务端真的挂了,退避会快速变长,避免对已经挂掉的服务端火上浇油。

**为什么只重试幂等方法**

`Retry.allowed_methods` 默认是 `["GET", "HEAD", ...]` 这类幂等方法。`POST`/`PATCH` 默认不重试,因为重试可能导致重复下单/重复扣款。如果你的 POST 确实幂等(比如带去重 key),可以显式加进 `allowed_methods`。

### 2.9 把超时设为 Session 级默认值的工程做法

到这一步,上一节"不设 timeout 的危险"还留了个尾巴:每次请求都要手写 `timeout`,容易漏。一个工程上常用的做法是继承 `Session`、覆写 `request` 方法,把 `timeout` 设成默认值。

```python
import requests

class SafeSession(requests.Session):
    """带默认超时的 Session,杜绝漏设 timeout。"""
    DEFAULT_TIMEOUT = 5

    def request(self, method, url, **kwargs):
        # 调用方没显式传 timeout,就塞默认值
        kwargs.setdefault("timeout", self.DEFAULT_TIMEOUT)
        return super().request(method, url, **kwargs)

session = SafeSession()
# 即便没写 timeout,也有 5 秒兜底
resp = session.get("https://httpbin.org/get")
# 输出：<Response [200]>
```

这一招在生产里很实用——把"禁止裸奔请求"这个规则直接焊进基础设施,谁忘写都不会出大事故。配合 `HTTPAdapter + Retry`,一个健壮的 HTTP 客户端基座就搭好了。

## 3. 最佳实践

### 3.1 所有请求都必须设 timeout

这是全文最重要的一条。不设 timeout 的请求在 99% 的时间看起来都正常,但只要遇到一次网络黑洞,就会把线程/进程拖死,而你线上第一次发现时往往已经是雪崩。

**推荐**:用 2.9 的 `SafeSession` 兜底,从机制上消灭"裸奔请求"。哪怕默认值设得宽一点(比如 30 秒),也比无限等待强。

**不推荐**:

```python
# 不推荐:依赖每个开发者自觉
resp = requests.get(url)
```

**推荐**:

```python
# 推荐:机制兜底 + 显式声明
resp = session.get(url, timeout=(3, 10))
```

### 3.2 区分连接超时与读取超时

把两个阶段一刀切同一个值,在很多场景下不合理:连接应该很快(本地或同区域,亚秒级),而读取可能需要更久(查询慢、下载大)。给一个 `timeout=30` 既容忍了连接阶段的慢(本该快速失败),又限制了读取(可能不够)。

**推荐**:用元组 `(connect, read)` 分别设值,连接超时设小(1~5 秒,逼快速失败),读取超时按业务允许的最大等待设。

```python
# 推荐:连接要快,读取允许慢
timeout = (3, 30)
```

### 3.3 重试要克制,退避要指数

重试不是越多越好。对已经过载的服务端,每次重试都是额外压力,几轮重试可能把服务端彻底打挂。原则:

- **只重试幂等方法**(GET/HEAD/PUT/DELETE),POST 默认不重试。
- **重试次数 2~3 次足够**,更多次通常无济于事。
- **必须带退避**,最好是指数退避(`backoff_factor`),给服务端喘息时间。
- **区分错误类型**:连接超时/读超时/5xx 可重试;4xx(请求本身错)、`ConnectionRefusedError`(服务没起)重试无意义。
- **不要无限重试**。重试耗尽要能抛出或降级,不要把重试当"等它自己好"的手段。

### 3.4 代理配置优先走 Session / 环境变量

每次请求都传一遍 `proxies` 字典,既啰嗦又容易漏。推荐:

- 全脚本/全服务统一走代理:设 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量,代码零侵入。
- 某个客户端走代理:在 `Session.proxies` 上设一次,后续自动带。
- 只在抓包调试时临时走代理:设环境变量,完事 unset。

记得 `NO_PROXY` 把内网地址排出去,避免内网请求绕一圈代理。

### 3.5 verify=False 是红线

`verify=False` 出现在生产代码里,基本就是事故隐患。排查清单:

- 抓包调试:允许,但必须只在调试分支/调试环境,合并到主干前删掉。
- 内网自签证书:优先用 `verify="/path/to/ca.pem"`,把内网 CA 装进信任链,而不是整体关校验。
- 永远不要因为"证书报错懒得弄"就 `verify=False`。正确做法是定位根因(系统 CA 过期?中间证书缺失?域名不匹配?)。

代码评审时看到 `verify=False`,应当要求提交者说明理由,并确认有 `# noqa`/注释标明场景。

### 3.6 用 Session + Adapter 收口 HTTP 客户端

不要在多处散着用 `requests.get`。工程上推荐一个进程/一个服务用一个全局 `Session`(线程安全),上面挂好 `HTTPAdapter + Retry`,设好默认 `headers`/`proxies`/`timeout`。所有请求都从这一个口子走,配置集中、连接池复用、行为一致。

```python
# 推荐的客户端基座
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def make_session(default_timeout=5):
    retry = Retry(total=3, backoff_factor=0.5,
                  status_forcelist=[502, 503, 504],
                  allowed_methods=["GET", "HEAD"])
    adapter = HTTPAdapter(pool_connections=10, pool_maxsize=10, max_retries=retry)

    session = SafeSession()
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": "my-app/1.0"})
    session.DEFAULT_TIMEOUT = default_timeout
    return session

# 进程级单例
http = make_session(default_timeout=(3, 10))
```

`SafeSession` 见 2.9 。注意 `requests.Session` 不是为多进程安全设计的(多进程各自建 Session),但在单进程多线程下可以共享。

### 3.7 关闭资源,避免连接泄漏

`Session` 持有连接池,用完不关会留下 socket 在 TIME_WAIT 等状态,长期累积可能耗尽端口/文件描述符。

**推荐**:

```python
# 推荐:with 上下文管理,自动关闭
with requests.Session() as session:
    resp = session.get(url, timeout=5)
```

或显式 `session.close()`。长期运行的服务里,Session 作为单例不 close 也可以(进程退出时 os 回收),但要确保不是每次请求都 new 一个 Session 又不关。

### 3.8 警惕"超时了但请求已发出"

这是 HTTP 超时最阴险的一点:客户端超时只是"我不等了",但请求**已经发到服务端**,服务端可能正在处理甚至已经处理完。如果你在重试时再次发同样的请求,对非幂等接口(如下单)就是重复操作。

应对:

- 对非幂等接口,用幂等键( requestId / idempotency key ),服务端靠 key 去重。
- 重试前想清楚"这个请求重发安全吗",不确定就别让 `Retry` 自动重试,改成人工处理。
- 超时后,别假定服务端没收到,也别假定收到了——按"可能收到了"来设计。

### 3.9 给超时和重试加可观测性

超时和重试是"看不见就管不好"的环节。生产环境务必让它们可观测:

- **记录每次重试**:urllib3 的重试默认不打日志,可以接 `logging.getLogger("urllib3.util.retry")`,或在 `Retry` 子类里覆写 `increment` 打点。
- **区分超时类型上报**:`ConnectTimeout` 和 `ReadTimeout` 分开计数,指标里打上 `stage=connect|read` 标签,排查时一眼看出是网络层还是处理层。
- **重试次数也要上报**:重试率升高往往先于故障暴露,是重要的早期信号。
- **慢请求 trace**:结合 `time.monotonic()` 把连接、首字节、完整响应各阶段时长记下来,出问题时能定位卡在哪段。

```python
import requests
import time
import logging

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("http")

def timed_get(session, url, **kw):
    t0 = time.monotonic()
    try:
        resp = session.get(url, **kw)
    except requests.exceptions.RequestException as e:
        elapsed = time.monotonic() - t0
        log.error("url=%s elapsed=%.2f exc=%s", url, elapsed, type(e).__name__)
        raise
    elapsed = time.monotonic() - t0
    log.info("url=%s status=%s elapsed=%.2f", url, resp.status_code, elapsed)
    return resp

session = requests.Session()
timed_get(session, "https://httpbin.org/get", timeout=(3, 5))
# 输出：2026-07-23 ... INFO http url=https://httpbin.org/get status=200 elapsed=0.45
```

把这段埋点铺到所有出站请求,线上出现"偶发慢"或"偶发超时"时才有据可查,而不是两眼一抹黑。

### 3.10 生产环境的超时分层

单个 `timeout` 值管不了整条调用链。真实系统里超时是分层的,各层各管一段:

- **客户端读超时**:最内层,如 `read=10`,管"这一次 HTTP 请求"。
- **上游调用超时**:你的服务被别人调用,外层也有个超时,如网关 30 秒。你的 `read` 必须小于外层,否则外层先超时,你的请求白做。
- **下游依赖超时**:你的服务又去调 DB/缓存/第三方,每层都有超时。

**核心原则**:超时要"由外向内递减",最外层最大、最内层最小,保证内层先失败、外层还能拿到结果(哪怕是失败结果),不至于外层傻等内层。比如网关给 30 秒,你的 HTTP 客户端给 10 秒,你的 DB 查询给 5 秒——一层层留余量。

违反这条原则的典型表现:网关 30 秒超时报给用户,但你的下游 DB 查询 60 秒才返回,结果网关已经 504 了,你的服务还在空跑,DB 压力一点没降。

## 4. 原理

这一章把前面用到的几个机制拆开,看 requests/urllib3/socket 是怎么协作的。理解原理不是为了改源码,而是为了在"行为不符合预期"时能快速定位。

### 4.1 timeout 如何映射到 socket 的 connect/read 超时

requests 自己不做网络 IO,真正的网络层在 `urllib3`,再下面是 Python 标准库的 `socket`。`timeout` 参数最终被翻译成 socket 层的两个超时。

**连接阶段**

`urllib3` 在建立连接时,对 `socket.create_connection((host, port), timeout=connect)` 传入 `connect` 超时。这个超时作用于 TCP 三次握手:从发送 SYN 到收到 SYN-ACK 的允许时长。内核在此期间会按 `connect` 超时定时重传 SYN(通常 3 次重试,每次约 1~2 秒),到达超时上限还没握手成功就放弃,抛 `socket.timeout`(Windows 上可能是 `TimeoutError`/`ConnectionRefusedError` 视情况)。

握手成功后,`urllib3` 会立刻把 socket 的超时设成 `read` 值——`sock.settimeout(read)`,准备进入读取阶段。

**读取阶段**

读取阶段,`urllib3` 调用 `sock.recv(...)` 读响应数据。`settimeout(read)` 让 `recv` 在 `read` 秒内没数据可读时抛 `socket.timeout`。关键是这里 `read` 的含义不是"读完整个响应的总时长",而是**单次 recv 调用的超时**——也就是说,服务器只要每隔不超过 `read` 秒发来一点点数据,`recv` 就不会超时,即便整个响应体传了很久。

这就是 2.1 里"慢慢吐数据的服务器不会超时"的底层原因:每次 `recv` 都在 `read` 内拿到了一点字节,计时器被反复重置。想限制"整个响应体下载总时长",靠 `timeout` 做不到,得在应用层用 `time.monotonic()` 自己计时,或用流式读取 + 主动中断。

**单值 timeout 如何拆分**

当传入 `timeout=5`(单值)时,requests 内部把它同时用作 `connect` 和 `read`,即等价于 `(5, 5)`,而不是总时长 5 秒。

`socket.timeout` 被 urllib3 捕获后,根据发生在 connect 还是 read 阶段,分别包装成 `ConnectTimeoutError` / `ReadTimeoutError`(urllib3 层),再到 requests 层映射为 `requests.exceptions.ConnectTimeout` / `ReadTimeout`,两者都继承 `requests.exceptions.Timeout`。这就是 2.3 异常层次的来源。

### 4.2 连接超时 vs 读取超时的阶段差异

两个阶段对应的网络动作完全不同,理解差异有助于排障。

**连接阶段**涉及的动作:

1. DNS 解析(把域名变 IP)。这一步本身可能很慢,但 requests 的 `timeout` **不覆盖 DNS 解析**——DNS 在 `socket.create_connection` 之前由 `getaddrinfo` 完成,使用系统默认超时。这是另一个"设了 timeout 还是会卡"的来源:DNS 卡住时 timeout 帮不了你。
2. TCP 三次握手(SYN / SYN-ACK / ACK)。
3. 对 HTTPS,还有 TLS 握手(ClientHello / ServerHello / 证书校验 / 密钥交换)。TLS 握手也被算在 connect 阶段里,受 `connect` 超时约束。

连接超时往往意味着"压根到不了对方":网络不通、防火墙丢包、对方宕机。重试有概率恢复(可能只是瞬时抖动)。

**读取阶段**涉及的动作:连接已建立,客户端发完请求,等服务端回响应字节。`read` 超时往往意味着"对方收到了但处理慢":DB 慢查询、下游依赖卡顿、大响应体传输慢。这类问题重试多半还是慢,根治得从服务端下手。

排障口诀:

- 看到大量 `ConnectTimeout` → 网络层/对方可用性问题,查网络、查对方是否存活。
- 看到大量 `ReadTimeout` → 对方处理能力问题,查对方慢日志、依赖链路。

### 4.3 proxies 如何影响 urllib3 的 ProxyManager

requests 的代理最终落到 urllib3 的连接管理上。大致链路:

1. requests 把 `proxies` 字典归一化(协议匹配、和 `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` 环境变量合并、`proxy_bypass` 判断某 URL 是否该绕过代理)。
2. 对每个需要走代理的 scheme,urllib3 用一个 `ProxyManager` 持有到代理服务器的连接池。
3. 发请求时:
   - HTTP 目标:urllib3 向代理发一个带完整 URL 的 `GET http://target/...`,代理转发。
   - HTTPS 目标:urllib3 向代理发 `CONNECT target:443`,代理建立一条到目标 443 的 TCP 隧道,随后客户端在隧道里直接和目标做 TLS 握手——代理看不到明文。这就是为什么 2.5 里"HTTP 代理能代理 HTTPS"。

**环境变量怎么生效**

requests 在 `requests.utils.get_environ_proxies(url, no_proxy)` 里判断:如果 `no_proxy` 命中 url 的 host,就不走代理;否则合并 `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY`。这意味着:

- 设了 `HTTPS_PROXY` 后,即便代码里没传 `proxies`,HTTPS 请求也会走代理。
- 显式传 `proxies={}` 会覆盖环境变量,完全不走代理。

**SOCKS 为什么需要 PySocks**

urllib3 原生只支持 HTTP/HTTPS 代理。SOCKS 是另一种协议(在 OSI 第 5 层做代理),需要 `socks.create_connection` 替换底层 `socket.create_connection`。`requests[socks]` 装的 PySocks 就是干这个的:它在 urllib3 建立连接前 monkey-patch socket 层,把 `create_connection` 换成支持 SOCKS 的版本。没装这个包,`socks5://` 这个 scheme 解析不了,就报 `MissingSchema`。

### 4.4 verify=False 关掉了什么

HTTPS 握手时,服务端发来证书,客户端要验:

1. 证书链能链到信任的根 CA(系统/`certifi` 包内置的根证书列表);
2. 证书里的域名和实际访问的域名匹配(SNI/Hostname 校验);
3. 证书没过期、没被吊销(CRL/OCSP,requests/urllib3 默认不做 OCSP stapling)。

`urllib3` 把这些校验委托给 `ssl.SSLContext`:`verify=True` 时创建一个开启了 `CERT_REQUIRED` 的 context,并加载 `certifi` 的 CA bundle;`verify=False` 时把 context 的 `check_hostname` 设 `False`、`verify_mode` 设 `CERT_NONE`,即什么都不验。

风险:中间人(MITM)在链路上截获连接,用一个自签证书冒充目标服务器,客户端不验就直接信任,后续所有"HTTPS"流量对中间人可见明文。TLS 在这里完全失去了防窃听/防篡改的意义。

`verify="/path/to/ca.pem"` 则是中间路线:不udit 系统信任链,只udit 这个自定义 CA 的证书,既兼容自签,又保留校验,是内网场景的推荐做法。

### 4.5 HTTPAdapter + urllib3 Retry 的重试与退避机制

`HTTPAdapter` 是 requests 通往 urllib3 的桥梁:它持有一个 `PoolManager`(普通)或 `ProxyManager`(有代理时),管理连接池;`max_retries` 参数控制重试。

**Retry 的工作位置**

重试发生在 urllib3 层、`HTTPConnectionPool.urlopen` 里。每次请求遇到下列情况之一,urllib3 会判断是否重试:

- 网络异常:`ConnectTimeoutError`、`ReadTimeoutError`、`ProtocolError`(连接被重置等);
- 状态码:响应状态码在 `status_forcelist` 里。

如果决定重试,urllib3 会按 `backoff_factor` 算出睡眠时间,睡完后用同一个连接池发下一次请求。整个过程对外透明——`session.get(...)` 调用方只看到最后一次的响应或最终抛出的异常。

**退避公式**

`Retry.get_backoff_time(retry_count)` 返回 `backoff_factor * (2 ** (retry_count - 1))`(`retry_count` 从 1 起),但 `Retry.RETRY_AFTER_STATUS` 响应(`429`/`503` 带 `Retry-After` 头)会优先用服务端给的等待时间,更礼貌。

指数退避的意义:第一次重试马上试(也许是瞬时抖动),第二次等一会,第三次等更久——既能快速恢复瞬时故障,又能在持续故障时快速退避,避免压垮对方。比起固定间隔,指数退避对服务端更友好。

**`raise_on_status` 的细节**

`raise_on_status=False`(默认)时,状态码在 `status_forcelist` 内、重试耗尽后,urllib3 返回最后一个响应(比如 500),不抛异常——`session.get` 拿到的是 `<Response [500]>`。若设 `True`,耗尽后抛 `MaxRetryError`/`RetryError`。工程上多见 `False`,因为应用层想自己靠 `resp.raise_for_status()` 决定怎么处理 5xx,而不是被底层劫持成异常。

**`allowed_methods` 与幂等性**

默认只重试 `["GET", "HEAD", ...]` 等幂等方法。这是安全的默认值——重试 `POST` 可能让服务端执行两次副作用。`Retry` 之所以把方法做成显式白名单,正是为了提醒:重试前先想"重发是否安全"。

**为什么 Retry 对超时也生效**

`ConnectTimeoutError`/`ReadTimeoutError` 属于 `Retry` 默认会处理异常。所以挂上 `Retry` 的 Session,遇到超时会自动重试——你前面手写的 `time+try/sleep` 那一套,`Retry` 帮你做完了,还更精细。

### 4.6 timeout 不覆盖的阶段(边界与盲区)

`timeout` 看似管一切,其实有几段它管不到,排障时要心里有数:

1. **DNS 解析**:如前述,`getaddrinfo` 在 socket connect 之前,不受 `timeout` 约束,走系统 DNS 超时(常 5~30 秒)。DNS 卡住时,`timeout=3` 可能变成 30 秒才返回。
2. **重定向的每一段**:requests 的 `allow_redirects=True` 时,一次请求可能对应多次底层 HTTP 请求(每段重定向一次),`timeout` 作用于**每一段**,不是总时长。重定向链很长时,总时间可能远超 `timeout`。
3. **响应体慢速持续传输**:如 4.1 所述,`read` 是单次 recv 的超时,服务器慢慢吐字节就绕过它。
4. **代理建立隧道的 `CONNECT`**:理论上 `connect` 覆盖到代理握手,但某些代理实现下,`CONNECT` 隧道建立后的初始字节等待,到底算 connect 还是 read,边界模糊,遇到时建议放宽 read。

知道这些盲区,在"明明设了 timeout 还是卡很久"时,才能往正确方向查(DNS?重定向?流式响应?)。

## 5. 总结

### 5.1 本文内容要点

- **超时是工程红线**:requests 默认 `timeout=None` 无限等待,任何不设超时的请求都是潜在挂死点。所有请求必须设 `timeout`。
- **timeout 两种形式**:单值 `5` 等价于 `(5, 5)`,作用于连接和读取两个阶段;元组 `(connect, read)` 分开设值,推荐用元组,连接设小、读取按业务设。
- **读取超时是单次 recv 超时**,不是整个响应体时长;慢速吐数据的服务器会绕过它。
- **异常层次**:`ConnectTimeout`(连接)/`ReadTimeout`(读取)都继承 `Timeout`,再往上是 `RequestException`。捕获先子后父。
- **重试组合**:手写 `for+try+sleep` 朴素可用,生产用 `Session + HTTPAdapter + urllib3.Retry`,支持指数退避、状态码白名单、幂等方法白名单。
- **代理三种协议**:HTTP/HTTPS(默认支持)用 `http://` 前缀,HTTPS 代理通过 `CONNECT` 建隧道;SOCKS 需 `requests[socks]`,`socks5h://` 让代理做 DNS。
- **代理鉴权**:用户密码写进 URL,特殊字符用 `quote` 编码。环境变量 `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` 全局生效,显式传 `proxies={}` 覆盖。
- **SSL**:`verify=False` 关校验仅用于抓包/内网自签,生产用 `verify="ca.pem"` 自定义 CA 更安全;`cert` 指定客户端证书做 mTLS。
- **Session 收口**:一个进程一个 `Session`,挂 `HTTPAdapter+Retry`,设默认 `headers`/`proxies`/`timeout`,连接池复用、配置集中、自动重试。
- **`SafeSession` 兜底**:覆写 `request` 给 `timeout` 设默认值,从机制上杜绝裸奔请求。
- **原理要点**:`timeout` 最终映射到 socket `connect` 超时与 `settimeout(read)`;代理经 urllib3 `ProxyManager` 走(HTTPS 走 `CONNECT` 隧道);`verify=False` 关掉 `ssl.SSLContext` 的校验;`Retry` 在 urllib3 层按指数退避重试,仅对幂等方法默认重试。
- **盲区**:`timeout` 不覆盖 DNS、不覆盖重定向总时长、不覆盖慢速流式响应;超时只代表"我不等了",不代表请求没发出去,非幂等接口重试要配幂等键。

### 5.2 读完应能掌握

- 能说明 `timeout=5` 与 `timeout=(3, 10)` 的差异,并能解释"读取超时是单次 recv 超时而非总时长"。
- 能写出一个带默认超时的 `SafeSession`,从机制上保证所有请求不裸奔。
- 能精准捕获 `ConnectTimeout`/`ReadTimeout`/`ConnectionError`,并说明何时该重试、何时不该。
- 能用 `Session + HTTPAdapter + Retry` 搭建一个带连接池、指数退避、状态码白名单的健壮 HTTP 客户端。
- 能为 HTTP/HTTPS/SOCKS 三种代理写出正确的 `proxies` 字典,知道 `socks5` 与 `socks5h` 的区别、何时用哪个。
- 能配置代理鉴权、`NO_PROXY`、抓包代理 + `verify=False`,并说明 `verify=False` 的安全风险与 `verify=ca.pem` 的替代方案。
- 能说明 `cert` 参数在 mTLS 双向认证中的作用。
- 在"设了 timeout 还是卡很久"时,能按 DNS / 重定向 / 流式响应 / 代理隧道几个方向排查。
- 能解释为何非幂等方法的 `POST` 默认不在 `Retry.allowed_methods` 内,以及何时可以显式加入。