# 灵犀 API Client

> 本地优先、中文友好、开箱即用的中文 API 调试客户端

[![CI](https://github.com/xin1104/Lingxi-api/actions/workflows/ci.yml/badge.svg)](https://github.com/xin1104/Lingxi-api/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

灵犀 API Client 是一个面向个人开发者的**开源中文 API 调试工具**，定位类似 Postman，但**不做云同步、不做团队协作、不做企业付费**。所有数据存储在本地 SQLite，完全离线可用。

核心亮点：真实 HTTP 请求由 Python 后端使用 httpx 发起，**彻底绕过浏览器 CORS 限制**。

**当前版本: v1.0.0**

## 界面预览

> 截图待补充，见 [docs/images/](docs/images/README.md) 目录下的截图说明。

## 功能列表

| 功能 | 状态 | 说明 |
|------|------|------|
| HTTP 请求发送 | ✅ | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS |
| Query Params / Headers / Body | ✅ | JSON / raw / form-data / urlencoded |
| Auth 认证 | ✅ | No Auth / Bearer / Basic / API Key |
| 响应查看 | ✅ | 状态码 / 耗时 / 大小 / Headers / Body / JSON 格式化 |
| 接口集合 | ✅ | 树形结构，支持文件夹 |
| 环境变量 | ✅ | 多环境 + `{{变量}}` 语法 + 内置变量 |
| 请求历史 | ✅ | 自动记录 / 搜索 / 筛选 / 恢复 / 重放 |
| Mock 服务 | ✅ | 路由管理 / 启动停止 / 延迟模拟 / 日志查看 |
| cURL 导入导出 | ✅ | 支持常见 cURL 格式 |
| Postman 导入 | ✅ | Collection v2.1 基础版 |
| OpenAPI 导入 | ✅ | 3.0 基础版 |
| 代码生成 | ✅ | cURL / Python / JS / Node.js / Go |
| 请求捕获 | ✅ | 捕获本软件 + 代理发出的请求（SQLite 持久化）| |
| 应用设置 | ✅ | 主题 / 超时 / 代理端口等 |
| 数据备份 | ✅ | 完整 JSON 导出 |
| Pre Script 执行 | ✅ | 发送前执行: setHeader/setEnv/setParam/setBody/log |
| Tests 断言 | ✅ | 安全 DSL: pm.test/pm.assert 断言系统（7 种断言）| |
| Cookie Jar | ✅ | 自动保存/携带 Cookie，domain/path/expires/secure 匹配 |
| Cookies 面板 | ✅ | Set-Cookie 解析 + 属性展示 |
| 响应视图增强 | ✅ | HTML iframe 安全预览 / 图片预览 / 二进制下载 / Headers+信息面板 |
| Monaco Editor | ✅ | JSON / raw / Script 编辑器 + 快捷键 + 中文语言包 |
| HTTP 代理抓包 | ✅ | 基础 HTTP 代理，支持 GET/POST/PUT/PATCH/DELETE |
| HTTPS CONNECT 记录 | ✅ | 仅记录域名/端口，不解密内容 |
| Toast 通知 | ✅ | 统一 Toast 系统（success/error/info/warning） |
| 请求重放 | ✅ | 从历史/捕获恢复到工作台或立即重放 |
| E2E 测试 | ✅ | Playwright E2E + GitHub Actions 手动触发 |
| WebSocket 调试 | 🔜 后续 | — |
| GraphQL 调试 | 🔜 后续 | — |

## HTTP 代理抓包

灵犀 API Client 支持基础 HTTP 代理抓包，可以将外部 HTTP 客户端的流量代理到本软件捕获。

### 启动代理

1. 打开"请求捕获 / HTTP 代理"页面
2. 点击"启动代理"按钮
3. 默认代理地址: `http://127.0.0.1:8899`
4. 可在设置中修改代理端口

### 使用示例

```bash
# curl 通过代理发送请求
curl --proxy http://127.0.0.1:8899 http://example.com/api/data

# Python requests 通过代理
import requests
proxies = {"http": "http://127.0.0.1:8899"}
requests.get("http://example.com/api/data", proxies=proxies)
```

### 代理安全说明

⚠️ **重要安全注意事项：**

- 代理**仅监听 127.0.0.1**，不对外暴露
- 代理**仅供本机调试使用**，不要用于生产环境
- **不支持 HTTPS 内容解密**：HTTPS CONNECT 仅记录目标域名和端口
- 不做 MITM（中间人攻击），不做证书劫持
- 代理记录保存在本地 SQLite

### HTTPS CONNECT 限制

当前版本对 HTTPS CONNECT 请求的处理：
- 记录目标域名和端口
- 记录连接时间
- **不解密、不查看 HTTPS 内容**
- UI 中显示明确提示：`这是 HTTPS CONNECT 连接，当前版本仅记录目标域名和端口，不解密请求内容。`

### 代理抓包页面功能

- 双模式切换：本软件请求捕获 / HTTP 代理抓包
- 代理状态显示：未启动 / 运行中 / 端口占用错误
- 日志筛选：按 method / status_code / host / keyword / HTTPS CONNECT
- 记录详情：请求头、请求体预览、响应头、响应体预览
- 复制 URL、复制 cURL、恢复到工作台

## 请求重放

从历史记录或捕获记录中：
- **恢复到工作台**：将请求配置加载到编辑器，可修改后发送
- **立即重放**：弹窗确认后直接重新发送请求（携带敏感 Header 时追加提醒）
- 重放成功后显示 Toast 通知
- 重放产生新的历史记录

## Tests 脚本系统（v0.5 新增）

Tests 系统允许在请求完成后执行断言脚本，验证响应结果是否满足预期。

**支持的断言 API：**
- `pm.test(name, fn)` — 定义测试用例
- `pm.assert(condition, message)` — 断言条件
- `pm.response.to.haveStatus(code)` — 检查状态码
- `pm.response.to.be.success` — 检查 2xx
- `pm.response.to.be.json` — 检查 JSON 响应
- `expect(value).toBe(expected)` — 精确匹配
- `expect(value).toContain(substring)` — 包含匹配
- `expect(value).toHaveStatus(code)` — 别名
- `expect(value).toBeJson()` — 可解析为 JSON
- `expect(value).toHaveHeader(name)` — 包含 Header
- `expect(value).toBeLessThan(max)` — 数值比较
- `pm.environment.get/set` — 环境变量读写

**安全执行：** 使用 Function 构造器在受限作用域中执行，仅暴露测试 API，不暴露 window/document/fetch 等危险对象。

## Pre Script 系统

Pre Script 允许在发送请求前执行脚本，动态修改请求参数。

**支持的 API：**
- `pm.setHeader(name, value)` — 设置请求头
- `pm.removeHeader(name)` — 删除请求头
- `pm.setEnv(name, value)` — 设置环境变量
- `pm.setParam(name, value)` — 设置参数
- `pm.setBody(body)` — 设置请求体
- `console.log` — 输出日志

## 响应视图增强（v0.5 新增）

- **HTML 预览**：iframe 沙盒隔离，安全渲染 HTML 响应
- **图片预览**：直接渲染 image/png/jpeg/gif/webp/svg 响应
- **二进制下载**：检测二进制响应（PDF/ZIP 等），提供文件下载按钮
- **信息栏**：状态码、耗时、响应大小
- **Headers 面板**：完整响应头展示
- **Tests 面板**：显示脚本执行结果（通过/失败/总计）
- **Cookies 面板**：Set-Cookie 解析与属性展示

## Capture SQLite 持久化（v0.5 新增）

请求捕获数据从内存数组迁移到 SQLite `CaptureRecord` 表，支持：
- 持久化存储，重启不丢失
- API 检索与清空
- 记录详情查询

## Mock 增强（v0.5 新增）

- **延迟模拟**：MockRoute.delay 字段，支持模拟慢响应
- **模板变量**：响应体支持 `{{$request.url}}` `{{$request.method}}` 模板
- **日志面板**：前端 Mock 页面新增日志面板，显示匹配记录（方法/路径/时间）

## 架构

灵犀 API Client 采用 **前后端分离 + Python 本地能力中心** 架构：

```
React 前端 (界面 + 状态管理)
    │
    │  HTTP (所有 API 请求通过 /api/*)
    ▼
Python FastAPI 后端 (本地能力中心)
    │  ├── httpx 发送真实 HTTP/HTTPS 请求
    │  ├── HTTP 代理服务器（抓包）
    │  ├── SQLite 本地持久化
    │  ├── Mock Server
    │  ├── Cookie Jar（自动 Cookie 管理）
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
| 代码编辑器 | Monaco Editor |
| 代码检查 | Ruff (Python) / tsc strict (TypeScript) |
| 测试 | pytest (后端 103+) / Vitest (前端 71+) / Playwright (E2E) |

## 目录结构

```
Lingxi-api/
├── .github/workflows/            # GitHub Actions CI
│   ├── ci.yml                    # 常规 CI (test + lint + build)
│   └── e2e.yml                   # E2E 测试 (手动触发)
├── backend/                      # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py               # 入口 (lifespan + 静态文件托管)
│   │   ├── config.py / database.py / models.py / schemas.py
│   │   ├── seed.py               # 示例数据种子
│   │   └── features/             # 功能模块
│   │       ├── request_workbench/ # 请求发送 (httpx)
│   │       ├── collections/       # 集合管理
│   │       ├── environments/      # 环境变量
│   │       ├── history/           # 请求历史
│   │       ├── mock/              # Mock 服务
│   │       ├── import_export/     # 导入导出 + cURL 解析
│   │       ├── codegen/           # 代码生成
│   │       ├── capture/           # 请求捕获
│   │       ├── cookie_jar/        # Cookie Jar (v0.4)
│   │       ├── proxy/             # HTTP 代理抓包 (v0.4)
│   │       └── settings/          # 设置管理
│   ├── tests/                     # 66 个 pytest 测试
│   └── requirements.txt
├── frontend/                      # React TypeScript 前端
│   ├── src/
│   │   ├── __tests__/             # 71 个 Vitest 测试
│   │   ├── app/App.tsx
│   │   ├── features/              # 功能页面组件
│   │   └── shared/                # API / Store / Types / UI / Utils
│   ├── e2e/                       # Playwright E2E 测试
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── dev.py                     # 一键启动
│   ├── check.py                   # 一键检查
│   └── e2e.py                     # E2E 测试启动
├── docs/
│   ├── 项目说明.md                 # 详细设计文档
│   ├── 演示流程.md                 # 手动演示步骤
│   ├── 验收报告.md                 # 验收报告
│   ├── v0.4更新说明.md             # v0.4 更新说明
│   └── images/README.md           # 截图目录说明
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
git clone https://github.com/xin1104/Lingxi-api.git
cd Lingxi-api

# 后端依赖
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 前端依赖
cd ../frontend && npm install
```

### 开发模式启动

```bash
# 终端 1：后端
cd backend
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 17321

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
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 17321
```

访问 http://127.0.0.1:17321

### 一键启动

```bash
python3 scripts/dev.py
```

### 一键检查

```bash
python3 scripts/check.py          # 基本检查
python3 scripts/check.py --e2e    # 包含 E2E 测试
```

## E2E 测试

### 本地运行

```bash
# 安装 Playwright 浏览器
cd frontend
npx playwright install

# 通过脚本运行（自动启动后端+前端）
cd ..
python3 scripts/e2e.py

# 或直接运行
cd frontend
npm run e2e
```

### GitHub Actions

E2E 测试支持 GitHub Actions 手动触发：
1. 访问仓库的 Actions 页面
2. 选择 "E2E Tests" workflow
3. 点击 "Run workflow"

详见 `.github/workflows/e2e.yml`。

## 使用示例

### 发送请求

在 URL 输入框填写 URL，选择方法，点击"发送"即可：

```
GET http://127.0.0.1:17321/api/health
```

**Monaco Editor 快捷键：**
- `Ctrl/Cmd + Enter` — 发送请求
- `Ctrl/Cmd + S` — 保存请求
- `Alt/Option + Shift + F` — 格式化 JSON

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

### Cookie Jar

Cookie Jar 自动管理请求中的 Cookie：

1. 收到 `Set-Cookie` 响应头时自动保存到 SQLite
2. 后续同域名、同 path 匹配的请求自动携带 Cookie
3. 过期 Cookie 不会发送
4. Secure Cookie 仅通过 HTTPS 发送
5. 手动设置的 Cookie Header 优先级高于 Cookie Jar
6. 可在设置中启用/禁用 Cookie Jar
7. 可在设置页清空 Cookie Jar

### HTTP 代理抓包

```bash
# 1. 在"请求捕获 / HTTP 代理"页面启动代理
# 2. 使用 curl 通过代理发送请求
curl --proxy http://127.0.0.1:8899 http://httpbin.org/get

# 3. 在抓包页面查看捕获的请求
# 4. HTTPS CONNECT 仅记录域名和端口，不解密内容
```

## 数据持久化

所有数据存储在 `backend/data/lingxi.db`（SQLite），包括：

- 集合和请求配置
- 环境和变量
- 请求历史
- Mock 路由
- Cookie Jar
- 代理抓包日志
- 应用设置

首次启动自动插入示例数据，支持通过"导入导出"页面备份完整数据。

## 测试

```bash
# 后端测试 (103+ tests)
cd backend
.venv/bin/python -m pytest tests/ -v
.venv/bin/python -m ruff check .

# 前端测试 (71 tests)
cd frontend
npm run test
npm run typecheck
npm run build

# E2E 测试
python3 scripts/e2e.py

# 一键全检
python3 scripts/check.py --e2e
```

## Tests / Pre Script 安全说明

Tests 和 Pre Script 系统使用 Function 构造器在受限作用域中执行脚本，仅暴露白名单 API：

**Tests 暴露：** `pm.test`, `pm.assert`, `pm.response`, `pm.request`, `expect`, `console`
**Pre Script 暴露：** `pm.setHeader`, `pm.removeHeader`, `pm.setEnv`, `pm.setParam`, `pm.setBody`, `console`

**不暴露：** window、document、localStorage、fetch、XMLHttpRequest 等危险对象。

这是 Demo 级安全实现，仅供个人开发者日常 API 测试使用。

## 当前限制

v1.0.0 已知限制：

1. **HTTPS MITM 解密**：不支持，也不会实现
2. **外部 HTTPS 内容解密**：HTTPS CONNECT 仅记录域名和端口
3. **WebSocket 调试**：计划后续版本
4. **GraphQL 调试**：计划后续版本
5. **插件系统**：暂无计划
6. **云同步**：不计划实现
7. **团队空间**：不计划实现

## 版本历史

| 版本 | 亮点 |
|:----:|------|
| **v1.0.0** | 打磨轮：UI 交互打磨、空状态、表单验证、跨平台兼容、端口占用检测、全量测试通过 |
| **v0.5.0** | Tests 脚本系统、Pre Script 执行器、响应 HTML 预览 + 二进制下载、Mock 延迟/模板变量/Capture SQLite 持久化 |
| **v0.4.0** | HTTP 代理抓包、E2E CI、Toast 通知、请求重放增强 |
| **v0.3.0** | Pre Script 执行、Cookie Jar、请求重放 |
| **v0.2.0** | Monaco Editor、Tests 断言、Cookies 面板、图片预览 |
| **v0.1.0** | 基础 HTTP 请求发送、集合管理、环境变量、Mock、cURL/Postman/OpenAPI 导入、代码生成 |

## 常见问题

**Q: 为什么请求要先发给 Python 后端？**
A: 避免浏览器 CORS 限制。Python httpx 可以发送任意 HTTP/HTTPS 请求，不受跨域策略影响。

**Q: 数据库在哪里？**
A: `backend/data/lingxi.db`，可迁移可备份。

**Q: 支持 HTTPS 抓包吗？**
A: 不支持 HTTPS 内容解密。HTTP 代理可捕获 HTTP 请求，HTTPS CONNECT 仅记录域名和端口。不做 MITM。

**Q: Cookie Jar 如何工作？**
A: 自动解析 Set-Cookie 响应头并保存到 SQLite。后续请求根据 domain/path/expires/secure 规则自动匹配并携带。手动设置的 Cookie Header 优先级更高。

**Q: 可以导入其他工具的配置吗？**
A: 支持 cURL、Postman Collection v2.1 和 OpenAPI 3.0 的基础导入。

**Q: 代理端口被占用怎么办？**
A: 在设置页修改代理端口，或停止占用该端口的程序。

## License

MIT License — 详见 [LICENSE](LICENSE)

## 致谢

[FastAPI](https://fastapi.tiangolo.com/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [httpx](https://www.python-httpx.org/) · [Zustand](https://zustand.docs.pmnd.rs/) · [Lucide Icons](https://lucide.dev/) · [Monaco Editor](https://microsoft.github.io/monaco-editor/)
