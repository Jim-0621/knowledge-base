## Bark 简介

Bark 是一款注重隐私、安全可控的自定义通知推送工具。

特点如下：

- 免费、轻量！简单调用接口即可给自己的iPhone发送推送。
- 依赖苹果APNs，及时、稳定、可靠
- 不会消耗设备的电量， 基于系统推送服务与推送扩展，APP本体并不需要运行。



## Bark 的一些玩法



### 天气推送

这是一个基于 Python 编写的自动化天气推送脚本。不同于普通的天气预报，它不仅提供基础的天气数据，还具备**人性化的“温差体感”对比**和**早晚报智能切换**功能。

利用 iOS 的 **Bark** 应用，将整理好的天气简报直接推送到你的 iPhone 上。

#### ✨ 核心功能

1. **🌡️ 智能温差感知**：
   - 不再只是冷冰冰的数字，脚本会自动对比**昨天**（早报模式）或**今天**（晚报模式）的气温。
   - 输出如：“比昨天暖和得多”、“和今天气温相近”等符合直觉的描述，辅助穿衣决策。
2. **🌗 早晚报模式自动切换**：
   - **早报 (00:00 - 12:00)**：关注今天白天的天气和当前实时温度，对比昨天气温。
   - **晚报 (12:00 - 24:00)**：关注今晚天气及**明天**的预报，提醒明天的气温变化。
3. **🔐 企业级安全认证**：
   - 采用和风天气推荐的 JWT (Ed25519) 非对称加密方式进行 API 鉴权，比普通 Key 更安全。
4. **📡 多用户/多城市支持**：
   - 配置文件支持数组，可同时为多个城市或多个 Bark Key 推送不同的天气信息。

#### 🛠️ 依赖与配置

**1. Python 依赖库** 需要安装以下库：

```Bash
pip install requests pyjwt cryptography pytz
```

**2. 配置文件准备** 你需要准备两个辅助文件放在脚本同级目录：

- `ed25519-private.pem`: 在和风天气控制台生成的私钥文件。

- `city_mapping.json`: 城市名称与 Location ID 的映射表，格式如下：

  JSON

  ```
  {
    "北京": "101010100",
    "上海": "101020100"
  }
  ```

**3. 脚本内配置** 在代码顶部的 `配置区域` 填入你的：

- `PROJECT_ID` (和风天气项目ID)
- `KEY_ID` (公钥ID)
- `API_HOST`(和风天气API_HOST)
- `USERS` 列表 (城市名和对应的 Bark 推送 Key)

#### 🚀 运行效果

**早报示例：**

> **北京 天气摘要** 白天多云，比昨天暖和一些。现在18°C，全天15-24°C。

**晚报示例：**

> **北京 天气摘要** 晚间晴，当前20°C。明天小雨，比今天凉快得多，全天12-18°C。



#### 💡 建议

你可以将此脚本部署在服务器或 NAS 上，通过 `crontab` 设置每天早上 7 点和晚上 9 点定时运行，即可实现全自动的天气提醒服务。

笔者部署到了 Github Action 中。



#### 代码示例

``` python
import requests
import time
import jwt
from cryptography.hazmat.primitives import serialization
import json
import os
from datetime import datetime, timedelta
import pytz

# ------------------- 配置区域 -------------------
# 请前往和风天气控制台获取以下信息
PRIVATE_KEY_FILE = "ed25519-private.pem"  # 私钥文件路径
PROJECT_ID = "YOUR_PROJECT_ID"            # 替换为你的和风天气 Project ID
KEY_ID = "YOUR_KEY_ID"                    # 替换为你的和风天气 Key ID
WEATHER_HOST = "YOUR_API_HOST" # 替换为你的和风天气 API HOST

CITY_MAPPING_FILE = "city_mapping.json"   # 城市与ID映射文件

# 用户配置：配置需要推送的城市名和对应的 Bark Key
USERS = [
    {"city_name": "你的城市1", "bark_key": "YOUR_BARK_KEY_1"},
    {"city_name": "你的城市2", "bark_key": "YOUR_BARK_KEY_2"}
]
# ----------------------------------------------


# 从 city_mapping.json 读取城市对应的 location_id
def get_city_id(city_name: str) -> str:
    mapping_path = os.path.join(os.path.dirname(__file__), CITY_MAPPING_FILE)
    if not os.path.exists(mapping_path):
        raise FileNotFoundError(f"未找到 {mapping_path}，请确认 city_mapping.json 是否存在。")

    with open(mapping_path, "r", encoding="utf-8") as f:
        city_map = json.load(f)

    city_id = city_map.get(city_name)
    if not city_id:
        raise ValueError(f"未在 city_mapping.json 中找到城市 '{city_name}' 的ID，请检查配置。")

    return city_id


# 读取 PEM 私钥
def load_private_key():
    try:
        with open(PRIVATE_KEY_FILE, "rb") as f:
            return serialization.load_pem_private_key(f.read(), password=None)
    except FileNotFoundError:
        print(f"错误：找不到私钥文件 {PRIVATE_KEY_FILE}")
        exit(1)

private_key = load_private_key()


# 生成 JWT (用于和风天气认证)
def generate_jwt():
    payload = {
        "iat": int(time.time()) - 30,
        "exp": int(time.time()) + 900,
        "sub": PROJECT_ID
    }
    headers = {"kid": KEY_ID}
    token = jwt.encode(payload, private_key, algorithm="EdDSA", headers=headers)
    return token


# 通用 API 调用
def fetch_api(url):
    token = generate_jwt()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.json()
        if data.get("code") != "200":
             print(f"API返回错误: {data}")
             return {}
        return data
    except Exception as e:
        print(f"请求失败: {e}")
        return {}


# 获取实时天气
def get_now_weather(location_id):
    url = f"{WEATHER_HOST}/v7/weather/now?location={location_id}"
    res = fetch_api(url)
    return res.get("now", {})


# 获取未来三天天气
def get_3d_weather(location_id):
    url = f"{WEATHER_HOST}/v7/weather/3d?location={location_id}"
    res = fetch_api(url)
    return res.get("daily", [])


# 获取昨天历史天气
def get_yesterday_weather(location_id):
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
    url = f"{WEATHER_HOST}/v7/historical/weather?location={location_id}&date={yesterday}"
    res = fetch_api(url)
    return res.get("weatherDaily", {})


# 拼接天气摘要
def build_summary(location_id, now_weather, daily_list, is_morning=True):
    if not now_weather or not daily_list:
        return "获取天气数据失败", ""
        
    today = daily_list[0]
    yesterday = get_yesterday_weather(location_id)
    summary = ""

    now_temp = now_weather.get("temp", "N/A")
    weather_icon = now_weather.get("icon", "100")

    # 定义温差描述逻辑
    def describe_temp_diff(period, diff):
        abs_diff = abs(diff)
        if abs_diff < 2:
            return f"{period}和昨天温度相近"
        elif abs_diff < 5:
            return f"{period}比昨天暖和一些" if diff > 0 else f"{period}比昨天凉快一些"
        else:
            return f"{period}比昨天暖和得多" if diff > 0 else f"{period}比昨天凉快得多"

    if is_morning:
        # 早报模式：关注今天白天天气，对比昨天
        day_text = today["textDay"]
        diff_text = ""
        
        if yesterday:
            day_diff = int(today["tempMax"]) - int(yesterday["tempMax"])
            diff_text = "，" + describe_temp_diff("", day_diff)

        summary += f"白天{day_text}{diff_text}。现在{now_temp}°C，全天{today['tempMin']}-{today['tempMax']}°C。"

    else:
        # 晚报模式：关注明天天气，对比今天
        tonight_text = today["textNight"]
        tomorrow = daily_list[1]
        tomorrow_text = tomorrow["textDay"]
        
        diff = int(tomorrow["tempMax"]) - int(today["tempMax"])
        if abs(diff) < 2:
            temp_diff = "和今天气温相近"
        elif abs(diff) < 5:
            temp_diff = "比今天暖和一些" if diff > 0 else "比今天凉快一些"
        else:
            temp_diff = "比今天暖和得多" if diff > 0 else "比今天凉快得多"

        summary += f"晚间{tonight_text}，当前{now_temp}°C。明天{tomorrow_text}，{temp_diff}，全天{tomorrow['tempMin']}-{tomorrow['tempMax']}°C。"

    return summary, f"https://a.hecdn.net/img/common/icon/202106d/{weather_icon}.png"


# Bark 推送
def send_bark(summary, icon_url, bark_key, city_name, title=" 天气摘要", group="天气推送"):
    url = "https://api.day.app/push"
    data = {
        "device_key": bark_key,
        "title": city_name + title,
        "body": summary,
        "group": group,
        "icon": icon_url
    }
    headers = {"Content-Type": "application/json; charset=utf-8"}
    try:
        r = requests.post(url, headers=headers, data=json.dumps(data))
        r.raise_for_status()
    except Exception as e:
        print(f"Bark 推送失败：{city_name}，错误：{e}")


if __name__ == "__main__":
    mode = None

    # 自动判断当前时间 (基于上海时间)
    shanghai_tz = pytz.timezone("Asia/Shanghai")
    now_shanghai = datetime.now(shanghai_tz)
    now_hour = now_shanghai.hour
    
    # 0-12点为早报模式，其余为晚报模式
    if 0 <= now_hour < 12:
        mode = "morning"
    else:
        mode = "evening"

    is_morning = mode == "morning"
    print(f"当前模式：{mode}（自动判断）")

    for user in USERS:
        try:
            cid = get_city_id(user["city_name"])
            now_weather = get_now_weather(cid)
            daily_list = get_3d_weather(cid)

            summary, icon_url = build_summary(
                cid, now_weather, daily_list, is_morning=is_morning
            )
            
            prefix = "[Morning]" if is_morning else "[Evening]"
            print(f"{prefix} {user['city_name']} 推送内容:\n{summary}\n")
            
            send_bark(summary, icon_url, user["bark_key"], user["city_name"])
        except Exception as e:
            print(f"处理城市 {user['city_name']} 时发生错误: {e}")
```





### 最新消息获取





代码示例

``` python
```

