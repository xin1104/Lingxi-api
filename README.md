# 灵犀 API Client

> 本地优先、中文友好、开箱即用的中文 API 调试客户端

[![CI](https://github.com/yourname/Lingxi-api/actions/workflows/ci.yml/badge.svg)](https://github.com/yourname/Lingxi-api/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

灵犀 API Client 是一个面向个人开发者的**开源中文 API 调试工具**，定位类似 Postman，但**不做云同步、不做团队协作、不做企业付费**。所有数据存储在本地 SQLite，完全离线可用。

核心亮点：真实 HTTP 请求由 Python 后端使用 httpx 发起，**彻底绕过浏览器 CORS 限制**。

## 界面预览

> 截图待补充，见 [docs/images/](docs/images/README.md) 目录下的截图说明。

## 功能列表

| 功能 | 状态 | 说明 |
|------|------|------|
| HTTP 请求发送 | 已完成 | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS |
| Query Params / Headers / Body | 已完成 | JSON / raw / form-data / urlencoded |
| Auth 认证 | 已完成 | No Auth / Bearer / Basic / API Key |
| 响应查看 | 已完成 | 状态码 / 耗时 / 大小 / Headers / Body / JSON 格式化 |
| 接口集合 | 已完成 | 树形结构，支持文件夹 |
| 环境变量 | 已完成 | 多环境 + `{{变量}}` 语法 + 内置变量 |
| 请求历史 | 已完成 | 自动记录 / 搜索 / 筛选 / 恢复 |
| Mock 服务 | 已完成 | 路由管理 / 启动停止 / 日志查看 |
| cURL 导入导出 | 已完成 | 支持常见 cURL 格式 |
| Postman 导入 | 已完成 | Collection v2.1 基础版 |
| OpenAPI 导入 | 已完成 | 3.0 基础版 |
| 代码生成 | 已完成 | cURL / Python / JS / Node.js / Go |
| 请求捕获 | 已完成 | 捕获本软件发出的所有请求 |
| 应用设置 | 已完成 | 主题 / 超时 / 代理等 |
| 数据备份 | 已完成 | 完整 JSON 导出 |
| Pre Script / Tests | TODO | 计划 v0.2 |
| Monaco Editor | TODO | 计划 v0.2 |
| HTTP 代理抓包 | TODO | 计划 v0.4 |

## 架构

灵犀 API Client 采用 **前后端分离 + Python 本地能力中心** 架构：

```
React 前端 (界面 + 状态管理)
    │
    │  HTTP (所有 API 请求通过 /api/*)
    ▼
Python FastAPI 后端 (本地能力中心)
    │  ├── httpx 发送真实 HTTP/HTTPS 请求
    │  ├── SQLite 本地持久化
    │  ├── Mock Server
    │  ├── cURL 解析 / 代码生成
    │  └── 变量解析 / 请求捕获
    │
    ▼
SQLite 数据库 (lingxi.db)
```

**为什么用 Python 后端发请求？** 浏览器直接调用外部 API 受 CORS 策略限制，很多接口调试场景下请求会被拦截。通过 Python 后端使用 httpx 发送请求，完全不受浏览器同源策略影响。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Python 3.11+ / FastAPI / Uvicorn |
| HTTP 客户端 | httpx |
| 数据持久化 | SQLite + SQLModel (SQLAlchemy) |
| 数据校验 | Pydantic v2 |
| 前端框架 | React 18 / TypeScript |
| 构建工具 | Vite |
| CSS | Tailwind CSS |
| 状态管理 | Zustand |
| 代码检查 | Ruff (Python) / tsc strict (TypeScript) |
| 测试 | pytest |

## 目录结构

```
Lingxi-api/
├── .github/workflows/ci.yml    # GitHub Actions CI
├── backend/                     # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 入口 (lifespan + 静态文件托管)
│   │   ├── config.py / database.py / models.py / schemas.py
│   │   ├── seed.py             # 示例数据种子
│   │   └── features/           # 功能模块
│   │       ├── request_workbench/  # 请求发送 (httpx)
│   │       ├── collections/        # 集合管理
│   │       ├── environments/       # 环境变量
│   │       ├── history/            # 请求历史
│   │       ├── mock/               # Mock 服务
│   │       ├── import_export/      # 导入导出 + cURL 解析
│   │       ├── codegen/            # 代码生成
│   │       ├── capture/            # 请求捕获
│   │       └── settings/           # 设置管理
│   ├── tests/                  # 31 个 pytest 测试
│   └── requirements.txt
├── frontend/                    # React TypeScript 前端
│   ├── src/
│   │   ├── app/App.tsx
│   │   ├── features/           # 功能页面组件
│   │   └── shared/             # API / Store / Types / UI / Utils
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── dev.py                  # 一键启动
│   └── check.py                # 一键检查
├── docs/
│   ├── 项目说明.md              # 详细设计文档
│   ├── 演示流程.md              # 手动演示步骤
│   ├── 验收报告.md              # 验收报告
│   └── images/README.md        # 截图目录说明
├── README.md
├── LICENSE (MIT)
└── .gitignore
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+

### 安装

```bash
git clone https://github.com/yourname/Lingxi-api.git
cd Lingxi-api

# 后端依赖
cd backend && pip install -r requirements.txt

# 前端依赖
cd ../frontend && npm install
```

### 开发模式启动

```bash
# 终端 1：后端
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 17321

# 终端 2：前端
cd frontend
npm run dev
```

访问 http://localhost:5173

### 单服务模式启动

构建前端后由 FastAPI 统一托管，**只需启动一个服务**：

```bash
cd frontend && npm run build
cd ../backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 17321
```

访问 http://127.0.0.1:17321

### 一键启动

```bash
python scripts/dev.py
```

### 一键检查

```bash
python scripts/check.py
```

## 使用示例

### 发送请求

在 URL 输入框填写 URL，选择方法，点击"发送"即可：

```
GET http://127.0.0.1:17321/api/health
```

快捷键：`Ctrl + Enter`

### 环境变量

```bash
# 创建环境变量
base_url = http://127.0.0.1:8000

# 在请求中使用
{{base_url}}/bm/api/v2/catalogs
```

内置变量：`{{$timestamp}}` `{{$uuid}}` `{{$randomInt}}` `{{$datetime}}`

### cURL 导入

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
```

粘贴到"导入导出"页面即可自动解析为请求配置。

### 代码生成

支持 5 种语言/工具：
- cURL
- Python requests
- JavaScript fetch
- Node.js axios
- Go net/http

### Mock 服务

```bash
# 在 Mock 页面创建路由
GET /api/user → {"id": 1, "name": "张三", "role": "developer"}

# 启动 Mock 服务后访问
curl http://127.0.0.1:4567/api/user
```

## 数据持久化

所有数据存储在 `backend/data/lingxi.db`（SQLite），包括：

- 集合和请求配置
- 环境和变量
- 请求历史
- Mock 路由
- 应用设置

首次启动自动插入示例数据，支持通过"导入导出"页面备份完整数据。

## 测试

```bash
# 后端测试
cd backend
python -m pytest tests/ -v

# 后端代码检查
python -m ruff check .

# 前端类型检查
cd frontend
npm run typecheck

# 前端构建
npm run build
```

## Demo 暂未实现

以下功能 UI 中已有入口但标注为 TODO，不会伪造行为：

| 功能 | 计划 |
|------|------|
| Pre Script 脚本 | v0.2 |
| Tests 断言 | v0.2 |
| Monaco Editor | v0.2 |
| Cookies 面板 | v0.2 |
| HTTP 代理抓包 | v0.4 |
| WebSocket | TBD |
| GraphQL | TBD |
| 桌面打包 | v1.0 |

## 路线图

- **v0.2** — Monaco Editor、Pre Script/Tests 脚本、Cookies 面板、图片预览
- **v0.3** — WebSocket 调试
- **v0.4** — 基础 HTTP 代理抓包
- **v1.0** — 桌面应用打包 (PyInstaller / Electron)

## 常见问题

**Q: 为什么请求要先发给 Python 后端？**
A: 避免浏览器 CORS 限制。Python httpx 可以发送任意 HTTP/HTTPS 请求，不受跨域策略影响。

**Q: 数据库在哪里？**
A: `backend/data/lingxi.db`，可迁移可备份。

**Q: 支持 HTTPS 抓包吗？**
A: 不支持。当前版本仅捕获本软件发出的请求，外部代理为后续 TODO。

**Q: 可以导入其他工具的配置吗？**
A: 支持 cURL、Postman Collection v2.1 和 OpenAPI 3.0 的基础导入。

## License

MIT License — 详见 [LICENSE](LICENSE)

## 致谢

[FastAPI](https://fastapi.tiangolo.com/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [httpx](https://www.python-httpx.org/) · [Zustand](https://zustand.docs.pmnd.rs/) · [Lucide Icons](https://lucide.dev/)
