# 灵犀 API Client — 项目总体开发计划

## 项目基本信息

- **产品名**: 灵犀 API Client
- **定位**: 中文综合 API 调试软件，本地优先、中文友好、功能完整、可开源、可离线使用
- **目标用户**: 后端开发者、AI 应用工程师、接口调试用户
- **非目标**: 登录注册、云端同步、团队空间、成员权限、企业审计、HTTPS MITM 解密
- **技术栈**: 后端 Python FastAPI + SQLite，前端 React + TypeScript + Vite + Monaco Editor
- **GitHub**: xin1104/Lingxi-api
- **项目路径**: `/vol1/@appshare/trim.openclaw/data/workspace/Lingxi-api/`

---

## 开发阶段

### 阶段 1：基础壳子 ✅ (v0.1.0)
- FastAPI 后端可启动
- React 前端可启动
- GET /api/health 联通
- 三栏布局 + 深色主题
- 左侧导航 + 请求编辑器 + 响应区

### 阶段 2：真实 HTTP 请求 ✅ (v0.2.0)
- Python 后端 httpx 发送请求
- GET/POST + headers/params/JSON body
- 响应状态、耗时、body、headers
- JSON 格式化
- Monaco Editor 集成
- Cookies 面板

### 阶段 3：集合、环境变量、历史 ✅ (v0.2.0 - v0.3.0)
- SQLite 存储
- 集合管理 (CRUD)
- 环境变量 + {{}} 替换
- 自动保存历史
- Pre Script 执行 (DSL)
- Cookie Jar 管理
- 请求回放

### 阶段 4：导入导出和代码生成 ✅ (v0.2.0 - v0.3.0)
- cURL 导入
- cURL 导出
- 代码生成 (Python/JS/Go)
- 集合导出 JSON

### 阶段 5：脚本测试 ⚠️ (v0.3.0 部分)
- ✅ Pre Script DSL 基础实现
- ✅ Tests 基础实现 (断言 status/JSON)
- ❌ 完整脚本编辑器 (Monaco 中的 Pre/Tests 编辑)

### 阶段 6：Mock 和捕获 ⚠️ (v0.3.0 - v0.4.0 部分)
- ✅ Cookie Jar 管理
- ✅ HTTP 代理抓包（基础）
- ✅ 请求捕获页面
- ❌ Mock Server（路由存在但需验证完整性）
- ❌ 完整外部代理支持

### 阶段 7：整体打磨 🔄
- ✅ Toast 通知系统 (v0.4.0)
- ✅ Monaco 中文语言包 (v0.4.0)
- ✅ E2E CI (v0.4.0)
- ✅ 快捷键提示栏 (v0.4.0)
- ⬜ UI 全面优化
- ⬜ 示例数据
- ⬜ 桌面打包 (pywebview/PyInstaller)
- ⬜ 完整测试覆盖

---

## 下一版本规划: v0.5.0 (待爱因斯坦制定详细方案)

候选功能方向:
1. Mock Server 完整实现
2. 脚本系统加强 (Pre Script + Tests 完整编辑器)
3. 阶段 5 遗留项补完
4. 阶段 6 遗留项补完 (Mock 完成 + 外部代理增强)
5. 桌面打包探索
