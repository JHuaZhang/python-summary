# python总结

网站地址可访问：

1. **服务器自部署地址（主要）**：https://handn.fun/apps/python-summary/
2. GitHub Pages（部署已暂停，页面为历史版本）：https://jhuazhang.github.io/python-summary

> Vercel 部署已弃用。

## 自动部署说明

代码推送到 `main` 分支后，[GitHub Actions](.github/workflows/deploy.yml) 自动完成：

```
push main → 构建（BASE_PATH=/apps/python-summary/）→ 清理冒号文件名 → SSH + scp 上传 → nginx 直接服务
```

- 服务器：`handn.fun`（IP：`111.230.115.143`）
- 服务器部署目录：`/home/zjh/project/apps/python-summary/prod/`
- nginx 使用 `/apps/<appId>/` 通用规则直接服务产物，**无需改任何 nginx 配置**

---

## 部署配置指南（首次部署必读）

### 1. 服务端准备（一次性）

#### ① 生成无密码 SSH 密钥（本地电脑执行）

CI 无法输入密码，必须用**无密码密钥**免密登录。本地已有 `~/.ssh/deploy_key_nopass` 可跳过生成，但公钥仍需按步骤 ② 添加到本台服务器：

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key_nopass -N "" -C "github-actions-deploy"
```

生成两个文件：

| 文件 | 去向 |
|---|---|
| `~/.ssh/deploy_key_nopass` | 私钥 → 配到 GitHub Secrets 的 `SSH_PRIVATE_KEY` |
| `~/.ssh/deploy_key_nopass.pub` | 公钥 → 添加到服务器 `authorized_keys` |

> ⚠️ **本节命令都在本地电脑执行**。私钥永远只留在本地，**服务器上没有 `~/.ssh/deploy_key_nopass` 是正常的**——服务器侧最终只会多一行公钥记录（`~/.ssh/authorized_keys`），不要在服务器上找私钥。

#### ② 公钥写入服务器（本地电脑执行）

```bash
ssh-copy-id -i ~/.ssh/deploy_key_nopass.pub zjh@111.230.115.143

# 验证免密登录，输出 ok 即成功
ssh -i ~/.ssh/deploy_key_nopass zjh@111.230.115.143 'echo ok'
```

> 注意：`SERVER_USER` 用什么用户，这里公钥就写到什么用户下（示例为 `zjh`）。

#### ③ 创建部署目录（服务器上执行）

```bash
ssh zjh@111.230.115.143
mkdir -p /home/zjh/project/apps/python-summary/prod
```

目录所有者必须与登录用户一致。如果用 root 建目录、用 `zjh` 部署，补一次授权：

```bash
chown -R zjh:zjh /home/zjh/project/apps/python-summary
```

### 2. 配置 GitHub Secrets

入口：GitHub 仓库 → **Settings → Secrets and variables → Actions → New repository secret**，逐个添加以下 4 个：

| Secret 名称 | 作用 | 填什么 |
|---|---|---|
| `SSH_PRIVATE_KEY` | Actions 登录服务器的私钥 | 本地执行 `cat ~/.ssh/deploy_key_nopass` 的**完整输出** |
| `SERVER_HOST` | 服务器地址 | `111.230.115.143` |
| `SERVER_USER` | SSH 登录用户名 | `zjh`（以实际登录用户为准） |
| `TARGET_PATH` | 部署目标目录 | `/home/zjh/project/apps/python-summary/prod` |

**为什么用密钥而不是密码**：

- GitHub Actions 是**非交互环境**，ssh 弹出的 `password:` 提示无人能输入，连接会一直挂到超时失败——密钥免密是 CI 自动化的唯一正路（密码自动化需借助 `sshpass` 明文喂密码，属于反模式，不推荐）
- 登录密码是整个服务器的门禁，存进 Secrets 一旦泄露等于交出全部权限；部署密钥是**单一用途凭据**，作废只需删掉服务器 `authorized_keys` 里那一行，你平时 `ssh zjh@111.230.115.143` 输密码登录的习惯完全不受影响

**`SSH_PRIVATE_KEY` 最容易踩坑**：必须从 `-----BEGIN` 行复制到 `-----END` 行，一行不少：

```
-----BEGIN RSA PRIVATE KEY-----        ← 也可能是 -----BEGIN OPENSSH PRIVATE KEY-----，取决于密钥类型
（中间所有行全部复制）
-----END RSA PRIVATE KEY-----          ← 与 BEGIN 对应
```

少复制首尾行、或私钥带了 passphrase，都会在「Test SSH Connection」步骤报 `Permission denied`。

**`TARGET_PATH` 说明**：这是流水线「清理目录 + scp 上传」的目标，必须与 nginx 通用路由对齐：

```
URL：https://handn.fun/apps/python-summary/
磁盘：/home/zjh/project/apps/python-summary/prod
```

填错位置时即使流水线全绿，页面也会 404。

> 四个 Secrets 都配好后，workflow 中通过 `${{ secrets.X }}` 引用。任何一个缺失，Actions 第一步「Validate Required Secrets」会直接报出缺哪个的名称。

### 3. 验证部署

1. 将改动推送到 `main` 分支（Actions 自动触发；也可在 Actions 页面手动 Run workflow）
2. 确认流水线 14 步全绿，重点看：`Test SSH Connection` → `Clean Target Directory` → `Deploy with scp` → `Verify Deployment`
3. 浏览器访问：<https://handn.fun/apps/python-summary/>
4. 服务器侧抽查（可选）：

```bash
ssh zjh@111.230.115.143 'ls /home/zjh/project/apps/python-summary/prod/ | head -10'
```

### 4. 常见问题排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `Validate Required Secrets` 直接红 | 某 Secret 未配置或名字拼错 | 按该步骤报错中提示的名称去补配 |
| `Test SSH Connection` 报 Permission denied | 公钥没进服务器 `authorized_keys`，或私钥不完整 | 重跑 `ssh-copy-id`；检查私钥是否含首尾行 |
| 流水线全绿但页面 404 | `TARGET_PATH` 填错 | 改成 `/home/zjh/project/apps/python-summary/prod` |
| 页面能开但样式、图片 404 | 构建缺少 base 路径，资源请求指向了 `/static/...` | 确认 Build 步骤带 `BASE_PATH=/apps/python-summary/`（deploy.yml 已内置） |
| `Deploy with scp` 阶段报错 | 构建产物含冒号文件名，scp 将其误判为 `host:path` | 「Clean Invalid Filenames」步骤会自动改名处理，确认该步骤位于 scp 之前且未被改动 |

### 5. 复用到其他前端项目

同一台服务器、同一套思路，只需把 `python-summary` 换成新应用的 appId：

1. `deploy.yml` 的 Build 步骤：`BASE_PATH=/apps/<新appId>/`
2. Secrets 的 `TARGET_PATH`：`/home/zjh/project/apps/<新appId>/prod`
3. 服务器执行一次：`mkdir -p /home/zjh/project/apps/<新appId>/prod`

nginx 不用动，推送后即可通过 `https://handn.fun/apps/<新appId>/` 访问。
