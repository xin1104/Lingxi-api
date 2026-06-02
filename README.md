# 灵犀 API Client

本地优先的中文 API 调试客户端 — 开源、离线、可自托管的 Postman 替代方案。

## 项目定位

灵犀 API Client 是一个面向个人开发者的**中文 API 调试工具**，采用 Python FastAPI 后端 + React 前端架构，所有数据本地存储，无需云端服务。

**目标用户**：后端开发者、AI 应用工程师、本地大模型/OCR/FastAPI/Flask/Java Spring 接口调试用户。

## 核心特性

- **中文界面** — 完整中文 UI，技术术语保留英文
- **本地优先** — 数据存储在本地 SQLite，完全离线可用
- **Python 后端发送请求** — 使用 httpx 发起真实 HTTP/HTTPS 请求，绕过浏览器 CORS 限制
- **环境变量** — 支持多环境管理和 `{{变量名}}` 语法替换
- **接口集合** — 树形结构组织和管理 API 请求
- **请求历史** — 自动记录每次请求，支持搜索和筛选
- **Mock 服务** — 内置 Mock Server，快速模拟 API 响应
- **代码生成** — 一键生成 cURL、Python requests、JS fetch、Node.js axios、Go net/http 代码
- **导入导出** — 支持 cURL、Postman Collection v2.1、OpenAPI 3.0 格式
- **请求捕获** — 实时捕获本软件发出的所有请求
- **深色模式** — 默认深色主题，VSCode 风格

## 不做的事情

- 登录/注册/账号体系
- 云同步/云端存储
- 团队空间/成员权限
- 在线支付/企业审计
- SaaS 平台/商业授权

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python 3.14 + FastAPI + httpx + SQLModel + SQLite |
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand |
| 图标 | Lucide Icons |
| 测试 | pytest (后端), tsc + Vite (前端) |

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+

### 安装

```bash
# 克隆项目
git clone https://github.com/yourname/Lingxi-api.git
cd Lingxi-api

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
npm install
```

### 启动

**方式一：一键启动（推荐）**

```bash
python scripts/dev.py
```

**方式二：分别启动**

```bash
# 终端 1 — 后端
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 17321

# 终端 2 — 前端
cd frontend
npm run dev
```

### 访问

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端界面 |
| http://127.0.0.1:17321 | 后端 API |
| http://127.0.0.1:17321/docs | API 文档 (Swagger) |

## 使用示例

### 1. 发送请求

```
GET http://127.0.0.1:17321/api/health
```

在 URL 输入框填写 URL，选择方法，点击"发送"即可看到响应。

### 2. 使用环境变量

```bash
# 创建环境
名称：本地环境
变量：base_url = http://127.0.0.1:8000

# 请求中使用
{{base_url}}/bm/api/v2/catalogs
```

### 3. 导入 cURL

```bash
# 粘贴到导入导出页面
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
```

自动解析为请求配置。

### 4. 生成代码

选择请求后，可生成以下格式的代码：
- **cURL** — 终端直接运行
- **Python** — requests 库
- **JavaScript** — fetch API
- **Node.js** — axios
- **Go** — net/http

### 5. Mock 服务

```
# 创建 Mock 路由
GET /api/user → {"id": 1, "name": "张三", "role": "developer"}

# 启动 Mock 服务器
http://127.0.0.1:4567/api/user
```

## 项目结构

```
Lingxi-api/
├── backend/                    # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置
│   │   ├── database.py        # 数据库连接
│   │   ├── models.py          # SQLModel 数据模型
│   │   ├── schemas.py         # Pydantic 请求/响应模式
│   │   ├── seed.py            # 示例数据种子
│   │   ├── features/          # 功能模块
│   │   │   ├── request_workbench/  # 请求发送
│   │   │   ├── collections/        # 集合管理
│   │   │   ├── environments/       # 环境变量
│   │   │   ├── history/            # 请求历史
│   │   │   ├── mock/               # Mock 服务
│   │   │   ├── import_export/      # 导入导出
│   │   │   ├── codegen/            # 代码生成
│   │   │   ├── capture/            # 请求捕获
│   │   │   └── settings/           # 设置
│   │   └── utils/             # 工具函数
│   ├── tests/                 # 测试
│   └── requirements.txt       # 依赖
│
├── frontend/                   # React TypeScript 前端
│   ├── src/
│   │   ├── app/               # 主应用入口
│   │   ├── features/          # 功能页面组件
│   │   │   ├── request-workbench/  # 请求编辑器+响应查看器
│   │   │   ├── environments/       # 环境管理
│   │   │   ├── history/            # 历史记录
│   │   │   ├── mock/               # Mock 管理
│   │   │   ├── import-export/      # 导入导出
│   │   │   ├── capture/            # 请求捕获
│   │   │   └── settings/           # 设置
│   │   └── shared/            # 共享组件
│   │       ├── api/           # API 调用
│   │       ├── store/         # Zustand 状态
│   │       ├── types/         # TypeScript 类型
│   │       ├── ui/            # UI 组件
│   │       └── utils/         # 工具函数
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                      # 文档
│   ├── 项目说明.md            # 详细项目说明
│   └── 验收报告.md            # 验收报告
│
├── scripts/
│   └── dev.py                 # 一键启动脚本
│
└── README.md
```

## 运行测试

```bash
cd backend
python -m pytest tests/ -v
```

## 已实现功能

- [x] HTTP/HTTPS 请求发送（GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS）
- [x] 请求参数、Header、Auth（Bearer/Basic/API Key）、Body（JSON/raw/form-data/urlencoded）
- [x] 响应状态码、耗时、大小、Headers、Body 展示
- [x] JSON 响应自动格式化
- [x] 接口集合管理（新建、删除、保存、恢复请求）
- [x] 环境变量管理（多环境、{{变量}}替换、内置变量）
- [x] 请求历史（自动记录、搜索、筛选、恢复）
- [x] Mock 服务（路由管理、启动/停止、日志查看）
- [x] cURL 导入导出
- [x] Postman Collection v2.1 基础导入
- [x] OpenAPI 3.0 基础导入
- [x] 代码生成（cURL/Python/JavaScript/Node.js/Go）
- [x] 请求捕获（本软件发出的请求）
- [x] 应用设置（主题、超时、代理等）
- [x] 数据备份导出
- [x] SQLite 本地持久化
- [x] 示例数据（集合、请求、环境、Mock）
- [x] 深色模式
- [x] 31 个后端单元测试
- [x] TypeScript 严格模式 typecheck

## Demo 暂未实现（TODO）

- [ ] Pre Script 脚本执行沙箱
- [ ] Tests 脚本断言系统
- [ ] Monaco Editor 集成（当前使用 textarea）
- [ ] 响应 Cookies 详情面板
- [ ] 响应图片预览
- [ ] 外部 HTTP 代理抓包
- [ ] HTTPS MITM 解密
- [ ] WebSocket 调试
- [ ] GraphQL 调试
- [ ] 桌面应用打包（Electron/pywebview）
- [ ] 请求重放/批量测试
- [ ] 响应差异对比
- [ ] 前端单元测试（Vitest）

## 后续路线图

- **v0.2** — Monaco Editor 集成、Cookies 面板、图片预览
- **v0.3** — Pre Script 和 Tests 脚本系统
- **v0.4** — 基础 HTTP 代理抓包
- **v0.5** — WebSocket 调试
- **v1.0** — 桌面应用打包 + 正式发布

## 常见问题

**Q: 为什么请求要经过 Python 后端？**
A: 避免浏览器 CORS 限制。Python 后端的 httpx 可以发送任意 HTTP/HTTPS 请求，不受跨域策略影响。

**Q: 数据库文件在哪里？**
A: `backend/data/lingxi.db`，可用任何 SQLite 工具打开查看。

**Q: 数据可以迁移吗？**
A: 可以通过"导入导出"页面的"数据备份"功能导出完整 JSON 备份。

**Q: 支持 HTTPS 抓包吗？**
A: 当前版本不支持。后续版本计划实现基础 HTTP 代理功能。

## 开源协议

MIT License

## 致谢

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [httpx](https://www.python-httpx.org/)
