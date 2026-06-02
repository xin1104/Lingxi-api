"""请求发送服务"""

from sqlmodel import Session
from app.schemas import (
    SendRequestInput,
    ApiResponseData,
)
from app.features.request_workbench.http_client import send_request
from app.features.request_workbench.variable_resolver import resolve_variables


async def execute_request(
    request: SendRequestInput,
    session: Session,
) -> ApiResponseData:
    """执行 API 请求

    1. 解析变量
    2. 构建请求参数
    3. 发送请求
    4. 返回响应
    """
    # 合并变量
    variables = request.variables or {}

    # 解析 URL 中的变量
    url = resolve_variables(request.url, variables)

    # 构建查询参数
    params = {}
    for param in request.params:
        if param.enabled:
            key = resolve_variables(param.key, variables)
            value = resolve_variables(param.value, variables)
            params[key] = value

    # 构建请求头
    headers = {}
    for header in request.headers:
        if header.enabled:
            key = resolve_variables(header.key, variables)
            value = resolve_variables(header.value, variables)
            headers[key] = value

    # 处理认证
    auth = request.auth
    if auth.type == "bearer" and auth.token:
        token = resolve_variables(auth.token, variables)
        headers["Authorization"] = f"Bearer {token}"
    elif auth.type == "basic" and auth.username:
        # httpx 会自动处理 Basic Auth
        pass
    elif auth.type == "api_key" and auth.api_key:
        key = resolve_variables(auth.api_key, variables)
        header_name = auth.api_key_header or "Authorization"
        headers[header_name] = key
    elif auth.type == "custom" and auth.custom_header:
        value = resolve_variables(auth.custom_value, variables)
        headers[auth.custom_header] = value

    # 构建请求体
    body_data = None
    body_type = request.body.type if request.body else "none"

    if body_type == "json" and request.body.json_data is not None:
        body_data = {"json_data": request.body.json_data}
    elif body_type == "raw" and request.body.raw:
        raw = resolve_variables(request.body.raw, variables)
        body_data = {"raw": raw}
    elif body_type == "form_data":
        body_data = {"form_data": [p.model_dump() for p in request.body.form_data]}
    elif body_type == "urlencoded":
        body_data = {"urlencoded": [p.model_dump() for p in request.body.urlencoded]}

    # 发送请求
    result = await send_request(
        method=request.method,
        url=url,
        params=params,
        headers=headers,
        body=body_data,
        body_type=body_type,
        timeout=request.timeout,
    )

    return result
