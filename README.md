# python总结

网站地址可访问：

1. **服务器自部署地址（主要）**：https://handn.fun/apps/python-summary/
2. GitHub Pages（部署已暂停，页面为历史版本）：https://jhuazhang.github.io/python-summary

> Vercel 部署已弃用。

## 自动部署说明

代码推送到 `main` 分支后，[GitHub Actions](.github/workflows/deploy.yml) 自动完成：

```
push main → 构建（BASE_PATH=/apps/python-summary/）→ 清理冒号文件名 → SSH + rsync 差量同步（--delete 自动清理旧文件）→ nginx 直接服务
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

**`TARGET_PATH` 说明**：这是流水线「rsync 差量同步」的目标目录，必须与 nginx 通用路由对齐：

```
URL：https://handn.fun/apps/python-summary/
磁盘：/home/zjh/project/apps/python-summary/prod
```

填错位置时即使流水线全绿，页面也会 404。

> 四个 Secrets 都配好后，workflow 中通过 `${{ secrets.X }}` 引用。任何一个缺失，Actions 第一步「Validate Required Secrets」会直接报出缺哪个的名称。

### 3. 首次全量 seed（本地电脑执行）

GitHub Actions 的 runner 在海外，到国内服务器的跨境上行带宽很窄（常不足 100 KB/s），而构建产物包含 docs 的全部图片（约 40MB+），**全量通过 CI 上传会耗时十几分钟**。因此全量场景（首次部署 / 目录被清空重建）一律在本地做——本地到服务器是国内对国内，快几个数量级：

```bash
# 1. 本地构建（与 CI 完全一致）
pnpm install && pnpm run nav
BASE_PATH=/apps/python-summary/ pnpm run build

# 2. 冒号文件名清理（与 CI 一致）
find dist -depth -name '*:*' | while read item; do mv "$item" "$(echo "$item" | tr ':' '_')"; done

# 3. 全量同步（1~2 分钟；此后的 CI 差量以此为基准）
rsync -az --whole-file --size-only --delete --stats \
  -e "ssh -i ~/.ssh/deploy_key_nopass" \
  ./dist/ zjh@111.230.115.143:/home/zjh/project/apps/python-summary/prod/
```

seed 完成后，日常 push 触发的 CI rsync 只传"文件名或大小变化"的文件（通常几十 KB，十几秒完成）。

> 极端情况：若"内容改了但字节数恰好相同"导致个别页面未更新（`--size-only` 的理论盲区），本地跑一遍
> `rsync -az --checksum --delete -e "ssh -i ~/.ssh/deploy_key_nopass" ./dist/ zjh@111.230.115.143:/home/zjh/project/apps/python-summary/prod/`
> 强制按内容对齐。

### 4. 验证部署

1. 将改动推送到 `main` 分支（Actions 自动触发；也可在 Actions 页面手动 Run workflow）
2. 确认流水线 14 步全绿，重点看：`Test SSH Connection` → `Prepare Target Directory` → `Deploy with rsync` → `Verify Deployment`（rsync 步骤日志里的 `--stats` 会显示本次实际传输的文件数，可直观看到差量效果）
3. 浏览器访问：<https://handn.fun/apps/python-summary/>
4. 服务器侧抽查（可选）：

```bash
ssh zjh@111.230.115.143 'ls /home/zjh/project/apps/python-summary/prod/ | head -10'
```

### 5. 常见问题排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `Validate Required Secrets` 直接红 | 某 Secret 未配置或名字拼错 | 按该步骤报错中提示的名称去补配 |
| `Test SSH Connection` 报 Permission denied | 公钥没进服务器 `authorized_keys`，或私钥不完整 | 重跑 `ssh-copy-id`；检查私钥是否含首尾行 |
| 流水线全绿但页面 404 | `TARGET_PATH` 填错 | 改成 `/home/zjh/project/apps/python-summary/prod` |
| 页面能开但样式、图片 404 | 构建缺少 base 路径，资源请求指向了 `/static/...` | 确认 Build 步骤带 `BASE_PATH=/apps/python-summary/`（deploy.yml 已内置） |
| `Deploy with rsync` 阶段报错 | 构建产物含冒号文件名，rsync 与 scp 一样会把带冒号的文件名误判为 `host:path` | 「Clean Invalid Filenames」步骤会自动改名处理，确认它位于传输步骤之前且未被改动 |
| `pages build and deployment`（github-pages[bot] 触发）报 Liquid 错误 | GitHub Pages 处于"从分支部署"模式，Jekyll 把笔记中 Python 的 `{{`（f-string 字面大括号）当成模板变量解析 | 与服务器部署无关，无需改笔记内容；Settings → Pages → Source 改为 **None** 关闭 Pages 即可 |
| `Install Dependencies` 报 `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION` | CI 的 pnpm（v8）与本地环境脱节：`pnpm-lock.yaml`（`lockfileVersion 9.0`）和 `pnpm-workspace.yaml`（`allowBuilds`）都是 pnpm 11 生成的，v8 读不懂 | deploy.yml 的 `version` 对齐本地 `pnpm --version` 大版本（当前 **11**）、`node-version` 对齐本地 `node --version` 大版本（当前 **22**） |
| `Deploy with rsync` 报 `Permission denied` | 旧部署产物归 root 所有（Jenkins 容器时代以 root 写入 volume），CI 登录用户无权删除或覆盖这些文件 | 服务器上一次性处理：`sudo rm -rf /home/zjh/project/apps/python-summary/prod` → `sudo mkdir -p /home/zjh/project/apps/python-summary/prod` → `sudo chown -R <SERVER_USER> /home/zjh/project/apps/python-summary`（此后 CI 写入的文件都归它自己，不会再撞权限） |
| rsync 后服务器产物路径变成了 `prod/dist/...` | 源路径少了尾斜杠：`./dist` 会把 dist 目录本身同步进目标，`./dist/`（带斜杠）才是同步"目录内容" | deploy.yml 中 rsync 源路径必须写 `./dist/`，改完重跑 |
| rsync 步骤报 `rsync: command not found` | 服务器未安装 rsync（GitHub runner 自带，无需处理） | 服务器执行 `sudo apt install rsync`，重跑流水线 |
| rsync/scp 步骤十几分钟仍未完成 | runner 在海外，到国内服务器跨境上行带宽极窄（常不足 100 KB/s），而产物含 docs 全部图片（约 40MB+），全量传输必然慢 | 全量场景在本地 seed（见第 3 节）；日常 CI 只跑差量；挂着的全量 run 直接 **Cancel workflow** |

### 6. 复用到其他前端项目

同一台服务器、同一套思路，只需把 `python-summary` 换成新应用的 appId：

1. `deploy.yml` 的 Build 步骤：`BASE_PATH=/apps/<新appId>/`
2. Secrets 的 `TARGET_PATH`：`/home/zjh/project/apps/<新appId>/prod`
3. 服务器执行一次：`mkdir -p /home/zjh/project/apps/<新appId>/prod`

nginx 不用动，推送后即可通过 `https://handn.fun/apps/<新appId>/` 访问。
