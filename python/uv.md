## 从 conda 切换到 uv



### 1. 安装 uv

先在系统上安装 uv。Windows 可以用 PowerShell：

```
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

然后把 uv 安装目录加入 PATH，例如：

```
$env:Path = "C:\Users\<用户名>\.local\bin;$env:Path"
```

或者在系统环境变量里永久添加 `C:\Users\<用户名>\.local\bin`。



### 2. 在项目目录创建虚拟环境

假设项目根目录里已经有 `pyproject.toml` 和 `uv.lock`：

```
uv venv --python 3.13.9 .venv
```

> 这一步会根据 `pyproject.toml` 的 `requires-python` 创建对应 Python 版本的虚拟环境，并放到 `.venv` 目录。





###  3. 同步依赖

虚拟环境激活后执行：

```
uv sync
```

uv 会读取 `uv.lock` 文件并安装锁定的依赖版本，保证每台电脑环境完全一致。



### 4. Pycharm 切换解释器

添加本地解释器

``` shell
C:\Users\Jim\.local\bin\uv.exe  # uv 的路径
C:\Projects\Python\JimTools\.venv\Scripts\python.exe  # uv env use
```





## 已有项目初始化



### 1. 初始化

（创建虚拟环境 + 生成项目配置文件 + 不生成基础项目结构：`src/`、`README.md` 等）

``` cmd
uv init --no-src
```



### 2. 安装依赖

假设你的项目用到 Flask、Requests、NumPy 等，你可以这样安装：

```
uv add flask requests numpy
```





