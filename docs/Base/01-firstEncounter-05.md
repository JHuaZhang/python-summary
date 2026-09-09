---
group:
  title: 【01】初识python
  order: 1
order: 5
title: conda环境管理
nav:
  title: Python基础
  order: 1
---

## 1. 介绍

### 1.1 什么是 conda

`conda` 是一个跨平台的**包管理与环境管理工具**,最初为科学计算(尤其是 Python 数据科学栈)而设计,由 Anaconda 公司开发。它能管理 Python 包,也能管理**非 Python 的依赖**(如 C/C++ 库、系统级二进制、其他语言如 R 的包),还能管理 Python 解释器本身的不同版本——这是它与 `pip` + `venv` 体系最本质的区别。

理解 conda,关键抓住"它管的比 pip 多":

- **pip + venv**:pip 管 Python 包(纯 Python 或带编译的),venv 管隔离的装包目录。但 venv **不能装新 Python 版本**(依赖系统已有的 Python),pip 装**含 C 扩展的包**(如 numpy、psycopg2)时若没有预编译 wheel 就要本地编译,经常因缺编译器/系统库而失败。
- **conda**:一次性管"Python 解释器版本 + Python 包 + 非 Python 依赖(系统库等)"。`conda create -n env python=3.12 numpy` 一条命令,conda 帮你装好 Python 3.12、numpy 及 numpy 依赖的底层 C 库(BLAS 等),无需本地编译,适合科学计算那种"依赖一堆本地编译的数值库"的场景。

`conda` 与两个常见名词关联:

- **Anaconda**:一个**发行版**,把 conda + Python + 几百个数据科学常用包(numpy、pandas、scipy、jupyter 等)打包成一个大安装包(几个 GB)。装了 Anaconda 就有了 conda 和一堆现成的包,适合数据科学入门或离线环境。缺点是体积大、装的包可能非最新。
- **Miniconda**:Anaconda 的**精简版**,只含 conda + Python + 少量必需包(几十 MB)。装好后按需 `conda install` 装包,体积小、干净,是开发者的首选。两者的 conda 是同一个,差别只在预装包多寡。

本系列前几节用 `pip + venv` 管理纯 Python 项目;这一节讲 `conda`,主要面向数据科学、机器学习等场景。两者并非二选一,而是根据项目特性选用——**纯 Python 项目用 venv 轻量够用;涉及科学计算/复杂二进制依赖/多 Python 版本管理的项目用 conda 更省心**。

在实际开发中,conda 的典型用途:

- **数据科学/机器学习环境**:numpy、pandas、scipy、scikit-learn、pytorch/tensorflow 等这些含大量 C/Fortran 扩展的包,conda 装预编译版,免去本地编译地狱。
- **多 Python 版本共存**:`conda create -n py310 python=3.10`、`conda create -n py312 python=3.12`,一键创建不同 Python 版本的环境,比 pyenv+venv 更省事。
- **非 Python 依赖管理**:如某库依赖 ffmpeg、GDAL、某些 C 库,conda 能一并装上,venv/pip 做不到。
- **R / 多语言项目**:conda 也管 R、Julia 等的包,适合多语言混合科研环境。

### 1.2 conda 与 pip/venv 的对比

conda 和 pip+venv 是两套并存的体系,理解差异才能正确选型:

| 维度 | conda | pip + venv |
|------|-------|------------|
| 管理范围 | Python 包 + 非 Python 依赖 + Python 版本 | 仅 Python 包 |
| 装 Python 版本 | 能(`conda create -n env python=3.12`) | 不能(venv 复用系统 Python) |
| 含 C 扩展的包 | 多为预编译二进制,装得顺 | 无 wheel 时本地编译,易失败 |
| 包来源 | conda 仓库(anaconda/main/conda-forge 等) | PyPI |
| 包数量 | 比 PyPI 少(数十万 vs PyPI 的包未必有 conda 版) | PyPI 最全(40万+) |
| 速度 | 较慢(依赖解析繁琐) | 较快 |
| 商业许可 | Anaconda 仓库大規模商用需付费;conda-forge 免费 | 完全免费 |
| 标准库自带? | 否(需单独装 Miniconda/Anaconda) | Python 自带 pip,venv 标准库 |

**核心取舍**:

- conda 的优势:能装/管 Python 版本本身、能装非 Python 依赖、含 C 扩展包装得顺。这让它在科学计算/ML 场景特别顺手——装 pytorch、 Georgetown 用的 GDAL、带 MKL 的 numpy 等,conda 一条命令搞定,而 pip 可能要折腾编译。
- pip+venv 的优势:轻量(无需装 Miniconda)、PyPI 包最全(任何包都能找到)、纯 Python 项目足够、生态标准。日常 Web 开发、脚本、API 服务,pip+venv 更轻更快。

**能否混用**:可以,但要小心。conda 环境里**也能用 pip 装 PyPI 的包**(conda 仓库没有的包靠 pip 补)。但同一环境里既 `conda install` 又 `pip install` 同一包易冲突;且 conda 装的包和 pip 装的包依赖解析独立,可能装出不一致的环境。建议:**conda 为主装科学计算栈,pip 补 conda 没有的包,且尽量避免对同一包两种方式都装**。或干脆一个环境二选一。

### 1.3 何时该用 conda

不是所有项目都该用 conda。判断标准:

**适合用 conda**:

- 数据科学、机器学习、深度学习项目(依赖 numpy/pandas/torch 等 C 扩展栈)。
- 需要频繁切换不同 Python 版本(`conda create -n env python=x` 比 pyenv+venv 方便)。
- 项目依赖非 Python 二进制(C 库、系统工具如 ffmpeg/GDAL)。
- 团队统一用 Anaconda/Miniconda,转 conda 一致。
- Windows 上装 Python 科学栈(Windows 编译环境难配,conda 预编译尤其省心)。

**不必用 conda(pip+venv 足够)**:

- 纯 Python 的 Web/API/脚本(用 flask、requests、fastapi 等)。
- 一般工具开发、自动化、爬虫(纯 Python 包)。
- 已习惯 pip+venv 且无 C 扩展编译痛点的项目。
- 追求轻量、不装额外大工具。

简单原则:**遇到"装某包装不上要编译""要管多个 Python 版本""要装非 Python 依赖"这三种痛点之一,上 conda;否则 pip+venv 更轻**。本系列以 pip+venv 为主线,conda 作为科学计算方向的补充方案,理解它何时更优即可。

### 1.4 conda 的环境模型

conda 的"环境"概念与 venv 类似(都是隔离的包目录),但范围更大。一个 conda 环境包含:

- 一份**独立的 Python 解释器**(conda 自己装的某版本,不依赖系统)。
- 独立的**包目录**(site-packages 及 conda 装的非 Python 文件)。
- 独立的**依赖二进制**(C 库等,放在环境的 lib 下)。

所以 conda 环境比 venv"重"——它有自己的 Python 副本和 C 库副本,占空间大(一个科学计算环境常 GB 级),但**完全自包含、可指定任意 Python 版本、含全部底层依赖**。这是 conda 的设计权衡:用空间换"开箱即用、跨平台一致"。

conda 有一个特殊的 **base 环境**——安装 Miniconda/Anaconda 后默认存在的环境,含 conda 本身和基础 Python。一般**不在 base 环境里做项目开发**,而是为每个项目建独立环境,保持 base 干净(只用来跑 conda 命令)。这与 venv"不在系统 Python 装项目包"的理念一致。

理解 conda 环境模型:`conda create` 装一份独立 Python+包目录、各环境完全独立自包含、base 环境只放 conda 本身、激活/退出与 venv 类似但命令不同(`conda activate`/`conda deactivate`)。

### 1.5 conda 的生态现状与选型趋势

了解 conda 在当前 Python 生态中的位置,有助于把握整体趋势。conda 兴起于数据科学爆发期(2010s 中期),当时装 numpy/scipy 等 C 扩展栈在 Windows 上几乎是噩梦,conda 的预编译二进制解决了这个痛点,因此成为科学计算事实标准,Anaconda 一度是国内数据科学教学默认推荐。

近年生态有几点变化值得知晓:其一,`pip` 的 wheel 机制成熟后,PyPI 上主流科学包(numpy/pandas/torch)都有多平台预编译 wheel,纯用 pip 也能顺畅装,conda 的"免编译"优势被削弱;其二,新版 conda 引入 libmamba 求解器,解决了长期被诟病的"Solving environment 慢";其三,轻量新秀 `uv`(Rust 实现)在纯 Python 依赖管理上极快,侵蚀了一部分原本 conda 的纯 Python 场景;其四,Fedora/Red Hat 软硬件变革下部分系统已自带较新 Python,降低了对 conda"装 Python 版本"能力的依赖。

那么 conda 还值不值得学?**仍然值得**,且在三类场景不可替代:GPU/CUDA 深度学习栈(conda 一并管 CUDA 运行库)、复杂非 Python 依赖(地理信息 GDAL、生物信息)、教学/团队统一用 Anaconda 的环境。纯 Python 项目确实可转向 pip+venv 或 uv,但数据科学/ML 方向 conda 仍是主流之一,理解它让你能读懂数据科学项目的环境配置、能与用 conda 的团队协作。本系列把它作为科学计算方向的补充,与 pip+venv 主线互补,按场景择优。

---

## 2. 核心内容

本章详尽讲解 conda 的安装、环境创建/激活/删除、包安装、channel(频道)、与 pip 协作、镜像配置、环境导出复现、常见问题,让读者照着用 conda 管理科学计算环境。

### 2.1 安装 Miniconda / Anaconda

**Miniconda(推荐开发者)**:精简,只含 conda + Python。

1. 访问 https://docs.conda.io/projects/miniconda/ ,下载对应平台的安装脚本(Windows 是 `.exe`,macOS/Linux 是 `.sh`)。
2. macOS/Linux 运行:`bash Miniconda3-latest-Linux-x86_64.sh`,按提示安装(可改安装目录)。
3. Windows 双击 `.exe` 按向导安装,建议勾选 "Add Miniconda to PATH" 或之后用开始菜单的 "Anaconda Prompt"。
4. 安装后重开终端,输入 `conda --version` 验证。

**Anaconda(推荐数据科学入门/离线)**:从 https://www.anaconda.com/download 下载,装后含几百个数据科学包,a few GB。适合不想后续频繁装包、或离线机器。

**国内加速下载**:官方源慢,可用清华镜像下载安装包:https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda/ (Miniconda)或 .../anaconda/ (Anaconda)。安装脚本本身也可用清华的。

**初始化 shell**:安装后若 `conda` 命令不识别(尤其 Linux/macOS),运行:

```bash
conda init bash        # 或 zsh: conda init zsh
# 然后重启终端或 source ~/.bashrc
```

`conda init` 把 conda 的初始化代码写进 shell 配置,使 `conda` 命令和新开终端默认进 base 环境可用。如果不希望新开终端自动进 base(很多人不喜欢提示符前总有 `(base)`),关闭自动激活:

```bash
conda config --set auto_activate_base false
```

之后新终端默认不在任何 conda 环境,需要时手动 `conda activate`。

### 2.2 conda 基本命令速览

最常用的几条:

```bash
conda --version                 # conda 版本
conda create -n myenv python=3.12  # 创建环境
conda activate myenv            # 激活环境
conda deactivate                # 退出环境
conda env list                  # 列出所有环境
conda install numpy             # 装包
conda list                      # 列出当前环境已装包
conda remove numpy              # 卸载包
conda env export > env.yml      # 导出环境
conda env create -f env.yml     # 从文件创建环境
conda update conda              # 升级 conda 自身
```

这是 90% 日常会用到的命令。第 2 章逐条详述。

### 2.3 创建环境

用 `conda create` 创建,`-n` 指定环境名,`python=` 指定 Python 版本(这是 conda 比 venv 强的地方——它自己装这个版本的 Python):

```bash
conda create -n myenv python=3.12          # 建 myenv 环境,Python 3.12
conda create -n myenv python=3.12 numpy pandas  # 顺便装包
conda create -n py310 python=3.10          # 建 Python 3.10 环境
```

**命名约定**:环境名简短、表达用途,如 `ml`(机器学习)、`webdev`、`py310`(按 Python 版本)。环境实际存在 `~/miniconda3/envs/<名字>/` 下。

**指定 Python 版本的意义**:`python=3.12` 让 conda 下载并装一份 Python 3.12 到这个环境,完全不依赖系统 Python。一台机器用 conda 可同时有 3.8/3.10/3.11/3.12 多个环境,各自独立 Python。这比 venv(只能复用系统 Python)灵活得多。

**创建时的 channel**:`conda create -n myenv -c conda-forge python=3.12` 用 conda-forge 频道(见 2.7)。

### 2.4 激活与退出环境

```bash
conda activate myenv           # 激活,提示符变 (myenv)
conda deactivate               # 退出,回到 base 或无环境
```

激活后,`python`/`pip` 指向当前环境的版本:

```bash
(myenv) $ which python
# ~/miniconda3/envs/myenv/bin/python
(myenv) $ python --version
# Python 3.12.0
(myenv) $ conda info --envs     # 列出环境,当前环境带 *
```

注意 conda 激活用的是 `conda activate`(不是 venv 的 `source activate`)。**conda 4.6+** 起,`conda activate` 在所有平台都能用(此前 Windows 与 Unix 激活命令不同)。前提是已 `conda init` 当前 shell。

退出 `conda deactivate` 后,若 `auto_activate_base=true`(默认),会回到 base 环境;若设了 false,则回到无 conda 状态。退出不删除环境,环境与里面的包都还在。

### 2.5 列出与删除环境

**列出所有环境**:

```bash
conda env list          # 或 conda info --envs
# 输出示例:
# # conda environments:
# #
# base                  *  /home/user/miniconda3
# myenv                    /home/user/miniconda3/envs/myenv
# py310                    /home/user/miniconda3/envs/py310
```

`*` 标记当前激活的环境。`base` 是默认的 base 环境。

**删除环境**:

```bash
conda env remove -n myenv        # 删除 myenv 环境(连同里面所有包)
conda remove -n myenv --all      # 等价写法
```

删除前先 `conda deactivate` 退出该环境。删除后环境目录消失,包都没了。与 venv 一样,conda 环境"可抛弃",靠导出的环境文件(2.10)复现。

### 2.6 安装与卸载包

**安装**:

```bash
conda install numpy               # 装最新版
conda install numpy=1.26.0        # 装指定版本(单等号)
conda install "numpy>=1.25"       # 版本范围
conda install numpy pandas scipy  # 装多个
conda install -n myenv numpy      # 装到指定环境(不必先激活)
```

conda 装包时,**连同该包依赖的非 Python 库一起装**(如 numpy 依赖的 MKL/BLAS),且都是预编译二进制,无需本地编译。这是 conda 在科学计算场景的核心优势——`conda install numpy` 不会遇到 pip 那种"编译失败"。

**查看已装包**:

```bash
conda list                        # 当前环境所有包(含 Python、非 Python)
conda list numpy                  # 看某包,是否装了、哪个版本
conda list -n myenv               # 看指定环境的包
```

`conda list` 输出比 `pip list` 更全——它列出环境里**所有**东西,包括 Python 解释器、C 库(MKL、libgcc 等),因为 conda 把这些都当"包"管。这正体现 conda 管理范围广。

**卸载与升级**:

```bash
conda remove numpy                # 卸载
conda update numpy                # 升级到最新
conda update --all                # 升级环境里所有包
conda update conda                # 升级 conda 自身(重要)
```

conda 的依赖解析在卸载/升级时也会协调依赖关系,比 pip 更全局化(它知道整个环境所有包的关系)。

### 2.7 channel(频道)

conda 包分布在多个**频道(channel)**,频道是包的来源仓库。常用频道:

- **defaults / main**:Anaconda 公司维护的默认频道,包较稳定但更新慢,大规模商用需商业许可(个人/学术免费)。
- **conda-forge**:社区维护的频道,包最全、更新最快,**免费且无商用限制**,是当前首选频道。绝大多数包在 conda-forge 都有。
- **bioconda**:生物信息学包频道。
- **自定义/私有频道**:企业内部搭建的频道。

**指定频道装包**:

```bash
conda install -c conda-forge numpy      # 这次用 conda-forge
```

**设默认频道优先级**:

```bash
conda config --add channels conda-forge  # 加 conda-forge 频道
conda config --set channel_priority strict  # 严格优先级(推荐)
```

`channel_priority strict` 是重要设置:它让 conda 严格按频道优先级选包,优先用 conda-forge 的版本,避免不同频道混装导致冲突。这是 conda 社区推荐配置。建议装完 conda 第一时间:

```bash
conda config --add channels conda-forge
conda config --set channel_priority strict
```

后续装包默认走 conda-forge,稳定且全。

### 2.8 conda 与 pip 协作

conda 环境里也能用 pip 装 PyPI 的包——conda 仓库没有的包靠 pip 补:

```bash
conda activate myenv
conda install numpy pandas          # 科学计算栈用 conda
pip install some-niche-package      # conda 没有的小众包用 pip
```

**协作的注意事项**:

1. **先 conda 后 pip**:先用 conda 装能用 conda 装的所有包,再用 pip 补 conda 没有的。避免先 pip 装了某包,又 conda 装依赖它的包,版本可能冲突。
2. **别对同一包两处装**:某包别既 `conda install` 又 `pip install`,会冲突或覆盖,导出环境时也混乱。
3. **pip 也被 conda 管**:conda 环境里的 pip 本身是 conda 装的,`conda update pip` 升级它。混装前确保 pip 是最新。
4. **导出环境含 pip 包**:`conda env export` 默认导出 conda 装的包,pip 装的需用 `--from-history` 或单独记录(见 2.10)。

经验法则:**能用 conda 装的尽量 conda 装**(依赖解析更全局、二进制统一),conda 没有的再用 pip 补。这样环境最一致。

### 2.9 镜像源配置(国内加速)

conda 默认源在国内慢,配国内镜像(清华源最常用)大幅加速。

**配置命令**:

```bash
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/conda-forge/
conda config --set show_channel_urls yes
```

或直接编辑 `~/.condarc` 文件:

```
channels:
  - defaults
show_channel_urls: true
default_channels:
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free
custom_channels:
  conda-forge: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
```

配置后 `conda install` 走清华镜像,下载快。遇到镜像同步滞后(某包最新版镜像还没)时,可临时 `-c defaults` 用官方源。

**移除镜像**:删除 `~/.condarc` 里相关行,或 `conda config --remove channels <url>`。

### 2.10 环境导出与复现

conda 环境可导出为 `environment.yml` 文件,在别处复现:

**导出**:

```bash
conda env export > environment.yml      # 导出当前环境(含精确版本与构建号)
conda env export --from-history > environment.yml  # 只导出你显式指定的包(更简洁、可移植)
```

`environment.yml` 示例:

```yaml
name: myenv
channels:
  - conda-forge
dependencies:
  - python=3.12
  - numpy=1.26.0
  - pandas=2.1.0
  - pip:
    - some-pypi-package==1.0
```

注意它同时记录 conda 包和 pip 包(`pip:` 段),这是 conda 导出比 `pip freeze` 全面之处。

**复现**:

```bash
conda env create -f environment.yml     # 按文件创建环境(跨平台尽量用)
```

**跨平台注意**:`conda env export` 导出的含平台特定的"构建号"(如 `numpy=1.26.0=py312h...`),在 Windows 导出的拿到 Linux 复现可能失败(平台不符)。解决:用 `--from-history` 只导出显式指定的包(无构建号,可移植);或在目标平台 `conda env create -f` 时让 conda 重新解析适配平台的版本。`--from-history` 导出的清单更干净、更适合跨平台共享。

### 2.11 克隆环境

有时想基于某环境复制一份(如把生产环境复制到测试环境改):

```bash
conda create -n newenv --clone oldenv
```

克隆复制 oldenv 的所有包到新环境 newenv,二者之后独立。比从 environment.yml 重建快(直接拷贝,不重新解析下载),适合本地快速复制。但克隆的环境与原环境绑定同一平台,不可跨机器/平台直接拷贝(要用 environment.yml)。

### 2.12 常见问题排查

**问题一:`conda: command not found`**

安装后没 `conda init` 当前 shell,或 PATH 未含 conda。运行 `conda init <shell>` 并重启终端;或用安装目录下的 `bin/conda` 全路径;Windows 用 "Anaconda Prompt"。

**问题二:`CondaError: ... locale` / 中文乱码**

环境变量 locale 问题。设 `export LC_ALL=en_US.UTF-8` 或 `LANG=en_US.UTF-8` 后重试。

**问题三:装包极慢或失败**

默认源慢。配国内镜像(2.9);`channel_priority` 设 strict 避免 conda 在多频道间反复解析;`conda config --set remote_max_retries 5` 增加重试。偶尔镜像同步滞后,临时换官方源。

**问题四:Solving environment 卡很久**

conda 依赖解析慢是其老问题(尤其多频道、复杂依赖)。应对:用 conda-forge + strict 优先级(2.7);用更快的求解器 `conda install -n base conda-libmamba-solver` 并 `conda config --set solver libmamba`(新版 conda 默认用 libmamba 求解器,快很多);实在慢的复杂环境考虑用 mamba(conda 的 C++ 重写,求解快)。

**问题五:conda 与 pip 装的包冲突**

某包 conda 和 pip 都装了。`conda list` 看是否有重复;统一用一种方式装该包;重建干净环境。

**问题六:环境占空间太大**

conda 环境含独立 Python 和 C 库副本,多个环境占空间惊人。定期 `conda env list` 看哪些不用了删(`conda env remove`);`conda clean --all` 清缓存和未用包(`~/miniconda3/pkgs/` 缓存可清出几 GB);用 `--clone` 复用基础包减少占用。

### 2.13 conda clean 清理

conda 会缓存下载的包文件在 `pkgs/` 目录,时间一长占巨量空间。定期清理:

```bash
conda clean --all         # 清所有缓存:未用的包、tarball、索引
conda clean -t            # 只清 tarball(.tar.bz2/.conda)
conda clean -p            # 清未使用的包
conda clean -i            # 清索引缓存
```

`conda clean --all` 常能清出几 GB 到几十 GB,是磁盘紧张时的急救。它只删缓存,不影响已建环境里的包(环境里的包是独立副本)。养成半年清一次的习惯,避免 Miniconda 目录无限膨胀。

### 2.14 在 PyCharm 中使用 conda 环境

PyCharm 支持把 conda 环境作为解释器(详见《PyCharm 开发环境配置》):

- 新建项目时,解释器选 "New environment using Conda"(PyCharm 帮你 `conda create`),或 "Existing environment" 选已建的 conda 环境。
- Settings → Project → Python Interpreter,点齿轮 → Add → Conda Environment,选 `~/miniconda3/envs/<env>/bin/python`(Windows 是 `envs\<env>\python.exe`)。
- 选好后,运行调试智能提示都用该 conda 环境的包。

社区版也支持 conda 环境(无需专业版)。在 PyCharm 里用 conda,享受 IDE 调试与 conda 科学计算栈的便利结合。

### 2.15 mamba 与 micromamba(提速替代)

conda 的依赖解析慢是公认痛点,社区有更快替代:

- **mamba**:conda 的 C++ 重写,命令与 conda 几乎一致(`mamba install`/`mamba env create`),但用 libsolv 求解器,装包快十倍。可用 `conda install -n base -c conda-forge mamba` 装,之后习惯用 `mamba` 替代 `conda`。
- **micromamba**:单文件、无需 base Python 的极简版,启动快,适合 CI 和容器。
- **libmamba 求解器**:新版 conda(23.10+)已内置 libmamba,`conda config --set solver libmamba` 启用,直接让 conda 本身变快,无需换 mamba。

实践:**先升级 conda 并启用 libmamba 求解器**(`conda update conda` + 设 solver),多数情况就够快;极复杂环境再考虑 mamba。这是当下 conda 性能优化的标准做法。

### 2.16 完整实战:搭建一个数据科学环境

把各节串起来,演示从零搭一个数据分析/ML 环境:

```bash
# 1. 装好的 Miniconda,配置 conda-forge 与求解器和国内镜像
conda config --add channels conda-forge
conda config --set channel_priority strict
conda config --set solver libmamba          # 启用快速求解器(新版)
# (国内)配清华镜像,见 2.9

# 2. 升级 conda
conda update conda

# 3. 建数据科学环境
conda create -n ds python=3.12
conda activate ds

# 4. 装科学计算栈(conda 装,享受预编译)
conda install numpy pandas scipy matplotlib scikit-learn jupyter

# 5. 装 PyPI 上的额外包(conda 没有或要最新)
pip install seaborn plotly

# 6. 验证
python -c "import numpy, pandas, sklearn; print('环境就绪')"

# 7. 导出环境(跨平台用 from-history)
conda env export --from-history > environment.yml

# 8. 别人复现
# conda env create -f environment.yml
# conda activate ds
```

这套流程是 conda 数据科学项目的标准开场:配频道/求解器/镜像→升 conda→建环境→装科学栈→pip 补充→验证→导出。与 pip+venv 流程对应,只是把 pip 换 conda 以享受二进制管理便利。

### 2.17 conda 环境目录结构

了解 conda 环境在磁盘上长什么样,有助于排查问题。环境位于 `~/miniconda3/envs/<名字>/`:

```
envs/myenv/
├── bin/                 # macOS/Linux 可执行文件
│   ├── python           # 该环境专属 Python(conda 装的,非系统)
│   ├── pip
│   └── ...各包的命令行入口
├── Scripts/             # Windows 对应目录
├── lib/
│   └── python3.12/
│       └── site-packages/   # Python 包
├── lib/                 # 非 Python 库(.so/.dll/.dylib,如 MKL、libgcc)
├── include/             # C 头文件
├── conda-meta/          # 该环境装了哪些包的元数据(conda list 来源)
└── ...
```

**与 venv 目录的关键区别**:

- conda 环境的 `bin/python` 是 conda **自己装的真实 Python 二进制**(非符号链接到系统),所以可指定任意版本、完全独立。
- conda 环境的 `lib/` 含**非 Python 二进制库**(C 库等),这是 conda 能管非 Python 依赖的体现,venv 没有这部分。
- `conda-meta/` 记录环境装了哪些包及精确版本构建号,是 `conda list`/导出的数据源。

理解结构,能在"环境占多大""某 C 库装哪了""conda 怎么知道装了什么"等问题上有清晰答案。一个含科学栈的 conda 环境常几 GB,正是因含独立 Python + 一堆 C 库副本。

### 2.18 package / environment / channel 三层概念

conda 有三个层次的概念,理清它们关系:

- **channel(频道)**:包的来源仓库(conda-forge、defaults 等)。装包时 conda 从指定频道找。
- **package(包)**:频道里的一个个可安装单元,如 `numpy=1.26.0`。包含 Python 包,也含 Python 解释器本身(`python=3.12` 也是个包)、C 库(`mkl`、`libgcc`)等——conda 把这些一视同仁当"包"管理。
- **environment(环境)**:一组 co-installable(可共存)的包集合,装在独立目录,带自己的 Python。

关系:从某 channel 取若干 package,组合成一个 environment。`conda install` 时 conda 在 channel 间求解,找到一组满足约束且互不冲突的 package 装进当前 environment。"Python 解释器也是包"这点很关键——它解释了为何 `conda create -n env python=3.12` 能装指定版本(conda 把 python 当包下载安装),而这正是 venv 做不到的。

### 2.19 跨平台与构建号 build string

conda 包的版本标识比 pip 复杂,除版本号还有**构建号(build string)**:

- pip:`numpy==1.26.0`(只版本号)。
- conda:`numpy=1.26.0=py312h...`(版本号 + 构建号,构建号含 Python 版本/平台/构建特征)。

构建号里的 `py312` 表示该构建对应 Python 3.12,`h...` 是哈希,标识具体的二进制构建。同一 `numpy 1.26.0` 在不同 Python 版本/平台有不同构建号,conda 据此选适合当前平台的。

**跨平台含义**:Windows 上 `conda env export` 导出的含 Windows 构建号(如 `py312h...win_amd64`),拿到 Linux 复现会因构建号不匹配失败。这就是 2.10 强调用 `--from-history` 跨平台的原因——它只导包名与版本约束,让目标平台 conda 重新选合适构建。

理解构建号,能在"为什么导出的环境换平台装不上""conda list 里包名后面那串什么意思"上不再困惑。

### 2.20 conda 配置文件 .condarc

conda 的配置存于 `~/.condarc`(用户级),可用 `conda config` 命令或手编辑。常用配置项:

```yaml
# 镜像源
channels:
  - conda-forge
  - defaults
channel_priority: strict        # 频道优先级
show_channel_urls: true         # 显示包的下载 URL(调试用)
default_channels:               # defaults 频道的实际镜像
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free

# 求解器与行为
solver: libmamba                # 用 libmamba 求解器(快)
auto_activate_base: false       # 不自动激活 base
ssl_verify: true                # SSL 校验(镜像证书问题时设对应项)
remote_max_retries: 5           # 下载重试次数
```

常用命令操作配置:

```bash
conda config --show              # 查看所有配置
conda config --show channels     # 查看某项
conda config --add channels conda-forge
conda config --set channel_priority strict
conda config --remove channels <url>
```

`.condarc` 是 conda 的"设置中心",镜像、频道、求解器、行为都在这里配。配一次长期生效,新机器照搬一份 `.condarc` 即可复刻配置。

### 2.21 conda 与 venv 实战对比

用一个具体场景直观对比两者差异:装 `pytorch`(GPU 深度学习框架,含大量 CUDA C 扩展)。

**用 pip+venv**(可能踩坑):

```bash
python -m venv .venv && source .venv/bin/activate
pip install torch
# 可能:下载巨大源码包本地编译 → 缺 CUDA toolkit 报错;
# 或:装到 CPU 版而非 GPU 版,需手动指定 +cu118 等索引;
# 需自己确保系统有匹配的 CUDA 驱动/toolkit。
```

**用 conda**(顺畅):

```bash
conda create -n torch python=3.12
conda activate torch
conda install -c pytorch pytorch pytorch-cuda=12.1
# conda 一并装好 pytorch + 匹配的 CUDA 运行库(cudatoolkit/cuda-cudnn),
# 无需本地编译、无需手动配 CUDA 版本,直接可用 GPU。
```

差异清晰:conda 把 CUDA 运行库这些**非 Python 依赖**也管了,一条命令齐活;pip 只管 Python 包,CUDA 等要你自己折腾系统环境。这正是 conda 在 ML/GPU 场景的杀手锏。反之,装个纯 Python 的 `flask`,两者都简单,pip+venv 还更轻——选型差异由此凸显。

### 2.22 conda 的限制与边界

conda 也不是万能,知道它的边界:

**包不如 PyPI 全**:conda 仓库(含 conda-forge)的包数量远少于 PyPI。冷门/小众/新出的包可能 PyPI 有、conda 没有,得靠 pip 补。

**占空间大**:每个 conda 环境含独立 Python+C 库副本,几个环境轻松几十 GB。venv 共享系统 Python,小得多。磁盘紧张要权衡。

**求解较慢(未优化时)**:默认求解器在复杂依赖时慢。需启用 libmamba(mamba)缓解,但仍是相对 pip 的劣势。

**商业许可(defaults 频道)**:Anaconda 默认频道大规模商用(200 人以上组织)需付费许可。conda-forge 完全免费。商业项目优先用 conda-forge,避开 defaults 许可问题。

**不取代系统包管理**:conda 装的 C 库在其环境内,不替代系统的 apt/brew 装的系统级库。某些场景仍需系统包管理器配合。

**学习成本**:conda 有 channel/优先级/求解器等概念,比 pip+venv 学习曲线陡。纯 Python 项目没必要引入这些复杂度。

边界清晰后选型更准:科学计算/ML/GPU/多版本用 conda 值;纯 Python 小项目用 pip+venv 更轻。

### 2.23 conda 与 Docker 的关系

conda 环境和 Docker 容器都做"可复现环境",层次不同:

- **conda**:环境级隔离——隔离 Python+包+C 库,但仍跑在宿主操作系统上(共享内核、系统工具)。
- **Docker**:系统级隔离——整个 OS(含 Python、conda、系统库、配置)打包成镜像,跨机器完全一致。

科学计算部署常见组合:**用 conda 管理环境,Docker 打包部署**。Dockerfile 里 `conda env create -f environment.yml` 装好环境,镜像在任何机器跑出一致结果。如此兼顾 conda 的科学栈便利与 Docker 的部署一致性。

单纯的 conda 环境,在不同 OS(macOS vs Linux)的二进制可能不同(not 跨平台字节级一致);Docker 镜像则跨平台一致(只要镜像同)。要字节级可复现(如论文复现、生产部署),Docker + conda 是标配。

### 2.24 初学者常见误区

**误区一:在 base 环境里装所有项目包**。base 环境污染,多项目冲突,且 base 坏了 conda 都没法用。正确:每项目建独立环境,base 保持干净只跑 conda 命令。

**误区二:conda 和 pip 乱混**。对同一包两边都装,或顺序混乱,环境一团乱、导出不准确。正确:先 conda 装 conda 有的,pip 仅补 conda 没有,绝不双重装。

**误区三:用 defaults 频道且不知商业限制**。企业大規模用 defaults 有许可风险。正确:配 conda-forge 为首选,避开 defaults 的商业许可问题。

**误区四:导出完整 environment.yml 跨平台用**。含构建号的完整导出跨平台会失败。正确:跨平台共享用 `--from-history`。

**误区五:不 clean 导致磁盘爆满**。conda 缓存和环境副本膨胀惊人,久不清几十上百 GB。正确:定期 `conda clean --all`,删不用环境。

**误区六:纯 Python 项目也上 conda**。引入 channel/求解器等复杂度,却没享受 conda 的二进制优势。正确:纯 Python 项目用 pip+venv 更轻,把 conda 留给真正需要它的科学计算场景。

**误区七:不升级 conda、不用 libmamba,抱怨求解慢**。新版 conda + libmamba 快很多。正确:`conda update conda` + `solver libmamba`,再谈速度。

识别这些误区,能把 conda 用得既发挥优势又不踩坑。

---

## 3. 最佳实践

### 3.1 用 Miniconda 而非 Anaconda

Miniconda 精简、干净,按需装包;Anaconda 预装几百个包占巨量空间且版本常非最新。除离线/教学场景,开发者一律用 Miniconda,装好后 `conda install` 按需补。

### 3.2 首选 conda-forge 频道 + strict 优先级

```bash
conda config --add channels conda-forge
conda config --set channel_priority strict
```

conda-forge 包全、更新快、免费无商用限制;strict 优先级避免多频道混装冲突。装完 conda 第一时间配好这两项。

### 3.3 启用 libmamba 求解器提速

```bash
conda update conda
conda config --set solver libmamba
```

新版 conda 内置 libmamba,启用后依赖解析快十倍以上,告别"Solving environment"长等待。这是当前 conda 性能的标准优化。

### 3.4 每个项目一个独立 conda 环境

```bash
conda create -n projectname python=3.12
conda activate projectname
```

不在 base 环境做项目开发(保持 base 干净只放 conda)。每项目一环境,隔离依赖,与 venv 理念一致。

### 3.5 先 conda 后 pip,避免对同包双重安装

能用 conda 装的尽量 conda(依赖解析全局、二进制统一),conda 没有的再 pip 补。绝不同一包既 conda install 又 pip install,避免冲突与导出混乱。

### 3.6 跨平台共享用 --from-history 导出

```bash
conda env export --from-history > environment.yml
```

`--from-history` 只导出显式指定的包(无平台特定的构建号),跨 Windows/macOS/Linux 可移植。完整 `export`(含构建号)只适合同平台精确复现。团队共享清单用 from-history。

### 3.7 国内配清华镜像

装包慢第一反应配镜像(2.9)。设好 `~/.condarc` 长期生效。镜像同步偶有滞后,需要最新版时临时用官方源。

### 3.8 定期 conda clean

```bash
conda clean --all
```

conda 缓存膨胀惊人,半年清一次常省几 GB 到几十 GB,且只删缓存不影响环境。磁盘紧张时必做。

### 3.9 conda 与 pip+venv 按场景选,不混用体系

纯 Python 项目用 pip+venv 轻量够;科学计算/多 Python 版本/非 Python 依赖用 conda。一个团队/项目尽量统一一套,别一半 conda 一半 venv,徒增复杂。两者非对立,按项目特性选对的即可。

### 3.10 关闭 base 自动激活(可选)

```bash
conda config --set auto_activate_base false
```

若不希望新终端总自动进 base(提示符前的 `(base)` 干扰),关闭自动激活,需要时手动 `conda activate`。个人偏好,但不少开发者觉得默认进 base 烦。

### 3.11 升级 conda 自身保持新

```bash
conda update conda
```

新版 conda 修 bug、加速(libmamba)、改善求解,保持更新避免老版本的各种坑。先升 conda 再用,是良好习惯。

### 3.12 删环境前先 deactivate

```bash
conda deactivate
conda env remove -n oldenv
```

删除某环境前退出它,避免占用导致删除异常。用不到的环境及时删,释放空间、保持 `conda env list` 清爽。

### 3.13 团队统一 conda 约定与清单共享

团队用 conda 协作时,统一约定避免各人环境不一致:统一用 conda-forge + strict 优先级 + libmamba 求解器;环境名统一(如按项目名);将 `environment.yml`(`--from-history` 导出)提交 git 共享,新人 `conda env create -f environment.yml` 一键起步;Python 版本在 yml 里锁定,大家一致。把这套约定写进项目 README,使新人不需口头传授即可建出一致环境。与 pip 项目提交 `requirements.txt` 同理,conda 项目提交 `environment.yml` 是协作基础。

### 3.14 精确版本锁定与 conda-lock

`environment.yml` 的版本约束有时不够精确(尤其跨平台),要字节级可复现可用 **conda-lock**(`pip install conda-lock`):它为每个平台生成精确锁定文件(锁到具体构建号),CI/生产按锁定文件装出完全一致环境。适合论文复现、严格生产部署等对复现性要求极高的场景。普通项目 `environment.yml` + `--from-history` 已够,conda-lock 是进阶选项。理解"从宽约束(yml)到精确锁定(conda-lock)"的渐进,能按项目复现性需求选对工具。

### 3.15 科学计算优先 conda-forge 的 numpy 等

科学计算栈(numpy/scipy/pandas/scikit-learn)优先用 conda-forge 而非 defaults 装:conda-forge 版本更新、且常带优化的底层 BLAS(如 OpenBLAS/MKL),性能更好;避免 defaults 与 conda-forge 混装同一栈导致 ABI 不一致。配 strict 优先级后默认走 conda-forge,科学栈一致且高效。

### 3.16 CI 中用 conda 实现可复现构建

CI(GitHub Actions/GitLab CI)里跑 conda 项目,用与本地一致的命令保证可复现:CI 先 `conda env create -f environment.yml` 建环境、`conda activate`、跑测试。建议 CI 用 micromamba(单文件、启动快、无需 base Python)替代 conda 加速,或在 base 装 libmamba 求解器提速。CI 缓存 `~/miniconda3/envs` 或 `pkgs` 目录可在多次构建间复用,大幅缩短 CI 时间。关键是让本地、CI、生产用同一份 `environment.yml`,环境一致是 CI 可信的前提。

### 3.17 复杂环境考虑 mamba 作日常默认

装好 conda 并启用 libmamba 后,绝大多数场景已够快。但若你常建含数十个包的复杂科学环境、或频繁 `conda install` 试错,可把 **mamba** 作为日常默认(`mamba install`/`mamba env create` 命令几乎与 conda 同),它求解更快、进度条更友好。mamba 装在 base 环境:`conda install -n base -c conda-forge mamba`。新手先用 conda + libmamba,待感到求解仍是瓶颈再转 mamba,不必一开始就引入第二套命令。工具是为效率服务的,选当前够用且顺手的那一个。

### 3.18 区分 conda 装 Python 与系统 Python

conda 装的 Python 与系统自带 Python 是两套独立二进制,不要混淆:激活 conda 环境后 `which python` 指向 `envs/<名字>/bin/python`(conda 装的),退出后指向系统 Python。系统工具(apt/brew 装的某些工具)依赖系统 Python,conda 不碰它;反过来 conda 环境里的包也只在 conda 环境可见。理解这两套 Python 并存互不干扰,能避免"明明装了却系统命令找不到""升级 conda 的 python 影响了系统吗"等困惑。原则:**项目用 conda 环境的 Python,系统工具用系统 Python,各管各的,不要交叉污染**。

### 3.19 了解 conda 许可,商业项目规避 defaults

Anaconda 的默认频道(defaults/main)对大规模商用(通常指 200 人以上组织)有商业许可要求,个人学习、学术研究、小团队免费。企业商用为规避许可风险,应:优先用 conda-forge(完全免费开源)、从 `.condarc` 移除 defaults 频道、或购买 Anaconda 商业授权。这是个常被忽视却可能踩雷的点——公司项目里默认用 defaults 装,规模大了会有合规问题。养成"默认走 conda-forge"的习惯,既免费又包全,顺便规避许可。

### 3.20 科学项目兼顾可复现:锁定 Python 与关键包版本

数据科学/ML 项目对可复现性要求高(同样的代码+数据应出同样结果),环境层面要锁定:在 `environment.yml` 里把 `python=x.y` 和关键科学包(numpy/torch 等)版本写死,避免队友/CI 装到不同版本导致结果漂移(numerical 结果对 numpy 版本敏感)。配合 `--from-history` 导出干净清单、必要时上 conda-lock 锁构建号,从 Python 版本到包版本到构建逐层精确。可复现是科研与生产 ML 的底线,环境锁定是其第一道保障。

### 3.21 新机器快速配置 conda 的标准动作

拿到一台新机器要配 conda,标准动作一次到位:① 装 Miniconda;② `conda init <shell>` 并重启终端;③ 配 conda-forge 频道 + strict 优先级 + libmamba 求解器;④ 国内配清华镜像;⑤ `conda update conda` 升级;⑥(可选)`conda config --set auto_activate_base false`。这几步配好,后续建环境/装包又快又稳,不再被默认源慢、求解慢、defaults 许可等问题困扰。把这套动作记下或写进 dotfiles 脚本,新机器几分钟搞定 conda 配置,从此环境管理不再成为负担。

---

## 4. 总结

### 4.1 本文内容回顾

- **conda 定位**:跨平台包+环境管理工具,能管 Python 包、非 Python 依赖(C 库等)、Python 解释器版本本身;与 Anaconda(发行版,含大量预装包)/Miniconda(精简,仅 conda+Python)的关系。
- **与 pip+venv 对比**:conda 管得广(含 Python 版本、非 Python 依赖、预编译二进制)、装 C 扩展包顺;pip+venv 轻量、PyPI 包最全、纯 Python 够用。核心差异在管理范围。
- **何时用 conda**:数据科学/ML、需多 Python 版本、依赖非 Python 二进制、Windows 科学栈;纯 Python 项目用 pip+venv 即可。
- **环境模型**:conda 环境含独立 Python+包目录+C 库副本,自包含但占空间大;base 环境只放 conda,不在 base 开发。
- **安装**:Miniconda(推荐)/Anaconda,国内用清华镜像下载,`conda init` 初始化 shell,可选关闭 base 自动激活。
- **基本命令**:create/activate/deactivate/env list/install/list/remove/update 等。
- **创建环境**:`conda create -n 名 python=x`,自己装指定 Python 版本,是 conda 比 venv 强之处。
- **激活退出/列出删除**:`conda activate`/`deactivate`、`conda env list`、`conda env remove`。
- **装包卸载**:`conda install` 装包(含非 Python 依赖一起)、`conda list` 列全部(含 C 库)、remove/update。
- **channel 频道**:conda-forge(首选,全且免费)、defaults、bioconda;`channel_priority strict` 避免冲突。
- **与 pip 协作**:conda 环境可 pip 补包,先 conda 后 pip,别对同包双重装。
- **镜像源**:清华镜像配置(`~/.condarc`),加速国内下载。
- **环境导出复现**:`conda env export`/`--from-history`、`environment.yml` 含 conda+pip 包;跨平台用 from-history。
- **克隆环境**:`conda create -n new --clone old` 本地快速复制。
- **常见问题**:command not found、locale、装包慢、Solving 卡顿(libmamba/mamba)、conda/pip 冲突、空间大。
- **conda clean**:清缓存释放空间;**PyCharm 集成**:conda 环境作解释器。
- **mamba/micromamba/libmamba**:提速 conda 求解的方案。
- **环境结构与环境概念**:condas envs 目录结构(含独立 Python+C 库)、package/environment/channel 三层概念、构建号 build string 与跨平台含义。
- **.condarc 配置**:镜像/频道/求解器/行为的集中配置文件与 `conda config` 命令。
- **实战对比与边界**:pip+venv 装 pytorch 的坑 vs conda 的顺;conda 的限制(包不如 PyPI 全、占空间大、defaults 商业许可、不入系统包管理)。
- **与 Docker 关系**:conda 环境级隔离 vs Docker 系统级隔离,科学部署的 conda+Docker 组合。
- **常见误区**:base 装项目包、conda/pip 乱混、defaults 许可、跨平台用完整 yml、不清缓存、纯 Python 上 conda、不升级求解慢。
- **完整实战**:数据科学环境从零搭建全流程。

### 4.2 读完本文你应能掌握

- 说明 conda 是什么、与 Anaconda/Miniconda 的关系,及与 pip+venv 的本质差异(管理范围)。
- 判断一个项目该用 conda 还是 pip+venv,并说明各自适用场景。
- 安装 Miniconda、`conda init` 初始化、按需关闭 base 自动激活。
- 用 `conda create -n env python=x` 创建指定 Python 版本的独立环境,激活/退出/列出/删除。
- 用 `conda install` 装包(理解它会一并装非 Python 依赖),`conda list` 查看全环境包。
- 配置 conda-forge 频道与 strict 优先级、libmamba 求解器、国内镜像,优化 conda 速度与稳定性。
- 在 conda 环境里用 pip 补 conda 没有的包,并说明"先 conda 后 pip、不双重装"原则。
- 用 `conda env export --from-history` 导出可移植清单,`conda env create -f` 跨平台复现环境。
- 排查 command not found、装包慢、Solving 卡顿、conda/pip 冲突、空间膨胀等常见问题。
- 用 `conda clean` 清缓存、用 PyCharm 接入 conda 环境、用 mamba/libmamba 提速。
- 区分 conda 装的 Python 与系统 Python,在商业项目里规避 defaults 许可、用 conda-forge。
- 按最佳实践管理 conda:Miniconda+conda-forge+每项目一环境+定期 clean+场景化选型。