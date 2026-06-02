"""Pydantic 请求/响应模式定义"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ===== 通用 =====

class ApiResponse(BaseModel):
    """统一 API 响应格式"""
    success: bool = True
    message: str = ""
    data: Any = None


# ===== 请求相关 =====

class RequestParam(BaseModel):
    """请求参数"""
    key: str
    value: str = ""
    enabled: bool = True
    description: str = ""


class RequestHeader(BaseModel):
    """请求头"""
    key: str
    value: str = ""
    enabled: bool = True
    description: str = ""


class AuthConfig(BaseModel):
    """认证配置"""
    type: str = "none"  # none, bearer, basic, api_key, custom
    token: str = ""
    username: str = ""
    password: str = ""
    api_key: str = ""
    api_key_header: str = "Authorization"
    custom_header: str = ""
    custom_value: str = ""


class RequestBody(BaseModel):
    """请求体"""
    type: str = "none"  # none, raw, json, form_data, urlencoded, binary
    raw: str = ""
    json_data: Any = None
    form_data: list[RequestParam] = []
    urlencoded: list[RequestParam] = []
    binary_path: str = ""


class ApiRequest(BaseModel):
    """API 请求"""
    method: str = "GET"
    url: str = ""
    params: list[RequestParam] = []
    headers: list[RequestHeader] = []
    auth: AuthConfig = Field(default_factory=AuthConfig)
    body: RequestBody = Field(default_factory=RequestBody)
    timeout: int = 30
    proxy: Optional[str] = None


class SendRequestInput(BaseModel):
    """发送请求输入"""
    method: str = "GET"
    url: str = ""
    params: list[RequestParam] = []
    headers: list[RequestHeader] = []
    auth: AuthConfig = Field(default_factory=AuthConfig)
    body: RequestBody = Field(default_factory=RequestBody)
    timeout: int = 30
    variables: dict[str, str] = {}


class ApiResponseData(BaseModel):
    """API 响应数据"""
    status_code: int = 0
    headers: dict[str, str] = {}
    body: str = ""
    body_size: int = 0
    duration: int = 0  # 毫秒
    content_type: str = ""
    error: Optional[str] = None


# ===== 集合相关 =====

class CollectionCreate(BaseModel):
    """创建集合"""
    name: str
    description: str = ""


class CollectionUpdate(BaseModel):
    """更新集合"""
    name: Optional[str] = None
    description: Optional[str] = None


class FolderCreate(BaseModel):
    """创建文件夹"""
    name: str
    collection_id: int
    parent_id: Optional[int] = None


class RequestItemCreate(BaseModel):
    """创建请求项"""
    name: str
    method: str = "GET"
    url: str = ""
    params: list[RequestParam] = []
    headers: list[RequestHeader] = []
    auth: AuthConfig = Field(default_factory=AuthConfig)
    body_type: str = "none"
    body: RequestBody = Field(default_factory=RequestBody)
    pre_script: str = ""
    test_script: str = ""
    collection_id: Optional[int] = None
    folder_id: Optional[int] = None


class RequestItemUpdate(BaseModel):
    """更新请求项"""
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    params: Optional[list[RequestParam]] = None
    headers: Optional[list[RequestHeader]] = None
    auth: Optional[AuthConfig] = None
    body_type: Optional[str] = None
    body: Optional[RequestBody] = None
    pre_script: Optional[str] = None
    test_script: Optional[str] = None


# ===== 环境相关 =====

class VariableItemCreate(BaseModel):
    """创建变量"""
    key: str
    value: str = ""
    enabled: bool = True
    description: str = ""
    is_global: bool = False


class VariableItemUpdate(BaseModel):
    """更新变量"""
    key: Optional[str] = None
    value: Optional[str] = None
    enabled: Optional[bool] = None
    description: Optional[str] = None


class EnvironmentCreate(BaseModel):
    """创建环境"""
    name: str
    variables: list[VariableItemCreate] = []


class EnvironmentUpdate(BaseModel):
    """更新环境"""
    name: Optional[str] = None


class SetCurrentEnvironment(BaseModel):
    """设置当前环境"""
    environment_id: int


# ===== 历史相关 =====

class HistoryRecordCreate(BaseModel):
    """创建历史记录"""
    method: str
    url: str
    status_code: Optional[int] = None
    duration: Optional[int] = None
    size: Optional[int] = None
    request_snapshot: dict = {}
    response_summary: Optional[str] = None
    error_message: Optional[str] = None


# ===== Mock 相关 =====

class MockRouteCreate(BaseModel):
    """创建 Mock 路由"""
    method: str = "GET"
    path: str = ""
    status_code: int = 200
    headers: dict = Field(default={"Content-Type": "application/json"})
    body: str = '{"message": "ok"}'
    enabled: bool = True


class MockRouteUpdate(BaseModel):
    """更新 Mock 路由"""
    method: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = None
    headers: Optional[dict] = None
    body: Optional[str] = None
    enabled: Optional[bool] = None


# ===== 导入导出 =====

class CurlImport(BaseModel):
    """cURL 导入"""
    curl_command: str


class PostmanImport(BaseModel):
    """Postman 导入"""
    data: dict


class OpenApiImport(BaseModel):
    """OpenAPI 导入"""
    data: dict


class CodegenRequest(BaseModel):
    """代码生成请求"""
    method: str = "GET"
    url: str = ""
    params: list[RequestParam] = []
    headers: list[RequestHeader] = []
    auth: AuthConfig = Field(default_factory=AuthConfig)
    body: RequestBody = Field(default_factory=RequestBody)
    language: str = "curl"  # curl, python, javascript, node, go


class CodegenResult(BaseModel):
    """代码生成结果"""
    language: str
    code: str


# ===== 设置 =====

class AppSettingsUpdate(BaseModel):
    """更新应用设置"""
    theme: Optional[str] = None
    default_timeout: Optional[int] = None
    history_limit: Optional[int] = None
    auto_format_json: Optional[bool] = None
    auto_save_history: Optional[bool] = None
    mock_port: Optional[int] = None
    proxy_type: Optional[str] = None
    proxy_url: Optional[str] = None


# ===== 脚本测试 =====

class TestResult(BaseModel):
    """测试结果"""
    passed: bool = True
    message: str = ""
    expected: Any = None
    actual: Any = None


class ScriptExecuteResult(BaseModel):
    """脚本执行结果"""
    success: bool = True
    error: Optional[str] = None
    test_results: list[TestResult] = []
    modified_request: Optional[SendRequestInput] = None
    env_changes: dict[str, str] = {}
