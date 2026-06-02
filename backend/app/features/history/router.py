"""请求历史路由"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import HistoryRecord
from app.schemas import ApiResponse

router = APIRouter(prefix="/api", tags=["请求历史"])


@router.get("/history", response_model=ApiResponse)
async def get_history(
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    method: str = Query(default=None),
    status_code: int = Query(default=None),
    keyword: str = Query(default=None),
    session: Session = Depends(get_session),
):
    """获取历史记录"""
    query = select(HistoryRecord).order_by(HistoryRecord.id.desc())

    if method:
        query = query.where(HistoryRecord.method == method.upper())
    if status_code:
        query = query.where(HistoryRecord.status_code == status_code)
    if keyword:
        query = query.where(HistoryRecord.url.contains(keyword))

    records = session.exec(query.offset(offset).limit(limit)).all()
    total = len(session.exec(query).all())

    return ApiResponse(
        data={
            "records": [r.model_dump() for r in records],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


@router.get("/history/{record_id}", response_model=ApiResponse)
async def get_history_record(
    record_id: int,
    session: Session = Depends(get_session),
):
    """获取单条历史记录"""
    record = session.get(HistoryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return ApiResponse(data=record.model_dump())


@router.delete("/history/{record_id}", response_model=ApiResponse)
async def delete_history_record(
    record_id: int,
    session: Session = Depends(get_session),
):
    """删除单条历史记录"""
    record = session.get(HistoryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    session.delete(record)
    session.commit()
    return ApiResponse(message="删除成功")


@router.delete("/history", response_model=ApiResponse)
async def clear_history(session: Session = Depends(get_session)):
    """清空历史记录"""
    records = session.exec(select(HistoryRecord)).all()
    for record in records:
        session.delete(record)
    session.commit()
    return ApiResponse(message="历史记录已清空")
