"""灵犀 API Client — PyInstaller 打包入口

将路径和环境初始化后，委托给 desktop.py 启动桌面模式。
"""
import os
import sys
from pathlib import Path

# ── 路径初始化 ──────────────────────────────────────────────

if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    BASE_DIR = Path(sys._MEIPASS)
    app_pkg = BASE_DIR / "app"
    if app_pkg.exists() and str(app_pkg.parent) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))
    exe_dir = Path(sys.executable).resolve().parent
    DATA_DIR = exe_dir / "data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
else:
    DATA_DIR = None  # desktop.py 会处理

if DATA_DIR is not None:
    os.environ.setdefault("LINGXI_DATA_DIR", str(DATA_DIR))

# ── 启动桌面模式 ────────────────────────────────────────────

from desktop import run_desktop  # noqa: E402

run_desktop()
