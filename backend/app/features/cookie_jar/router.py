"""Cookie Jar 路由"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import CookieJar, AppSettings
from app.schemas import ApiResponse
from app.features.cookie_jar.service import (
    clear_all_cookies,
    delete_expired_cookies,
)

router = APIRouter(prefix="/api", tags=["Cookie Jar"])


@router.get("/cookie-jar", response_model=ApiResponse)
async def list_cookies(session: Session = Depends(get_session)):
    """获取所有保存的 Cookie"""
    cookies = session.exec(select(CookieJar).order_by(CookieJar.domain, CookieJar.name)).all()
    return ApiResponse(data=[c.model_dump() for c in cookies])


@router.get("/cookie-jar/status", response_model=ApiResponse)
async def cookie_jar_status(session: Session = Depends(get_session)):
    """获取 Cookie Jar 状态（启用/禁用、数量）"""
    settings = session.exec(select(AppSettings)).first()
    enabled = settings.cookie_jar_enabled if settings else True
    cookies = session.exec(select(CookieJar)).all()
    return ApiResponse(data={
        "enabled": enabled,
        "count": len(cookies),
    })


@router.delete("/cookie-jar", response_model=ApiResponse)
async def clear_cookies(session: Session = Depends(get_session)):
    """清空所有 Cookie"""
    try:
        count = clear_all_cookies(session)
        return ApiResponse(message=f"已清空 {count} 条 Cookie")
    except Exception as e:
        return ApiResponse(success=False, message=f"清空失败: {str(e)}")


@router.delete("/cookie-jar/{cookie_id}", response_model=ApiResponse)
async def delete_cookie(cookie_id: int, session: Session = Depends(get_session)):
    """删除单条 Cookie"""
    cookie = session.get(CookieJar, cookie_id)
    if not cookie:
        return ApiResponse(success=False, message="Cookie 不存在")
    session.delete(cookie)
    session.commit()
    return ApiResponse(message=f"Cookie '{cookie.name}' 已删除")


@router.post("/cookie-jar/clean-expired", response_model=ApiResponse)
async def clean_expired_cookies(session: Session = Depends(get_session)):
    """清理已过期的 Cookie"""
    try:
        count = delete_expired_cookies(session)
        return ApiResponse(message=f"已清理 {count} 条过期 Cookie")
    except Exception as e:
        return ApiResponse(success=False, message=f"清理失败: {str(e)}")
