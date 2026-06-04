"""应用配置模块"""

import os
from pathlib import Path

# 后端服务配置
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 17321

# 数据库配置
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite:///{DATA_DIR}/lingxi.db"

# 打包环境下通过 LINGXI_DATA_DIR 环境变量覆盖数据目录
_lingxi_data = os.environ.get("LINGXI_DATA_DIR")
if _lingxi_data:
    DATA_DIR = Path(_lingxi_data)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{DATA_DIR}/lingxi.db"

# 默认设置
DEFAULT_REQUEST_TIMEOUT = 30  # 秒
DEFAULT_HISTORY_LIMIT = 100
DEFAULT_MOCK_PORT = 4567

# 前端地址（开发模式）
FRONTEND_URL = "http://localhost:5173"
