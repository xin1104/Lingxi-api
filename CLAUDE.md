# CLAUDE.md

灵犀 API Client — 本地优先的中文 API 调试客户端。

## 技术栈

- **后端**: Python 3.14 + FastAPI + httpx + SQLModel + SQLite
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Linter**: Ruff (Python), TypeScript strict mode (前端)

## 启动命令

```bash
# 后端
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 17321

# 前端
cd frontend
npm install
npm run dev

# 一键启动
python scripts/dev.py
```

## 代码质量检查

```bash
# 后端 lint 和测试
python -m ruff check backend/
python -m pytest backend/tests/ -v

# 前端 typecheck 和构建
cd frontend && npm run typecheck && npm run build
```

## 项目结构

- `backend/` - Python FastAPI 后端
  - `app/main.py` - 主入口 (lifespan 模式)
  - `app/features/` - 功能模块路由和服务
  - `app/models.py` - SQLModel 数据模型
  - `app/schemas.py` - Pydantic 请求/响应模式
  - `app/seed.py` - 示例数据种子
  - `tests/` - 31 个单元测试
- `frontend/` - React 前端
  - `src/features/` - 功能页面组件
  - `src/shared/` - 共享类型、API、工具、UI 组件
- `docs/` - 项目说明和验收报告
- `scripts/dev.py` - 一键启动脚本

## 后端端口

- 后端 API: http://127.0.0.1:17321
- 前端开发: http://localhost:5173
- API 文档: http://127.0.0.1:17321/docs

## 语言

项目界面和注释使用中文。
