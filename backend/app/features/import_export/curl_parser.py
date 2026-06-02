"""cURL 命令解析器"""

import shlex
import json
from app.schemas import SendRequestInput, RequestParam, RequestHeader, AuthConfig, RequestBody


def parse_curl(curl_command: str) -> SendRequestInput:
    """解析 cURL 命令为请求对象

    支持格式:
    - curl -X POST url
    - curl -H "key: value" url
    - curl -d '{"key": "value"}' url
    - curl --data-raw '{"key": "value"}' url
    """
    # 预处理：移除反斜杠换行
    curl_command = curl_command.replace("\\\n", " ").strip()

    # 移除开头的 curl
    if curl_command.startswith("curl "):
        curl_command = curl_command[5:]
    elif curl_command == "curl":
        raise ValueError("无效的 cURL 命令")

    try:
        tokens = shlex.split(curl_command)
    except ValueError as e:
        raise ValueError(f"cURL 命令解析失败: {str(e)}")

    method = "GET"
    url = ""
    headers: list[RequestHeader] = []
    params: list[RequestParam] = []
    body_type = "none"
    body_data = {}
    auth = AuthConfig()

    i = 0
    while i < len(tokens):
        token = tokens[i]

        if token in ("-X", "--request"):
            i += 1
            if i < len(tokens):
                method = tokens[i].upper()

        elif token in ("-H", "--header"):
            i += 1
            if i < len(tokens):
                header_str = tokens[i]
                if ":" in header_str:
                    key, value = header_str.split(":", 1)
                    headers.append(RequestHeader(key=key.strip(), value=value.strip()))

        elif token in ("-d", "--data", "--data-raw", "--data-binary"):
            i += 1
            if i < len(tokens):
                data = tokens[i]
                if method == "GET":
                    method = "POST"
                # 尝试解析为 JSON
                try:
                    json_data = json.loads(data)
                    body_type = "json"
                    body_data = {"json_data": json_data}
                except json.JSONDecodeError:
                    body_type = "raw"
                    body_data = {"raw": data}

        elif token in ("-u", "--user"):
            i += 1
            if i < len(tokens):
                user_pass = tokens[i]
                if ":" in user_pass:
                    username, password = user_pass.split(":", 1)
                    auth = AuthConfig(type="basic", username=username, password=password)

        elif token == "--url":
            i += 1
            if i < len(tokens):
                url = tokens[i]

        elif token.startswith("http://") or token.startswith("https://"):
            url = token

        elif token in ("-G", "--get"):
            method = "GET"

        elif token == "--compressed":
            pass  # 忽略

        elif not token.startswith("-"):
            if not url:
                url = token

        i += 1

    if not url:
        raise ValueError("cURL 命令中未找到 URL")

    # 从 URL 中分离查询参数
    if "?" in url:
        base_url, query_string = url.split("?", 1)
        for pair in query_string.split("&"):
            if "=" in pair:
                key, value = pair.split("=", 1)
                params.append(RequestParam(key=key, value=value))
        url = base_url

    return SendRequestInput(
        method=method,
        url=url,
        params=params,
        headers=headers,
        auth=auth,
        body=RequestBody(
            type=body_type,
            **body_data,
        ),
    )


def generate_curl(request: SendRequestInput) -> str:
    """生成 cURL 命令

    Args:
        request: 请求对象

    Returns:
        str: cURL 命令
    """
    parts = ["curl"]

    # 方法
    if request.method.upper() != "GET":
        parts.append(f"-X {request.method.upper()}")

    # URL
    url = request.url
    if request.params:
        query_parts = []
        for param in request.params:
            if param.enabled:
                query_parts.append(f"{param.key}={param.value}")
        if query_parts:
            url += "?" + "&".join(query_parts)
    parts.append(f"'{url}'")

    # Headers
    for header in request.headers:
        if header.enabled:
            parts.append(f"-H '{header.key}: {header.value}'")

    # 认证
    if request.auth.type == "bearer" and request.auth.token:
        parts.append(f"-H 'Authorization: Bearer {request.auth.token}'")
    elif request.auth.type == "basic" and request.auth.username:
        parts.append(f"-u '{request.auth.username}:{request.auth.password}'")

    # 请求体
    if request.body:
        if request.body.type == "json" and request.body.json_data is not None:
            body_str = json.dumps(request.body.json_data, ensure_ascii=False)
            parts.append(f"-d '{body_str}'")
        elif request.body.type == "raw" and request.body.raw:
            parts.append(f"--data-raw '{request.body.raw}'")
        elif request.body.type == "form_data":
            for item in request.body.form_data:
                if item.enabled:
                    parts.append(f"-F '{item.key}={item.value}'")
        elif request.body.type == "urlencoded":
            pairs = []
            for item in request.body.urlencoded:
                if item.enabled:
                    pairs.append(f"{item.key}={item.value}")
            if pairs:
                encoded = "&".join(pairs)
                parts.append(f"--data-urlencode '{encoded}'")

    return " \\\n  ".join(parts)
