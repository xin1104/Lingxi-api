"""Mock 服务路由"""

import asyncio
import json
import uuid
import time
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session, engine
from app.models import MockRoute
from app.schemas import ApiResponse, MockRouteCreate, MockRouteUpdate

router = APIRouter(prefix="/api", tags=["Mock 服务"])

# Mock 服务器实例
_mock_app = None
_mock_server = None
_mock_logs: list[dict] = []

# 模板变量替换器
TEMPLATE_VARS = {
    "{{$timestamp}}": lambda: str(int(time.time())),
    "{{$uuid}}": lambda: str(uuid.uuid4()),
    "{{$datetime}}": lambda: datetime.now().isoformat(),
    "{{$randomInt}}": lambda: str(int(time.time() * 1000) % 1000000),
}


def _replace_template_vars(text: str) -> str:
    """替换响应 body 中的模板变量"""
    for pattern, resolver in TEMPLATE_VARS.items():
        text = text.replace(pattern, resolver())
    return text


class MockStartInput(BaseModel):
    """Mock 启动输入"""
    port: int = 4567


# 在模块级别创建 Mock 应用
def create_mock_app():
    """创建 Mock FastAPI 应用"""
    from fastapi import FastAPI as MockFastAPI, Request as MockRequest
    from fastapi.responses import JSONResponse as MockJSONResponse

    app = MockFastAPI(title="Mock Server")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    async def mock_handler(path: str, request: MockRequest):
        from sqlmodel import Session as DBSession
        with DBSession(engine) as db:
            routes = db.exec(
                select(MockRoute).where(MockRoute.enabled)
            ).all()

            request_path = f"/{path}" if path else "/"
            request_method = request.method

            for route in routes:
                if route.path == request_path and route.method.upper() == request_method.upper():
                    log_entry = {
                        "route_id": route.id,
                        "method": request_method,
                        "path": request_path,
                        "matched": True,
                        "timestamp": datetime.now().isoformat(),
                    }
                    _mock_logs.append(log_entry)

                    # 延迟模拟
                    if route.delay > 0:
                        await asyncio.sleep(route.delay / 1000)

                    # 模板变量替换
                    resp_body_str = _replace_template_vars(route.body)
                    try:
                        resp_body = json.loads(resp_body_str)
                    except (json.JSONDecodeError, TypeError):
                        resp_body = resp_body_str

                    return MockJSONResponse(
                        content=resp_body,
                        status_code=route.status_code,
                        headers=route.headers,
                    )

            _mock_logs.append({
                "route_id": None,
                "method": request_method,
                "path": request_path,
                "matched": False,
                "timestamp": datetime.now().isoformat(),
            })
            return MockJSONResponse(
                content={"error": "未找到匹配的 Mock 路由"},
                status_code=404,
            )
    return app


@router.get("/mock/routes", response_model=ApiResponse)
async def get_mock_routes(session: Session = Depends(get_session)):
    """获取所有 Mock 路由"""
    routes = session.exec(select(MockRoute)).all()
    return ApiResponse(data=[r.model_dump() for r in routes])


@router.post("/mock/routes", response_model=ApiResponse)
async def create_mock_route(
    data: MockRouteCreate,
    session: Session = Depends(get_session),
):
    """创建 Mock 路由"""
    route = MockRoute(
        method=data.method.upper(),
        path=data.path,
        status_code=data.status_code,
        headers=data.headers,
        body=data.body,
        enabled=data.enabled,
        delay=data.delay,
    )
    session.add(route)
    session.commit()
    session.refresh(route)
    return ApiResponse(data=route.model_dump())


@router.put("/mock/routes/{route_id}", response_model=ApiResponse)
async def update_mock_route(
    route_id: int,
    data: MockRouteUpdate,
    session: Session = Depends(get_session),
):
    """更新 Mock 路由"""
    route = session.get(MockRoute, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="路由不存在")
    if data.method is not None:
        route.method = data.method.upper()
    if data.path is not None:
        route.path = data.path
    if data.status_code is not None:
        route.status_code = data.status_code
    if data.headers is not None:
        route.headers = data.headers
    if data.body is not None:
        route.body = data.body
    if data.enabled is not None:
        route.enabled = data.enabled
    if data.delay is not None:
        route.delay = data.delay
    session.add(route)
    session.commit()
    session.refresh(route)
    return ApiResponse(data=route.model_dump())


@router.delete("/mock/routes/{route_id}", response_model=ApiResponse)
async def delete_mock_route(
    route_id: int,
    session: Session = Depends(get_session),
):
    """删除 Mock 路由"""
    route = session.get(MockRoute, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="路由不存在")
    session.delete(route)
    session.commit()
    return ApiResponse(message="删除成功")


@router.post("/mock/start", response_model=ApiResponse)
async def start_mock_server(data: MockStartInput):
    """启动 Mock 服务器"""
    global _mock_app, _mock_server, _mock_logs
    port = data.port
    _mock_logs = []

    _mock_app = create_mock_app()

    import uvicorn
    config = uvicorn.Config(_mock_app, host="127.0.0.1", port=port, log_level="warning")
    _mock_server = uvicorn.Server(config)
    asyncio.create_task(_mock_server.serve())

    return ApiResponse(
        data={
            "status": "running",
            "address": f"http://127.0.0.1:{port}",
            "port": port,
        }
    )


@router.post("/mock/stop", response_model=ApiResponse)
async def stop_mock_server():
    """停止 Mock 服务器"""
    global _mock_server
    if _mock_server:
        _mock_server.should_exit = True
        _mock_server = None
        return ApiResponse(message="Mock 服务器已停止")
    return ApiResponse(message="Mock 服务器未运行")


@router.get("/mock/status", response_model=ApiResponse)
async def get_mock_status():
    """获取 Mock 服务器状态"""
    return ApiResponse(
        data={
            "running": _mock_server is not None,
            "logs_count": len(_mock_logs),
        }
    )


@router.get("/mock/logs", response_model=ApiResponse)
async def get_mock_logs(limit: int = 100):
    """获取 Mock 请求日志"""
    return ApiResponse(data=_mock_logs[-limit:])
