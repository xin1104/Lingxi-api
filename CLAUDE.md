# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

灵犀 API Client — 本地优先的中文 API 调试客户端（类似 Postman）。所有数据存储在本地 SQLite，完全离线可用。

## 技术栈

- **后端**: Python 3.11+ / FastAPI / httpx / SQLModel (SQLAlchemy) / Pydantic v2
- **前端**: React 18 / TypeScript strict / Vite / Tailwind CSS / Zustand
- **Linter**: Ruff (Python), ESLint + `tsc --noEmit` (TypeScript)
- **测试**: pytest (后端), vitest + jsdom (前端)

## 启动命令

```bash
# 后端
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 17321

# 前端（开发模式，Vite 代理 /api → 后端）
cd frontend
npm install
npm run dev

# 一键启动
python scripts/dev.py

# 单服务模式（构建前端后由 FastAPI 统一托管）
cd frontend && npm run build
cd ../backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 17321
```

## 代码质量

```bash
# 后端 lint（全部）
python -m ruff check backend/

# 后端 lint（单文件）
python -m ruff check backend/app/features/request_workbench/router.py

# 后端测试
python -m pytest backend/tests/ -v

# 后端单测
python -m pytest backend/tests/test_health.py::test_health_check -v

# 前端 typecheck
cd frontend && npm run typecheck

# 前端 lint（ESLint）
cd frontend && npm run lint

# 前端测试（vitest + jsdom）
cd frontend && npm run test
cd frontend && npm run test:watch

# 前端构建验证（含 tsc 编译）
cd frontend && npm run build
```

## 架构

### 前后端分离 + Vite 代理

```
浏览器 → Vite Dev Server (5173)
  ├── /api/*     → 代理到 http://127.0.0.1:17321（后端）
  └── /*         → React SPA
```

前端开发时，Vite 将 `/api/*` 请求透明代理到 Python 后端。构建后 (`npm run build`)，FastAPI 直接托管 `frontend/dist/` 静态文件，只需启动后端一个进程。

### 核心请求流

```
前端 sendCurrentRequest() → POST /api/send-request
  → 后端 router → service.execute_request() → http_client.send_request()
    → httpx 发起真实 HTTP 请求（绕过浏览器 CORS）
  → 统一响应格式: { success: bool, message: str, data: T }
  → 自动保存历史记录 + 捕获记录
```

### 后端 feature 模块模式

每个功能模块在 `backend/app/features/<name>/` 下，至少包含 `router.py`，复杂模块另有 `service.py`：

| 模块 | 职责 | 有无 service |
|------|------|-------------|
| `request_workbench/` | httpx 发送请求、变量解析 | service.py, http_client.py, variable_resolver.py |
| `collections/` | 集合、文件夹、请求项 CRUD | 无（纯 CRUD router） |
| `environments/` | 环境变量、多环境切换 | 无 |
| `history/` | 请求历史记录搜索/过滤 | 无 |
| `mock/` | Mock 服务器启停、路由管理 | 无 |
| `import_export/` | cURL/Postman/OpenAPI 导入解析 | 无 |
| `codegen/` | 5 种语言代码生成 | 无 |
| `capture/` | 请求捕获记录 | 无 |
| `settings/` | 应用设置、数据清除 | 无 |

### 前端 feature 镜像结构

前端 `src/features/` 与后端 features 一一对应：

- `request-workbench/` — 请求编辑表单、响应查看器（最大的功能组，拆分为多个编辑器组件）
- `collections/`, `environments/`, `history/`, `mock/`, `import-export/`, `capture/`, `settings/`

每个 feature 导出单个 `index.tsx` 作为页面入口。

### 状态管理

单一 Zustand store (`frontend/src/shared/store/index.ts`) 管理全部应用状态。store 同时封装 API 调用（`load*` / `save*` 方法），组件不直接调用 API 层。

### 前端工具约定

- **路径别名**: `@/` 映射到 `frontend/src/`（在 vite.config.ts 和 tsconfig.json 中配置）
- **className 合并**: 使用 `cn()` 工具函数（基于 `tailwind-merge` + `clsx`）合并 Tailwind 类名，参考 `frontend/src/shared/utils/index.ts`
- **Lucide Icons**: 图标统一使用 `lucide-react`，不引入其他图标库

### API 响应格式

所有后端 API 返回统一结构：
```json
{ "success": true, "message": "", "data": { ... } }
```

前端 `fetchApi<T>` 泛型函数封装 fetch，自动拼接 `/api` 前缀。

### 数据库

- SQLite 文件：`backend/data/lingxi.db`，首次启动自动创建
- `SQLModel.metadata.create_all()` 建表（无 Alembic 迁移）
- `seed.py` 在首次运行时插入示例数据（检测已有数据则跳过）
- 模型定义在 `backend/app/models.py`（SQLModel = Pydantic + SQLAlchemy）

### 变量系统

- `{{变量名}}` 语法，`variable_resolver.py` 在请求发送前替换 URL/Header/Body 中的变量
- 内置动态变量：`{{$timestamp}}` `{{$uuid}}` `{{$randomInt}}` `{{$datetime}}`
- 多环境支持：每个环境有独立变量组，环境切换时 `switchEnvironment()` → `loadCurrentVariables()`

### 后端测试模式

后端测试直接导入 `app.main:app` 使用 FastAPI `TestClient`，无需数据库 fixture：
```python
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
```

注意：运行后端命令时，需在 `backend/` 目录下执行（或设置 `PYTHONPATH=backend/`），确保 `from app.xxx` 导入正常。

### 关键中间件

- **CORS**: 全开（`allow_origins=["*"]`），因为是本地调试工具，不对外暴露
- **请求捕获**: `main.py` 中的 `capture_requests_middleware` 自动记录所有 `/api/*` 请求到 `CaptureRecord` 表
- **全局异常处理**: 任何 `/api/*` 异常返回统一 `ApiResponse` 格式，非 API 路径返回 HTML 提示页

### AppSettings 单行模式

`AppSettings` 表只维护一行数据（id=1），通过 settings router 的 `GET/PUT /api/settings` 读写。不要向该表插入多行。

## 项目结构

```
backend/
  app/
    main.py            — FastAPI 入口（lifespan、CORS、路由注册、静态文件托管）
    config.py          — 端口、数据库路径、默认超时
    database.py        — SQLModel 引擎 + init_db() + get_session()
    models.py          — 10 个数据模型（Collection, Folder, RequestItem, Environment, VariableItem, HistoryRecord, MockRoute, MockLog, CaptureRecord, AppSettings）
    schemas.py         — Pydantic 请求/响应模式 + 统一 ApiResponse
    seed.py            — 首次启动插入 Demo 数据
    features/          — 功能模块（router.py + service.py）
  tests/               — pytest 测试（6 个测试文件）
frontend/
  src/
    app/App.tsx        — 根组件（布局 + 侧边栏 + 内容区）
    main.tsx           — ReactDOM 入口
    features/          — 功能页面（与后端 feature 一对一）
    shared/
      api/index.ts     — fetch 封装 + 所有 API 调用函数
      store/index.ts   — 单一 Zustand store
      types/index.ts   — 前端 TypeScript 类型定义
      ui/index.tsx     — 共享 UI 组件
      utils/index.ts   — 工具函数
  vite.config.ts       — Vite 配置（@ 别名、/api 代理、vitest jsdom）
scripts/
  dev.py               — 一键启动后端+前端
```

## 后端端口

- 后端 API: http://127.0.0.1:17321
- 前端开发: http://localhost:5173
- API 文档: http://127.0.0.1:17321/docs
- Mock 服务默认端口: 4567

## 语言

项目界面和注释使用中文。
