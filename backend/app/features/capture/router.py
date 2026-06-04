"""请求捕获路由 — 数据持久化到 SQLite CaptureRecord 表"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, delete
from app.database import get_session
from app.models import CaptureRecord
from app.schemas import ApiResponse

router = APIRouter(prefix="/api", tags=["请求捕获"])


def add_capture_record(record: dict, session: Session = None):
    """添加捕获记录到数据库"""
    if session is None:
        return

    try:
        cr = CaptureRecord(
            method=record.get("method", ""),
            url=record.get("url", ""),
            status_code=record.get("status_code"),
            duration=record.get("duration"),
            request_headers=record.get("request_headers", {}),
            request_body=record.get("request_body"),
            response_headers=record.get("response_headers", {}),
            response_body=record.get("response_body"),
        )
        session.add(cr)
        session.commit()
    except Exception:
        pass  # 捕获保存失败不影响主流程


def add_capture_record_async(record: dict):
    """异步添加捕获记录（用于 middleware 等无 session 场景）"""
    from app.database import engine
    from sqlmodel import Session as DBSession
    try:
        with DBSession(engine) as session:
            cr = CaptureRecord(
                method=record.get("method", ""),
                url=record.get("url", ""),
                status_code=record.get("status_code"),
                duration=record.get("duration"),
                request_headers=record.get("request_headers", {}),
                request_body=record.get("request_body"),
                response_headers=record.get("response_headers", {}),
                response_body=record.get("response_body"),
            )
            session.add(cr)
            session.commit()
    except Exception:
        pass


@router.get("/capture/records", response_model=ApiResponse)
async def get_capture_records(limit: int = 100, session: Session = Depends(get_session)):
    """获取捕获记录"""
    records = session.exec(
        select(CaptureRecord).order_by(CaptureRecord.created_at.desc()).limit(limit)
    ).all()
    return ApiResponse(data=[r.model_dump() for r in records])


@router.delete("/capture/records", response_model=ApiResponse)
async def clear_capture_records(session: Session = Depends(get_session)):
    """清空捕获记录"""
    session.exec(delete(CaptureRecord))
    session.commit()
    return ApiResponse(message="捕获记录已清空")


@router.get("/capture/records/{record_id}", response_model=ApiResponse)
async def get_capture_record(record_id: int, session: Session = Depends(get_session)):
    """获取单条捕获记录"""
    record = session.get(CaptureRecord, record_id)
    if not record:
        return ApiResponse(success=False, message="记录不存在")
    return ApiResponse(data=record.model_dump())
