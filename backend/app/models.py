"""SQLModel 数据模型定义"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON


class Collection(SQLModel, table=True):
    """接口集合"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Folder(SQLModel, table=True):
    """文件夹"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    collection_id: int = Field(foreign_key="collection.id")
    parent_id: Optional[int] = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.now)


class RequestItem(SQLModel, table=True):
    """请求项"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    method: str = "GET"
    url: str = ""
    params: list = Field(default=[], sa_column=Column(JSON))
    headers: list = Field(default=[], sa_column=Column(JSON))
    auth: dict = Field(default={}, sa_column=Column(JSON))
    body_type: str = "none"
    body: dict = Field(default={}, sa_column=Column(JSON))
    pre_script: str = ""
    test_script: str = ""
    collection_id: Optional[int] = Field(default=None, foreign_key="collection.id")
    folder_id: Optional[int] = Field(default=None, foreign_key="folder.id")
    sort_order: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Environment(SQLModel, table=True):
    """环境"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    is_current: bool = False
    created_at: datetime = Field(default_factory=datetime.now)


class VariableItem(SQLModel, table=True):
    """环境变量"""
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str
    value: str = ""
    enabled: bool = True
    description: str = ""
    environment_id: Optional[int] = Field(default=None, foreign_key="environment.id")
    is_global: bool = False
    created_at: datetime = Field(default_factory=datetime.now)


class HistoryRecord(SQLModel, table=True):
    """请求历史"""
    id: Optional[int] = Field(default=None, primary_key=True)
    method: str
    url: str
    status_code: Optional[int] = None
    duration: Optional[int] = None  # 毫秒
    size: Optional[int] = None  # 字节
    request_snapshot: dict = Field(default={}, sa_column=Column(JSON))
    response_summary: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class MockRoute(SQLModel, table=True):
    """Mock 路由"""
    id: Optional[int] = Field(default=None, primary_key=True)
    method: str = "GET"
    path: str = ""
    status_code: int = 200
    headers: dict = Field(default={"Content-Type": "application/json"}, sa_column=Column(JSON))
    body: str = '{"message": "ok"}'
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.now)


class MockLog(SQLModel, table=True):
    """Mock 请求日志"""
    id: Optional[int] = Field(default=None, primary_key=True)
    route_id: Optional[int] = Field(default=None, foreign_key="mockroute.id")
    method: str
    path: str
    matched: bool = True
    created_at: datetime = Field(default_factory=datetime.now)


class CaptureRecord(SQLModel, table=True):
    """请求捕获记录"""
    id: Optional[int] = Field(default=None, primary_key=True)
    method: str
    url: str
    status_code: Optional[int] = None
    duration: Optional[int] = None
    request_headers: dict = Field(default={}, sa_column=Column(JSON))
    request_body: Optional[str] = None
    response_headers: dict = Field(default={}, sa_column=Column(JSON))
    response_body: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class AppSettings(SQLModel, table=True):
    """应用设置"""
    id: Optional[int] = Field(default=None, primary_key=True)
    theme: str = "dark"
    default_timeout: int = 30
    history_limit: int = 100
    auto_format_json: bool = True
    auto_save_history: bool = True
    mock_port: int = 4567
    proxy_type: str = "none"  # none, system, custom
    proxy_url: str = ""
