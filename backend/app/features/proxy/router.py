"""HTTP 代理管理路由"""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import ProxyLog, AppSettings
from app.schemas import ApiResponse
from app.features.proxy.service import HTTPProxyServer, get_proxy, set_proxy

router = APIRouter(prefix="/api", tags=["HTTP 代理"])


@router.get("/proxy/status", response_model=ApiResponse)
async def proxy_status(session: Session = Depends(get_session)):
    """获取代理状态"""
    proxy = get_proxy()
    settings = session.exec(select(AppSettings)).first()
    proxy_port = settings.proxy_port if settings else 8899
    log_count = len(session.exec(select(ProxyLog)).all())

    return ApiResponse(data={
        "running": proxy is not None and proxy.running,
        "host": "127.0.0.1",
        "port": proxy_port,
        "address": f"http://127.0.0.1:{proxy_port}",
        "log_count": log_count,
        "note": "HTTP 代理仅供本机调试使用。HTTPS CONNECT 仅记录域名和端口，不解密内容。",
    })


@router.post("/proxy/start", response_model=ApiResponse)
async def start_proxy(session: Session = Depends(get_session)):
    """启动代理服务器"""
    proxy = get_proxy()
    if proxy and proxy.running:
        return ApiResponse(message=f"代理已在运行: {proxy.address}")

    settings = session.exec(select(AppSettings)).first()
    port = settings.proxy_port if settings else 8899

    new_proxy = HTTPProxyServer(host="127.0.0.1", port=port)
    try:
        await new_proxy.start()
        set_proxy(new_proxy)
        return ApiResponse(
            message=f"代理已启动: {new_proxy.address}",
            data={
                "running": True,
                "address": new_proxy.address,
                "note": "将 HTTP 客户端代理设置为该地址即可抓包。不支持 HTTPS 内容解密。",
            },
        )
    except RuntimeError as e:
        return ApiResponse(success=False, message=str(e))


@router.post("/proxy/stop", response_model=ApiResponse)
async def stop_proxy():
    """停止代理服务器"""
    proxy = get_proxy()
    if not proxy or not proxy.running:
        return ApiResponse(message="代理未在运行")

    await proxy.stop()
    set_proxy(None)
    return ApiResponse(message="代理已停止")


@router.get("/proxy/logs", response_model=ApiResponse)
async def get_proxy_logs(
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    source: str = Query(default=None),
    method: str = Query(default=None),
    host: str = Query(default=None),
    status_code: int = Query(default=None),
    keyword: str = Query(default=None),
    is_https_connect: bool = Query(default=None),
    session: Session = Depends(get_session),
):
    """获取代理日志（支持筛选）"""
    query = select(ProxyLog)

    if source:
        query = query.where(ProxyLog.source == source)
    if method:
        query = query.where(ProxyLog.method == method.upper())
    if host:
        query = query.where(ProxyLog.host.contains(host))
    if status_code:
        query = query.where(ProxyLog.status_code == status_code)
    if keyword:
        query = query.where(
            (ProxyLog.url.contains(keyword)) |
            (ProxyLog.host.contains(keyword))
        )
    if is_https_connect is not None:
        query = query.where(ProxyLog.is_https_connect == is_https_connect)

    # 计数
    total = len(session.exec(query).all())

    # 排序 + 分页
    query = query.order_by(ProxyLog.id.desc()).offset(offset).limit(limit)
    logs = session.exec(query).all()

    return ApiResponse(data={
        "logs": [log.model_dump() for log in logs],
        "total": total,
        "limit": limit,
        "offset": offset,
    })


@router.get("/proxy/logs/{log_id}", response_model=ApiResponse)
async def get_proxy_log(log_id: int, session: Session = Depends(get_session)):
    """获取单条代理日志"""
    log = session.get(ProxyLog, log_id)
    if not log:
        return ApiResponse(success=False, message="记录不存在")
    return ApiResponse(data=log.model_dump())


@router.delete("/proxy/logs", response_model=ApiResponse)
async def clear_proxy_logs(session: Session = Depends(get_session)):
    """清空代理日志"""
    logs = session.exec(select(ProxyLog)).all()
    count = len(logs)
    for log in logs:
        session.delete(log)
    session.commit()
    return ApiResponse(message=f"已清空 {count} 条代理日志")
