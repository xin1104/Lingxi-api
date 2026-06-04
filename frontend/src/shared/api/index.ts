// API 调用封装

import { ApiResponse, ApiRequest, ApiResponseData, Collection, RequestItem, Environment, HistoryRecord, MockRoute, AppSettings, CodegenResult, CaptureRecord, ImportResult } from '@/shared/types'

const BASE_URL = '/api'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  return response.json()
}

// ===== 健康检查 =====
export async function healthCheck() {
  return fetchApi<{ status: string; message: string }>('/health')
}

// ===== 请求发送 =====
export async function sendRequest(request: ApiRequest & { variables?: Record<string, string>; pre_script?: string; test_script?: string }) {
  return fetchApi<ApiResponseData>('/send-request', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ===== 集合管理 =====
export async function getCollections() {
  return fetchApi<Collection[]>('/collections')
}

export async function createCollection(name: string, description?: string) {
  return fetchApi<Collection>('/collections', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function updateCollection(id: number, data: { name?: string; description?: string }) {
  return fetchApi<Collection>(`/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCollection(id: number) {
  return fetchApi<void>(`/collections/${id}`, {
    method: 'DELETE',
  })
}

// ===== 请求项管理 =====
export async function getCollectionRequests(collectionId: number) {
  return fetchApi<RequestItem[]>(`/collections/${collectionId}/requests`)
}

export async function getRequest(id: number) {
  return fetchApi<RequestItem>(`/requests/${id}`)
}

export async function createRequest(data: any) {
  return fetchApi<RequestItem>('/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRequest(id: number, data: any) {
  return fetchApi<RequestItem>(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteRequest(id: number) {
  return fetchApi<void>(`/requests/${id}`, {
    method: 'DELETE',
  })
}

// ===== 环境管理 =====
export async function getEnvironments() {
  return fetchApi<Environment[]>('/environments')
}

export async function createEnvironment(name: string, variables?: any[]) {
  return fetchApi<Environment>('/environments', {
    method: 'POST',
    body: JSON.stringify({ name, variables }),
  })
}

export async function updateEnvironment(id: number, data: { name?: string }) {
  return fetchApi<Environment>(`/environments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteEnvironment(id: number) {
  return fetchApi<void>(`/environments/${id}`, {
    method: 'DELETE',
  })
}

export async function setCurrentEnvironment(environmentId: number) {
  return fetchApi<void>('/environments/current', {
    method: 'POST',
    body: JSON.stringify({ environment_id: environmentId }),
  })
}

export async function createVariable(envId: number, data: any) {
  return fetchApi<any>(`/environments/${envId}/variables`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVariable(id: number, data: any) {
  return fetchApi<any>(`/variables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteVariable(id: number) {
  return fetchApi<void>(`/variables/${id}`, {
    method: 'DELETE',
  })
}

export async function getCurrentVariables() {
  return fetchApi<Record<string, string>>('/variables/current')
}

// ===== 历史记录 =====
export async function getHistory(params?: { limit?: number; offset?: number; method?: string; status_code?: number; keyword?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.method) searchParams.set('method', params.method)
  if (params?.status_code) searchParams.set('status_code', params.status_code.toString())
  if (params?.keyword) searchParams.set('keyword', params.keyword)

  const query = searchParams.toString()
  return fetchApi<{ records: HistoryRecord[]; total: number }>(`/history${query ? `?${query}` : ''}`)
}

export async function getHistoryRecord(id: number) {
  return fetchApi<HistoryRecord>(`/history/${id}`)
}

export async function deleteHistoryRecord(id: number) {
  return fetchApi<void>(`/history/${id}`, {
    method: 'DELETE',
  })
}

export async function clearHistory() {
  return fetchApi<void>('/history', {
    method: 'DELETE',
  })
}

// ===== Mock 服务 =====
export async function getMockRoutes() {
  return fetchApi<MockRoute[]>('/mock/routes')
}

export async function createMockRoute(data: any) {
  return fetchApi<MockRoute>('/mock/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMockRoute(id: number, data: any) {
  return fetchApi<MockRoute>(`/mock/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMockRoute(id: number) {
  return fetchApi<void>(`/mock/routes/${id}`, {
    method: 'DELETE',
  })
}

export async function startMockServer(port?: number) {
  return fetchApi<{ status: string; address: string; port: number }>('/mock/start', {
    method: 'POST',
    body: JSON.stringify({ port: port || 4567 }),
  })
}

export async function stopMockServer() {
  return fetchApi<void>('/mock/stop', {
    method: 'POST',
  })
}

export async function getMockStatus() {
  return fetchApi<{ running: boolean; logs_count: number }>('/mock/status')
}

export async function getMockLogs(limit?: number) {
  return fetchApi<any[]>(`/mock/logs${limit ? `?limit=${limit}` : ''}`)
}

// ===== 导入导出 =====
export async function importCurl(curlCommand: string) {
  return fetchApi<any>('/import/curl', {
    method: 'POST',
    body: JSON.stringify({ curl_command: curlCommand }),
  })
}

export async function importPostman(data: any) {
  return fetchApi<ImportResult>('/import/postman', {
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

export async function importOpenApi(data: any) {
  return fetchApi<ImportResult>('/import/openapi', {
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

export async function exportCurl(request: ApiRequest) {
  return fetchApi<string>('/export/curl', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function exportPostman(collectionId: number) {
  return fetchApi<any>('/export/postman', {
    method: 'POST',
    body: JSON.stringify({ collection_id: collectionId }),
  })
}

export async function exportBackup() {
  return fetchApi<any>('/export/backup')
}

// ===== 代码生成 =====
export async function generateCode(request: ApiRequest & { language: string }) {
  return fetchApi<CodegenResult>('/codegen', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ===== 捕获记录 =====
export async function getCaptureRecords(limit?: number) {
  return fetchApi<CaptureRecord[]>(`/capture/records${limit ? `?limit=${limit}` : ''}`)
}

export async function clearCaptureRecords() {
  return fetchApi<void>('/capture/records', {
    method: 'DELETE',
  })
}

// ===== 设置 =====
export async function getSettings() {
  return fetchApi<AppSettings & { db_path?: string }>('/settings')
}

export async function updateSettings(data: Partial<AppSettings>) {
  return fetchApi<AppSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function clearAllData() {
  return fetchApi<void>('/settings/clear-data', {
    method: 'POST',
  })
}

// ===== Cookie Jar =====
export async function getCookies() {
  return fetchApi<any[]>('/cookie-jar')
}

export async function getCookieJarStatus() {
  return fetchApi<{ enabled: boolean; count: number }>('/cookie-jar/status')
}

export async function deleteCookie(id: number) {
  return fetchApi<void>(`/cookie-jar/${id}`, { method: 'DELETE' })
}

export async function clearCookies() {
  return fetchApi<void>('/cookie-jar', { method: 'DELETE' })
}

// ===== HTTP 代理 =====
export async function getProxyStatus() {
  return fetchApi<import('@/shared/types').ProxyStatus>('/proxy/status')
}

export async function startProxy() {
  return fetchApi<{ running: boolean; address: string }>('/proxy/start', { method: 'POST' })
}

export async function stopProxy() {
  return fetchApi<void>('/proxy/stop', { method: 'POST' })
}

export async function getProxyLogs(params?: {
  limit?: number; offset?: number; source?: string; method?: string;
  host?: string; status_code?: number; keyword?: string; is_https_connect?: boolean;
}) {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.source) searchParams.set('source', params.source)
  if (params?.method) searchParams.set('method', params.method)
  if (params?.host) searchParams.set('host', params.host)
  if (params?.status_code) searchParams.set('status_code', params.status_code.toString())
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  if (params?.is_https_connect !== undefined) searchParams.set('is_https_connect', params.is_https_connect.toString())

  const query = searchParams.toString()
  return fetchApi<{ logs: import('@/shared/types').ProxyLog[]; total: number }>(
    `/proxy/logs${query ? `?${query}` : ''}`
  )
}

export async function clearProxyLogs() {
  return fetchApi<void>('/proxy/logs', { method: 'DELETE' })
}
