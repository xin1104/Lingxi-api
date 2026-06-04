"""请求发送服务"""

from sqlmodel import Session, select
from app.models import AppSettings
from app.schemas import SendRequestInput, ApiResponseData, ScriptResults, TestResultItem
from app.features.request_workbench.http_client import send_request
from app.features.request_workbench.variable_resolver import resolve_variables
from app.features.request_workbench.pre_script import PreScriptRunner
from app.features.request_workbench.test_runner import TestRunner
from app.features.cookie_jar.service import save_cookies, get_matching_cookies


def _apply_header_changes(headers: dict, changes: list[dict]):
    """应用 Pre Script 中的 header 修改"""
    for change in changes:
        if change["action"] == "set":
            headers[change["key"]] = change["value"]
        elif change["action"] == "remove":
            headers.pop(change["key"], None)


def _apply_param_changes(params: dict, changes: list[dict]):
    """应用 Pre Script 中的 param 修改"""
    for change in changes:
        if change["action"] == "set":
            params[change["key"]] = change["value"]
        elif change["action"] == "remove":
            params.pop(change["key"], None)


async def execute_request(
    request: SendRequestInput,
    session: Session,
) -> ApiResponseData:
    variables = request.variables or {}

    # ---- 1. 执行 Pre Script（先执行一次以获取 env 变更） ----
    pre_logs = []
    env_changes = {}
    body_override = None
    header_changes = []
    param_changes = []
    if request.pre_script and request.pre_script.strip():
        pr = PreScriptRunner()
        pre_result = pr.run(request.pre_script, variables)
        pre_logs = pre_result.get("logs", [])
        env_changes = pre_result.get("env_changes", {})
        body_override = pre_result.get("body_override")
        header_changes = pre_result.get("header_changes", [])
        param_changes = pre_result.get("param_changes", [])

    # ---- 2. 解析变量（URL/Params/Headers） ----
    url = resolve_variables(request.url, variables)
    params = {}
    for param in request.params:
        if param.enabled:
            params[resolve_variables(param.key, variables)] = resolve_variables(param.value, variables)
    headers = {}
    for header in request.headers:
        if header.enabled:
            headers[resolve_variables(header.key, variables)] = resolve_variables(header.value, variables)

    # ---- 3. 应用 Pre Script 的 header/param 修改 ----
    _apply_header_changes(headers, header_changes)
    _apply_param_changes(params, param_changes)

    # ---- 4. 认证处理 ----
    auth = request.auth
    if auth.type == "bearer" and auth.token:
        headers["Authorization"] = f"Bearer {resolve_variables(auth.token, variables)}"
    elif auth.type == "api_key" and auth.api_key:
        header_name = auth.api_key_header or "Authorization"
        headers[header_name] = resolve_variables(auth.api_key, variables)
    elif auth.type == "custom" and auth.custom_header:
        headers[auth.custom_header] = resolve_variables(auth.custom_value, variables)

    # ---- 5. Cookie Jar ----
    settings = session.exec(select(AppSettings)).first()
    cookie_jar_enabled = settings.cookie_jar_enabled if settings else True
    has_manual_cookie = any(h.key.lower() == "cookie" and h.enabled for h in request.headers)
    if cookie_jar_enabled and not has_manual_cookie:
        cj = get_matching_cookies(url, session)
        if cj:
            existing = headers.get("Cookie", "")
            headers["Cookie"] = f"{existing}; {cj}" if existing else cj

    # ---- 6. 构建请求体 ----
    body_data = None
    body_type = request.body.type if request.body else "none"
    if body_override is not None:
        body_data = body_override
        body_type = "raw"
    elif body_type == "json" and request.body.json_data is not None:
        body_data = {"json_data": request.body.json_data}
    elif body_type == "raw" and request.body.raw:
        body_data = {"raw": resolve_variables(request.body.raw, variables)}
    elif body_type == "form_data":
        body_data = {"form_data": [p.model_dump() for p in request.body.form_data]}
    elif body_type == "urlencoded":
        body_data = {"urlencoded": [p.model_dump() for p in request.body.urlencoded]}

    # ---- 7. 发送 HTTP 请求 ----
    result = await send_request(
        method=request.method, url=url, params=params, headers=headers,
        body=body_data, body_type=body_type, timeout=request.timeout,
    )

    # ---- 8. 保存 Cookie ----
    if cookie_jar_enabled and result.status_code > 0:
        try:
            save_cookies(result.headers, url, session)
        except Exception:
            pass

    # ---- 9. 执行 Tests 脚本 ----
    test_results = []
    if request.test_script and request.test_script.strip():
        response_dict = {
            "status_code": result.status_code,
            "headers": result.headers,
            "body": result.body,
            "duration": result.duration,
            "content_type": result.content_type,
            "body_size": result.body_size,
        }
        tr = TestRunner(response_dict, variables)
        test_results = tr.run(request.test_script)

    # ---- 10. 组装返回 ----
    result.script_results = ScriptResults(
        pre_script_logs=pre_logs,
        test_results=[TestResultItem(**t) for t in test_results],
        env_changes=env_changes,
    )
    return result
