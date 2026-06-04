"""请求发送路由"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import HistoryRecord, AppSettings
from app.schemas import SendRequestInput, ApiResponse
from app.features.request_workbench.service import execute_request
from app.features.capture.router import add_capture_record

router = APIRouter(prefix="/api", tags=["请求发送"])


@router.post("/send-request", response_model=ApiResponse)
async def send_api_request(
    request: SendRequestInput,
    session: Session = Depends(get_session),
):
    """发送 API 请求

    前端将请求配置发送到此接口，后端使用 httpx 发送真实请求。
    """
    # 获取设置中的默认超时
    settings = session.exec(select(AppSettings)).first()

    # 如果用户未指定超时，使用设置中的默认值
    if settings and request.timeout == 30:
        request.timeout = settings.default_timeout

    result = await execute_request(request, session)

    # 自动保存历史记录（根据设置）
    auto_save = settings.auto_save_history if settings else True
    history = None

    if auto_save:
        try:
            request_snapshot = request.model_dump()
            history = HistoryRecord(
                method=request.method,
                url=request.url,
                status_code=result.status_code if result.status_code > 0 else None,
                duration=result.duration,
                size=result.body_size,
                request_snapshot=request_snapshot,
                response_summary=result.body[:500] if result.body else None,
                error_message=result.error,
            )
            session.add(history)
            session.commit()
        except Exception:
            pass  # 历史保存失败不影响主流程

    # 添加捕获记录
    add_capture_record({
        "id": history.id if history else 0,
        "method": request.method,
        "url": request.url,
        "status_code": result.status_code,
        "duration": result.duration,
        "request_headers": {},
        "response_headers": result.headers if result.status_code > 0 else {},
        "created_at": history.created_at.isoformat() if history else "",
    })

    return ApiResponse(
        success=result.error is None,
        message=result.error or "请求成功",
        data=result.model_dump(),
    )


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "message": "灵犀 API 后端运行正常",
        "version": "0.4.0",
    }
