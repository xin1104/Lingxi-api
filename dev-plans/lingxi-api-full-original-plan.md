# 灵犀 API Client — 原始完整开发计划

> 此文件为用户提供的原始开发计划完整版，作为后续所有版本迭代的最高参考依据。

## 项目目标

做一个中文综合 API 调试软件，定位类似 Postman / Apifox / ApiPost / Reqable 的个人开发者版本，
重点是"本地优先、中文友好、功能完整、可开源、可离线使用"。
不要做企业级团队协作、云同步、账号体系、权限管理、在线付费功能。
后端使用 Python 实现。

## 一、产品定位

产品暂定名：灵犀 API Client

### 目标用户
1. 后端开发者
2. AI 应用工程师
3. 本地大模型 / OCR / FastAPI / Flask / Java Spring 接口调试用户
4. 想替代 Postman、Apifox、ApiPost 的中文个人用户

### 核心价值
1. 中文界面
2. 本地保存数据
3. Python 后端负责真实 HTTP 请求，避免浏览器 CORS 限制
4. 支持常见 HTTP API 调试
5. 支持环境变量
6. 支持接口集合管理
7. 支持请求历史
8. 支持响应美化
9. 支持 cURL / Postman / OpenAPI 导入导出
10. 支持基础自动化测试脚本
11. 支持简单 Mock
12. 支持基础请求捕获

### 非目标
1. 不做登录注册
2. 不做云端同步
3. 不做团队空间
4. 不做成员权限
5. 不做在线支付
6. 不做企业审计
7. 不做复杂 HTTPS MITM 解密，最多做基础 HTTP 代理或请求捕获 Demo
8. 不追求一次性实现所有边缘协议，优先完成 HTTP/HTTPS API 调试主流程

## 二、技术栈要求

### 前端
- React + TypeScript + Vite
- Tailwind CSS
- Zustand 或 Redux Toolkit
- Monaco Editor 用于 JSON / raw body / 脚本编辑
- lucide-react 图标
- shadcn/ui 风格组件可选
- 前端只负责界面和状态管理，不直接承担真实跨域请求

### 后端
- Python 3.11+ + FastAPI + Uvicorn
- httpx 用于发送真实 HTTP/HTTPS 请求
- Pydantic 数据校验
- SQLite 本地数据持久化
- SQLModel 优先
- pytest 后端测试
- ruff 或 black 代码格式化

### 运行方式
- 开发模式：后端 `python -m app.main`，前端 `npm run dev`
- 后续一键启动：`python scripts/dev.py`
- 后续打包：PyInstaller 打包后端 + 前端静态资源

### 代码质量
- TypeScript 严格模式
- Python 类型注解
- Pydantic schema 清晰
- 组件拆分合理但不过度抽象
- 以功能模块组织代码
- 低耦合、高内聚
- 关键逻辑有测试

## 三、整体架构

### 前端 React 负责
- 界面展示、请求编辑、集合管理界面、环境变量界面
- 响应展示、Mock 管理界面、导入导出界面、设置界面

### Python FastAPI 后端负责
- 发送真实 HTTP/HTTPS 请求
- 处理代理设置
- 保存和读取 SQLite 数据
- 管理集合、环境、历史
- 解析 cURL
- 导入导出 Postman/OpenAPI 基础格式
- 启动 Mock Server
- 记录请求捕获历史
- 提供本地 API 给前端调用

### 前后端通信
- 前端通过 HTTP 调用 Python 后端
- 后端默认地址：http://127.0.0.1:17321
- 所有后端接口统一以 /api 开头

## 四、核心功能模块

### 模块 1：首页与整体布局
三栏布局：左侧栏（集合树/导航）、中间主区域（请求编辑器）、下方/右侧（响应查看器）
支持深色/浅色模式、默认深色、中文界面、接口树折叠

### 模块 2：接口请求调试
支持 GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS
URL 变量替换、Query Params 表格、Headers 表格、Auth (Bearer/Basic/API Key)
Body (none/raw/JSON/form-data/x-www-form-urlencoded/binary)
Monaco Editor 编辑 JSON、发送 + Ctrl+Enter 快捷发送
响应：状态码颜色、耗时/大小、JSON 格式化、HTML 源码、图片预览、二进制下载

### 模块 3：接口集合 Collection
新建集合/文件夹/请求、重命名/删除/复制、多请求标签页
数据结构：Collection → Folder → RequestItem

### 模块 4：环境变量
新建/删除/切换环境、变量 key/value/enabled/description
支持全局变量、环境变量、内置变量({{$timestamp}}/{{$uuid}}等)
变量解析顺序：当前环境 → 全局 → 内置

### 模块 5：请求历史
自动记录历史、包含请求快照/响应摘要/状态码/耗时/大小
恢复/删除/清空/搜索/筛选

### 模块 6：Pre Script 和 Tests
Pre Script: 请求发送前执行，可设置变量/修改 header/修改 body
Tests: 响应返回后执行，支持断言、显示通过/失败
推荐方案 A：前端受限 JS 执行上下文
API: client.setEnv/getEnv/setGlobal, expect().toBe()

### 模块 7：Mock 服务
Python FastAPI 实现本地 Mock Server
新建 Mock 路由 (method/path/status/headers/body)
启动/停止 Mock Server、记录命中日志

### 模块 8：导入导出
导入: cURL、Postman Collection v2.1、OpenAPI 3.0
导出: cURL、集合 JSON、Postman Collection、本地备份 JSON

### 模块 9：代码生成
至少支持: cURL、Python requests、JavaScript fetch、Node.js axios、Go net/http
代码可复制、中文说明、自动带上 headers/body

### 模块 10：基础抓包 / 请求捕获
第一阶段: 捕获本软件发出的所有请求
第二阶段预留: 基础 HTTP 代理、HTTPS CONNECT 记录不解密

### 模块 11：设置
主题、超时、历史数量、JSON 格式化、Mock 端口、后端地址、代理设置、数据库位置、清空数据

## 五、API 设计

### 请求发送
POST /api/send-request

### 集合
GET/POST/PUT/DELETE /api/collections

### 请求项
POST/PUT/DELETE /api/requests

### 环境
GET/POST/PUT/DELETE /api/environments
POST /api/environments/current

### 历史
GET/DELETE /api/history

### 导入导出
POST /api/import/curl
POST /api/import/postman
POST /api/import/openapi
POST /api/export/curl
POST /api/export/postman
GET /api/export/backup

### 代码生成
POST /api/codegen

### Mock
GET/POST/PUT/DELETE /api/mock/routes
POST /api/mock/start
POST /api/mock/stop
GET /api/mock/logs

### 捕获
GET/DELETE /api/capture/records

### 设置
GET/PUT /api/settings

## 六、数据模型
ApiRequest, ApiResponse, RequestParam, RequestHeader, RequestBody, AuthConfig,
Collection, Folder, RequestItem, Environment, VariableItem, HistoryRecord,
MockRoute, MockLog, TestResult, AppSettings, CodegenResult, ImportResult

## 七、目录结构
```
project-root/
├── backend/app/
│   ├── main.py, config.py, database.py, models.py, schemas.py
│   └── features/
│       ├── request_workbench/ (router.py, service.py, http_client.py, variable_resolver.py)
│       ├── collections/
│       ├── environments/
│       ├── history/
│       ├── mock/
│       ├── import_export/
│       ├── codegen/
│       ├── capture/
│       ├── cookie_jar/
│       ├── proxy/
│       └── settings/
├── frontend/src/
│   ├── app/ (App.tsx, providers.tsx)
│   ├── features/ (request-workbench/, collections/, environments/, ...)
│   └── shared/ (api/, ui/, types/, utils/)
├── scripts/ (dev.py)
└── tests/
```

## 八、界面设计
深色模式背景 #0F172A、面板 #1E293B、边框 #334155、主色 #38BDF8
浅色模式背景 #F8FAFC、面板 #FFFFFF、主色 #0284C7
所有按钮有 hover、发送按钮突出、请求方法不同颜色、状态码颜色清晰

## 九至十四、开发阶段、测试、验收标准
(详见 lingxi-api-master-plan.md 中的完整阶段映射)
