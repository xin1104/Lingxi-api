"""PyInstaller 打包后的入口点

判断 sys.frozen 以确定是否在 PyInstaller 环境，
自动处理资源路径、数据目录、端口检查和浏览器启动。
"""

import os
import sys
import time
import socket
import webbrowser
from pathlib import Path

# ── 路径判断 ──────────────────────────────────────────────

if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    # PyInstaller 打包环境
    BASE_DIR = Path(sys._MEIPASS)
    FROZEN = True
else:
    # 开发环境
    FROZEN = False

if FROZEN:
    # 数据目录：exe 同级的 data/ 目录
    MEIPASS = Path(sys._MEIPASS)

    # ── 模块搜索路径 ──
    # 让 Python 能直接 import app.xxx
    app_pkg = MEIPASS / "app"
    if app_pkg.exists() and str(app_pkg.parent) not in sys.path:
        sys.path.insert(0, str(MEIPASS))

    # 数据目录：exe 所在目录下的 data/
    exe_dir = Path(sys.executable).resolve().parent
    DATA_DIR = exe_dir / "data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
else:
    # 开发环境下沿用 config.py 中的逻辑
    from app.config import DATA_DIR  # noqa: F401

# 设置环境变量让其他模块（如 app/config.py）能读取
os.environ.setdefault("LINGXI_DATA_DIR", str(DATA_DIR))

print(f"● 灵犀 API Client v1.0.0")
print(f"● 模式: {'🔒 打包' if FROZEN else '🔧 开发'}")
print(f"● 数据目录: {DATA_DIR}")

# ── 端口检查 ──────────────────────────────────────────────

from app.config import BACKEND_HOST, BACKEND_PORT  # noqa: E402

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    result = sock.connect_ex((BACKEND_HOST, BACKEND_PORT))
    if result == 0:
        print(f"⚠️  端口 {BACKEND_PORT} 已被占用，请检查是否有其他实例正在运行")
        sys.exit(1)

# ── 启动后端 ──────────────────────────────────────────────

import uvicorn  # noqa: E402

url = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
print(f"● 服务地址: {url}")
print(f"● 启动中...")

# 1.5 秒后自动打开浏览器
def _open_browser():
    time.sleep(1.5)
    webbrowser.open(url)

# 用线程延时打开浏览器（不阻塞 uvicorn）
import threading  # noqa: E402
t = threading.Thread(target=_open_browser, daemon=True)
t.start()

uvicorn.run(
    "app.main:app",
    host=BACKEND_HOST,
    port=BACKEND_PORT,
    reload=not FROZEN,
    log_level="warning" if FROZEN else "info",
)
