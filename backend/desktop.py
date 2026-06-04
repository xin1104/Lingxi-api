"""灵犀 API Client — 桌面模式入口

使用 PyWebView 将前端嵌入原生桌面窗口，无需打开浏览器。
后端 FastAPI 在后台线程启动，窗口关闭时自动退出。
"""

import os
import sys
import time
import socket
import threading
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("lingxi")

# ── 路径初始化（与 run_frozen.py 一致） ──────────────────────

if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    BASE_DIR = Path(sys._MEIPASS)
    app_pkg = BASE_DIR / "app"
    if app_pkg.exists() and str(app_pkg.parent) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))
    exe_dir = Path(sys.executable).resolve().parent
    DATA_DIR = exe_dir / "data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    FROZEN = True
else:
    FROZEN = False
    from app.config import DATA_DIR  # noqa: F401

os.environ.setdefault("LINGXI_DATA_DIR", str(DATA_DIR))

from app.config import BACKEND_HOST, BACKEND_PORT  # noqa: E402


def check_port():
    """检查端口是否可用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        return sock.connect_ex((BACKEND_HOST, BACKEND_PORT)) != 0


def wait_for_server(timeout=15):
    """等待后端服务就绪（轮询 /api/health）"""
    import httpx
    url = f"http://{BACKEND_HOST}:{BACKEND_PORT}/api/health"
    for _ in range(timeout * 2):
        try:
            r = httpx.get(url, timeout=1)
            if r.status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


def start_uvicorn():
    """在后台线程中启动 Uvicorn 服务器"""
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=not FROZEN,
        log_level="warning" if FROZEN else "info",
    )


def run_desktop():
    """启动桌面应用"""
    title = "灵犀 API Client"

    # ── 端口检查 ──
    if not check_port():
        log.warning(f"⚠️  端口 {BACKEND_PORT} 已被占用，请检查是否有其他实例正在运行")
        # 非打包模式直接退出
        if not FROZEN:
            sys.exit(1)
        # 打包模式弹出错误提示（win32）
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                0, f"端口 {BACKEND_PORT} 已被占用\n请关闭其他灵犀实例后重试",
                title, 0x10 | 0x1000
            )
        except Exception:
            pass
        sys.exit(1)

    # ── 后端线程 ──
    log.info("● 灵犀 API Client v1.1.0")
    log.info(f"● 模式: {'🔒 桌面' if FROZEN else '🔧 开发'}")
    log.info(f"● 数据目录: {DATA_DIR}")

    server_thread = threading.Thread(target=start_uvicorn, daemon=True)
    server_thread.start()

    # ── 等待后端就绪 ──
    if not wait_for_server():
        log.error("❌ 后端启动超时")
        sys.exit(1)

    url = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
    log.info(f"● 服务地址: {url}")
    log.info("● 启动桌面窗口...")

    # ── 加载图标路径 ──
    icon_path = None
    if FROZEN:
        icon_candidate = BASE_DIR / "lingxi.ico"
    else:
        icon_candidate = Path(__file__).resolve().parent.parent.parent / "build" / "lingxi.ico"
    if icon_candidate and icon_candidate.exists():
        icon_path = str(icon_candidate)

    # ── PyWebView 窗口 ──
    try:
        import webview
        webview.create_window(
            title,
            url,
            width=1280,
            height=820,
            min_size=(900, 600),
            resizable=True,
            fullscreen=False,
            icon=icon_path,
        )
        webview.start(debug=not FROZEN)
    except ImportError:
        # pywebview 未安装 → 回退到浏览器模式
        log.info("⚠️  PyWebView 未安装，回退到浏览器模式")
        import webbrowser
        webbrowser.open(url)
        log.info(f"   请在浏览器中访问: {url}")
        server_thread.join()
    except Exception as e:
        log.error(f"❌ 桌面窗口启动失败: {e}")
        log.info(f"   请在浏览器中访问: {url}")
        import webbrowser
        webbrowser.open(url)
        server_thread.join()


if __name__ == "__main__":
    run_desktop()
