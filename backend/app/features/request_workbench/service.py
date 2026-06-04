"""请求发送服务"""

from sqlmodel import Session, select
from app.models import AppSettings
from app.schemas import SendRequestInput, ApiResponseData
from app.features.request_workbench.http_client import send_request
from app.features.request_workbench.variable_resolver import resolve_variables
from app.features.cookie_jar.service import save_cookies, get_matching_cookies


async def execute_request(
    request: SendRequestInput,
    session: Session,
) -> ApiResponseData:
    variables = request.variables or {}
    url = resolve_variables(request.url, variables)
    params = {}
    for param in request.params:
        if param.enabled:
            params[resolve_variables(param.key, variables)] = resolve_variables(param.value, variables)
    headers = {}
    for header in request.headers:
        if header.enabled:
            headers[resolve_variables(header.key, variables)] = resolve_variables(header.value, variables)
    auth = request.auth
    if auth.type == "bearer" and auth.token:
        headers["Authorization"] = f"Bearer {resolve_variables(auth.token, variables)}"
    elif auth.type == "api_key" and auth.api_key:
        header_name = auth.api_key_header or "Authorization"
        headers[header_name] = resolve_variables(auth.api_key, variables)
    elif auth.type == "custom" and auth.custom_header:
        headers[auth.custom_header] = resolve_variables(auth.custom_value, variables)
    settings = session.exec(select(AppSettings)).first()
    cookie_jar_enabled = settings.cookie_jar_enabled if settings else True
    has_manual_cookie = any(h.key.lower() == "cookie" and h.enabled for h in request.headers)
    if cookie_jar_enabled and not has_manual_cookie:
        cj = get_matching_cookies(url, session)
        if cj:
            existing = headers.get("Cookie", "")
            headers["Cookie"] = f"{existing}; {cj}" if existing else cj
    body_data = None
    body_type = request.body.type if request.body else "none"
    if body_type == "json" and request.body.json_data is not None:
        body_data = {"json_data": request.body.json_data}
    elif body_type == "raw" and request.body.raw:
        body_data = {"raw": resolve_variables(request.body.raw, variables)}
    elif body_type == "form_data":
        body_data = {"form_data": [p.model_dump() for p in request.body.form_data]}
    elif body_type == "urlencoded":
        body_data = {"urlencoded": [p.model_dump() for p in request.body.urlencoded]}
    result = await send_request(
        method=request.method, url=url, params=params, headers=headers,
        body=body_data, body_type=body_type, timeout=request.timeout,
    )
    if cookie_jar_enabled and result.status_code > 0:
        try:
            save_cookies(result.headers, url, session)
        except Exception:
            pass
    return result
