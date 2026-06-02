"""灵犀 API 后端主入口"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import BACKEND_HOST, BACKEND_PORT
from app.database import init_db
from app.features.request_workbench.router import router as request_router
from app.features.collections.router import router as collections_router
from app.features.environments.router import router as environments_router
from app.features.history.router import router as history_router
from app.features.mock.router import router as mock_router
from app.features.import_export.router import router as import_export_router
from app.features.codegen.router import router as codegen_router
from app.features.capture.router import router as capture_router
from app.features.settings.router import router as settings_router
from app.features.capture.router import add_capture_record


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    init_db()
    from app.seed import seed_sample_data
    seed_sample_data()
    print("灵犀 API 后端已启动")
    print(f"服务地址: http://{BACKEND_HOST}:{BACKEND_PORT}")
    yield


app = FastAPI(
    title="灵犀 API Client",
    description="本地优先的中文 API 调试客户端",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(request_router)
app.include_router(collections_router)
app.include_router(environments_router)
app.include_router(history_router)
app.include_router(mock_router)
app.include_router(import_export_router)
app.include_router(codegen_router)
app.include_router(capture_router)
app.include_router(settings_router)


@app.middleware("http")
async def capture_requests_middleware(request: Request, call_next):
    """捕获经过本服务的请求"""
    start_time = time.time()

    # 记录请求信息
    {
        "method": request.method,
        "url": str(request.url),
        "headers": dict(request.headers),
    }

    response = await call_next(request)

    # 计算耗时
    duration = int((time.time() - start_time) * 1000)

    # 记录响应信息
    capture_record = {
        "id": int(time.time() * 1000),
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "duration": duration,
        "request_headers": dict(request.headers),
        "response_headers": dict(response.headers),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    add_capture_record(capture_record)

    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"服务器错误: {str(exc)}",
            "data": None,
        },
    )


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "灵犀 API Client",
        "version": "0.1.0",
        "description": "本地优先的中文 API 调试客户端",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=True,
    )
