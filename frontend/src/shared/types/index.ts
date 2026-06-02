// 灵犀 API Client 类型定义

// ===== 通用 =====
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

// ===== 请求相关 =====
export interface RequestParam {
  key: string
  value: string
  enabled: boolean
  description?: string
}

export interface RequestHeader {
  key: string
  value: string
  enabled: boolean
  description?: string
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api_key' | 'custom'
  token: string
  username: string
  password: string
  api_key: string
  api_key_header: string
  custom_header: string
  custom_value: string
}

export interface RequestBody {
  type: 'none' | 'raw' | 'json' | 'form_data' | 'urlencoded' | 'binary'
  raw: string
  json_data: any
  form_data: RequestParam[]
  urlencoded: RequestParam[]
  binary_path: string
}

export interface ApiRequest {
  method: HttpMethod
  url: string
  params: RequestParam[]
  headers: RequestHeader[]
  auth: AuthConfig
  body: RequestBody
  timeout: number
}

export interface ApiResponseData {
  status_code: number
  headers: Record<string, string>
  body: string
  body_size: number
  duration: number
  content_type: string
  error?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

// ===== 集合相关 =====
export interface Collection {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: number
  name: string
  collection_id: number
  parent_id?: number
  created_at: string
}

export interface RequestItem {
  id: number
  name: string
  method: HttpMethod
  url: string
  params: RequestParam[]
  headers: RequestHeader[]
  auth: AuthConfig
  body_type: string
  body: RequestBody
  pre_script: string
  test_script: string
  collection_id?: number
  folder_id?: number
  sort_order: number
  created_at: string
  updated_at: string
}

// ===== 环境相关 =====
export interface Environment {
  id: number
  name: string
  is_current: boolean
  variables: VariableItem[]
  created_at: string
}

export interface VariableItem {
  id: number
  key: string
  value: string
  enabled: boolean
  description: string
  environment_id?: number
  is_global: boolean
  created_at: string
}

// ===== 历史相关 =====
export interface HistoryRecord {
  id: number
  method: string
  url: string
  status_code?: number
  duration?: number
  size?: number
  request_snapshot: any
  response_summary?: string
  error_message?: string
  created_at: string
}

// ===== Mock 相关 =====
export interface MockRoute {
  id: number
  method: string
  path: string
  status_code: number
  headers: Record<string, string>
  body: string
  enabled: boolean
  created_at: string
}

export interface MockLog {
  route_id?: number
  method: string
  path: string
  matched: boolean
  timestamp: string
}

// ===== 测试相关 =====
export interface TestResult {
  passed: boolean
  message: string
  expected?: any
  actual?: any
}

// ===== 设置 =====
export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  default_timeout: number
  history_limit: number
  auto_format_json: boolean
  auto_save_history: boolean
  mock_port: number
  proxy_type: 'none' | 'system' | 'custom'
  proxy_url: string
}

// ===== 代码生成 =====
export interface CodegenResult {
  language: string
  code: string
}

// ===== 导入导出 =====
export interface ImportResult {
  collection_id?: number
  imported_count: number
}

// ===== 捕获记录 =====
export interface CaptureRecord {
  id: number
  method: string
  url: string
  status_code?: number
  duration?: number
  request_headers: Record<string, string>
  response_headers: Record<string, string>
  created_at: string
}
