"""变量解析器 - 替换请求中的变量"""

import re
import uuid
import time
from datetime import datetime


# 内置变量生成器
BUILTIN_VARIABLES = {
    "$timestamp": lambda: str(int(time.time())),
    "$datetime": lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "$uuid": lambda: str(uuid.uuid4()),
    "$randomInt": lambda: str(int(time.time() * 1000) % 1000000),
}


def resolve_variables(text: str, variables: dict[str, str]) -> str:
    """替换文本中的变量引用

    支持格式: {{变量名}}
    替换顺序: 1.传入变量 2.内置变量
    """
    if not text:
        return text

    def replace_var(match: re.Match) -> str:
        var_name = match.group(1).strip()
        # 先查传入的变量
        if var_name in variables:
            return variables[var_name]
        # 再查内置变量
        if var_name in BUILTIN_VARIABLES:
            return BUILTIN_VARIABLES[var_name]()
        # 未找到则保留原样
        return match.group(0)

    return re.sub(r"\{\{(.+?)\}\}", replace_var, text)


def resolve_request_variables(request_data: dict, variables: dict[str, str]) -> dict:
    """解析请求数据中的所有变量"""
    import json

    # 深拷贝避免修改原始数据
    data = json.loads(json.dumps(request_data))

    # 解析 URL
    if "url" in data:
        data["url"] = resolve_variables(data["url"], variables)

    # 解析参数
    if "params" in data:
        for param in data["params"]:
            param["key"] = resolve_variables(param["key"], variables)
            param["value"] = resolve_variables(param["value"], variables)

    # 解析请求头
    if "headers" in data:
        for header in data["headers"]:
            header["key"] = resolve_variables(header["key"], variables)
            header["value"] = resolve_variables(header["value"], variables)

    # 解析认证
    if "auth" in data:
        auth = data["auth"]
        for key in ["token", "username", "password", "api_key", "custom_value"]:
            if key in auth and auth[key]:
                auth[key] = resolve_variables(auth[key], variables)

    # 解析请求体
    if "body" in data:
        body = data["body"]
        if body.get("raw"):
            body["raw"] = resolve_variables(body["raw"], variables)
        if body.get("json_data") and isinstance(body["json_data"], str):
            body["json_data"] = resolve_variables(body["json_data"], variables)

    return data
