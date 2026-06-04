"""设置路由"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.config import DATA_DIR
from app.models import (
    AppSettings,
    Collection,
    Folder,
    RequestItem,
    Environment,
    VariableItem,
    HistoryRecord,
    MockRoute,
    MockLog,
    CaptureRecord,
)
from app.schemas import ApiResponse, AppSettingsUpdate

router = APIRouter(prefix="/api", tags=["设置"])


def get_or_create_settings(session: Session) -> AppSettings:
    """获取或创建默认设置"""
    settings = session.exec(select(AppSettings)).first()
    if not settings:
        settings = AppSettings()
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings


@router.get("/settings", response_model=ApiResponse)
async def get_settings(session: Session = Depends(get_session)):
    """获取应用设置"""
    settings = get_or_create_settings(session)
    result = settings.model_dump()
    result["db_path"] = str(DATA_DIR / "lingxi.db")
    return ApiResponse(data=result)


@router.put("/settings", response_model=ApiResponse)
async def update_settings(
    data: AppSettingsUpdate,
    session: Session = Depends(get_session),
):
    """更新应用设置"""
    settings = get_or_create_settings(session)
    if data.theme is not None:
        settings.theme = data.theme
    if data.default_timeout is not None:
        settings.default_timeout = data.default_timeout
    if data.history_limit is not None:
        settings.history_limit = data.history_limit
    if data.auto_format_json is not None:
        settings.auto_format_json = data.auto_format_json
    if data.auto_save_history is not None:
        settings.auto_save_history = data.auto_save_history
    if data.mock_port is not None:
        settings.mock_port = data.mock_port
    if data.proxy_type is not None:
        settings.proxy_type = data.proxy_type
    if data.proxy_url is not None:
        settings.proxy_url = data.proxy_url
    if data.cookie_jar_enabled is not None:
        settings.cookie_jar_enabled = data.cookie_jar_enabled
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return ApiResponse(data=settings.model_dump())


@router.post("/settings/clear-data", response_model=ApiResponse)
async def clear_all_data(session: Session = Depends(get_session)):
    """清空本地数据（集合、环境、历史、Mock、捕获记录），保留设置"""
    try:
        # 清空各表
        for model in [
            HistoryRecord,
            CaptureRecord,
            MockLog,
            MockRoute,
            VariableItem,
            Environment,
            RequestItem,
            Folder,
            Collection,
        ]:
            rows = session.exec(select(model)).all()
            for row in rows:
                session.delete(row)
        session.commit()
        return ApiResponse(message="本地数据已清空，设置已保留")
    except Exception as e:
        session.rollback()
        return ApiResponse(success=False, message=f"清空失败: {str(e)}")
