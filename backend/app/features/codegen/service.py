"""代码生成服务"""

import json
from app.schemas import CodegenRequest


def generate_code(request: CodegenRequest) -> str:
    """根据请求生成代码"""
    generators = {
        "curl": generate_curl,
        "python": generate_python,
        "javascript": generate_javascript,
        "node": generate_node,
        "go": generate_go,
    }

    generator = generators.get(request.language)
    if not generator:
        raise ValueError(f"不支持的语言: {request.language}")

    return generator(request)


def _build_url(request: CodegenRequest) -> str:
    """构建完整 URL"""
    url = request.url
    enabled_params = [p for p in request.params if p.enabled]
    if enabled_params:
        query = "&".join(f"{p.key}={p.value}" for p in enabled_params)
        url += "?" + query if "?" not in url else "&" + query
    return url


def _get_headers_dict(request: CodegenRequest) -> dict:
    """获取启用的请求头"""
    headers = {}
    for h in request.headers:
        if h.enabled:
            headers[h.key] = h.value

    # 处理认证
    if request.auth.type == "bearer" and request.auth.token:
        headers["Authorization"] = f"Bearer {request.auth.token}"
    elif request.auth.type == "api_key" and request.auth.api_key:
        header_name = request.auth.api_key_header or "Authorization"
        headers[header_name] = request.auth.api_key

    return headers


def generate_curl(request: CodegenRequest) -> str:
    """生成 cURL 命令"""
    parts = ["curl"]

    if request.method.upper() != "GET":
        parts.append(f"-X {request.method.upper()}")

    parts.append(f"'{_build_url(request)}'")

    for key, value in _get_headers_dict(request).items():
        parts.append(f"-H '{key}: {value}'")

    if request.auth.type == "basic":
        parts.append(f"-u '{request.auth.username}:{request.auth.password}'")

    if request.body.type == "json" and request.body.json_data is not None:
        body_str = json.dumps(request.body.json_data, ensure_ascii=False)
        parts.append(f"-d '{body_str}'")
    elif request.body.type == "raw" and request.body.raw:
        parts.append(f"--data-raw '{request.body.raw}'")

    return " \\\n  ".join(parts)


def generate_python(request: CodegenRequest) -> str:
    """生成 Python requests 代码"""
    url = _build_url(request)
    headers = _get_headers_dict(request)

    lines = ["import requests", ""]

    # URL
    lines.append(f'url = "{url}"')
    lines.append("")

    # Headers
    if headers:
        lines.append("headers = {")
        for key, value in headers.items():
            lines.append(f'    "{key}": "{value}",')
        lines.append("}")
        lines.append("")

    # Body
    body_data = None
    if request.body.type == "json" and request.body.json_data is not None:
        lines.append(f"payload = {json.dumps(request.body.json_data, ensure_ascii=False, indent=4)}")
        lines.append("")
        body_data = "json=payload"
    elif request.body.type == "raw" and request.body.raw:
        lines.append(f'data = """{request.body.raw}"""')
        lines.append("")
        body_data = "data=data"
    elif request.body.type == "form_data":
        lines.append("files = {")
        for item in request.body.form_data:
            if item.enabled:
                lines.append(f'    "{item.key}": "{item.value}",')
        lines.append("}")
        lines.append("")
        body_data = "files=files"
    elif request.body.type == "urlencoded":
        lines.append("data = {")
        for item in request.body.urlencoded:
            if item.enabled:
                lines.append(f'    "{item.key}": "{item.value}",')
        lines.append("}")
        lines.append("")
        body_data = "data=data"

    # 请求
    method = request.method.lower()
    call_args = ["url"]
    if headers:
        call_args.append("headers=headers")
    if body_data:
        call_args.append(body_data)

    args_str = ", ".join(call_args)
    lines.append(f"response = requests.{method}({args_str})")
    lines.append("")
    lines.append("print(response.status_code)")
    lines.append("print(response.text)")

    return "\n".join(lines)


def generate_javascript(request: CodegenRequest) -> str:
    """生成 JavaScript fetch 代码"""
    url = _build_url(request)
    headers = _get_headers_dict(request)

    lines = []

    # 构建 options
    options = {
        "method": request.method.upper(),
    }
    if headers:
        options["headers"] = headers

    if request.body.type == "json" and request.body.json_data is not None:
        options["body"] = json.dumps(request.body.json_data, ensure_ascii=False)
        if "Content-Type" not in headers:
            options.setdefault("headers", {})["Content-Type"] = "application/json"
    elif request.body.type == "raw" and request.body.raw:
        options["body"] = request.body.raw

    options_str = json.dumps(options, indent=2, ensure_ascii=False)

    lines.append(f"fetch('{url}', {options_str})")
    lines.append("  .then(response => response.json())")
    lines.append("  .then(data => console.log(data))")
    lines.append("  .catch(error => console.error('Error:', error));")

    return "\n".join(lines)


def generate_node(request: CodegenRequest) -> str:
    """生成 Node.js axios 代码"""
    url = _build_url(request)
    headers = _get_headers_dict(request)

    lines = ["const axios = require('axios');", ""]

    config = {
        "method": request.method.lower(),
        "url": url,
        "headers": headers,
    }

    if request.body.type == "json" and request.body.json_data is not None:
        config["data"] = request.body.json_data
    elif request.body.type == "raw" and request.body.raw:
        config["data"] = request.body.raw

    config_str = json.dumps(config, indent=2, ensure_ascii=False)

    lines.append(f"axios({config_str})")
    lines.append("  .then(response => {")
    lines.append("    console.log(response.status);")
    lines.append("    console.log(response.data);")
    lines.append("  })")
    lines.append("  .catch(error => {")
    lines.append("    console.error(error);")
    lines.append("  });")

    return "\n".join(lines)


def generate_go(request: CodegenRequest) -> str:
    """生成 Go net/http 代码"""
    url = _build_url(request)
    headers = _get_headers_dict(request)

    lines = [
        "package main",
        "",
        "import (",
        '    "fmt"',
        '    "io"',
        '    "net/http"',
    ]

    if request.body.type in ("json", "raw"):
        lines.append('    "strings"')

    lines.append(")")
    lines.append("")
    lines.append("func main() {")

    # Body
    body_var = "nil"
    if request.body.type == "json" and request.body.json_data is not None:
        body_str = json.dumps(request.body.json_data, ensure_ascii=False)
        lines.append(f'    body := strings.NewReader(`{body_str}`)')
        body_var = "body"
    elif request.body.type == "raw" and request.body.raw:
        lines.append(f'    body := strings.NewReader(`{request.body.raw}`)')
        body_var = "body"

    lines.append("")
    lines.append(f'    req, err := http.NewRequest("{request.method.upper()}", "{url}", {body_var})')
    lines.append("    if err != nil {")
    lines.append("        panic(err)")
    lines.append("    }")
    lines.append("")

    # Headers
    for key, value in headers.items():
        lines.append(f'    req.Header.Set("{key}", "{value}")')

    lines.append("")
    lines.append("    client := &http.Client{}")
    lines.append("    resp, err := client.Do(req)")
    lines.append("    if err != nil {")
    lines.append("        panic(err)")
    lines.append("    }")
    lines.append("    defer resp.Body.Close()")
    lines.append("")
    lines.append("    fmt.Println(resp.StatusCode)")
    lines.append("")
    lines.append("    respBody, _ := io.ReadAll(resp.Body)")
    lines.append("    fmt.Println(string(respBody))")
    lines.append("}")

    return "\n".join(lines)
