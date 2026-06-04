"""灵犀 API 后端主入口"""

import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

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
from app.features.cookie_jar.router import router as cookie_jar_router
from app.features.capture.router import add_capture_record

# 前端 dist 路径（相对于 backend 目录）
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"

NO_FRONTEND_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>灵犀 API Client</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
               background: #0F172A; color: #E5E7EB;
               display: flex; justify-content: center; align-items: center;
               height: 100vh; margin: 0; }
        .box { text-align: center; max-width: 600px; padding: 2rem; }
        h1 { color: #38BDF8; }
        code { background: #1E293B; padding: 2px 8px; border-radius: 4px; }
        a { color: #38BDF8; }
    </style>
</head>
<body>
    <div class="box">
        <h1>灵犀 API Client</h1>
        <p>前端静态文件不存在，请先在 <code>frontend</code> 目录执行 <code>npm run build</code>，<br>
        或开发模式下使用 <code>npm run dev</code>。</p>
        <p>API 文档: <a href="/docs">/docs</a></p>
    </div>
</body>
</html>"""


@asynccontextmanager
async def lifespan(app_ref: FastAPI):
    """应用生命周期管理"""
    init_db()
    from app.seed import seed_sample_data
    seed_sample_data()
    print("灵犀 API 后端已启动")
    print(f"服务地址: http://{BACKEND_HOST}:{BACKEND_PORT}")
    if FRONTEND_DIST.exists():
        print(f"前端托管: {FRONTEND_DIST}")
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
app.include_router(cookie_jar_router)


@app.middleware("http")
async def capture_requests_middleware(request: Request, call_next):
    """捕获经过本服务的 API 请求"""
    start_time = time.time()
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        duration = int((time.time() - start_time) * 1000)
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
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"服务器错误: {str(exc)}",
                "data": None,
            },
        )
    return HTMLResponse(NO_FRONTEND_HTML, status_code=500)


# ===== 单服务模式：挂载前端静态文件 =====

if FRONTEND_DIST.exists() and INDEX_HTML.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """SPA 路由回退：所有非 /api/ 请求返回 index.html"""
        if full_path.startswith("api/"):
            return JSONResponse(
                {"success": False, "message": "接口不存在", "data": None},
                status_code=404,
            )
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(INDEX_HTML)

else:

    @app.get("/")
    async def root():
        """无前端静态文件时的根路径"""
        return HTMLResponse(NO_FRONTEND_HTML)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=True,
    )
