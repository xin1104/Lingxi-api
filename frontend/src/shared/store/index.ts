// Zustand 状态管理

import { create } from 'zustand'
import {
  ApiRequest,
  ApiResponseData,
  RequestParam,
  RequestHeader,
  AuthConfig,
  RequestBody,
  Collection,
  RequestItem,
  Environment,
  HistoryRecord,
  MockRoute,
  AppSettings,
  HttpMethod,
} from '@/shared/types'
import * as api from '@/shared/api'

interface AppState {
  // 请求编辑器状态
  currentRequest: ApiRequest
  response: ApiResponseData | null
  preScriptResult: any
  isLoading: boolean
  variables: Record<string, string>

  // 集合
  collections: Collection[]
  collectionRequests: Record<number, RequestItem[]>

  // 环境
  environments: Environment[]
  currentEnvironment: Environment | null

  // 历史
  historyRecords: HistoryRecord[]

  // Mock
  mockRoutes: MockRoute[]
  mockRunning: boolean

  // 设置
  settings: AppSettings | null

  // 当前活动的侧边栏
  activeSidebar: 'collections' | 'environments' | 'history' | 'mock' | 'import-export' | 'capture' | 'settings'

  // 请求方法
  setMethod: (method: HttpMethod) => void
  setUrl: (url: string) => void
  setParams: (params: RequestParam[]) => void
  setHeaders: (headers: RequestHeader[]) => void
  setAuth: (auth: AuthConfig) => void
  setBody: (body: RequestBody) => void
  setTimeout: (timeout: number) => void

  // 发送请求
  sendCurrentRequest: () => Promise<void>

  // 集合操作
  loadCollections: () => Promise<void>
  loadCollectionRequests: (collectionId: number) => Promise<void>
  createCollection: (name: string, description?: string) => Promise<void>
  deleteCollection: (id: number) => Promise<void>

  // 环境操作
  loadEnvironments: () => Promise<void>
  switchEnvironment: (id: number) => Promise<void>
  loadCurrentVariables: () => Promise<void>

  // 历史操作
  loadHistory: () => Promise<void>
  clearHistory: () => Promise<void>

  // Mock 操作
  loadMockRoutes: () => Promise<void>
  toggleMockServer: () => Promise<void>

  // 设置操作
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>

  // 侧边栏
  setActiveSidebar: (sidebar: AppState['activeSidebar']) => void

  // 加载请求
  loadRequest: (request: RequestItem) => void

  // 保存请求到集合
  saveRequestToCollection: (collectionId: number, name: string) => Promise<void>
}

const defaultRequest: ApiRequest = {
  method: 'GET',
  url: '',
  params: [],
  headers: [],
  auth: {
    type: 'none',
    token: '',
    username: '',
    password: '',
    api_key: '',
    api_key_header: 'Authorization',
    custom_header: '',
    custom_value: '',
  },
  body: {
    type: 'none',
    raw: '',
    json_data: null,
    form_data: [],
    urlencoded: [],
    binary_path: '',
  },
  timeout: 30,
  preScript: '',
  testScript: '',
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRequest: { ...defaultRequest },
  response: null,
  isLoading: false,
  variables: {},
  collections: [],
  collectionRequests: {},
  environments: [],
  currentEnvironment: null,
  historyRecords: [],
  mockRoutes: [],
  mockRunning: false,
  settings: null,
  activeSidebar: 'collections',

  setMethod: (method) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, method },
    })),

  setUrl: (url) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, url },
    })),

  setParams: (params) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, params },
    })),

  setHeaders: (headers) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, headers },
    })),

  setAuth: (auth) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, auth },
    })),

  setBody: (body) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, body },
    })),

  setTimeout: (timeout) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, timeout },
    })),

  preScriptResult: null as any,
  sendCurrentRequest: async () => {
    const { currentRequest, variables } = get()

    set({ isLoading: true, response: null })

    try {
      const result = await api.sendRequest({
        ...currentRequest,
        variables: variables || {},
        pre_script: currentRequest.preScript || '',
        test_script: currentRequest.testScript || '',
      })

      if (result.success) {
        set({ response: result.data, isLoading: false })
      } else {
        set({
          response: {
            status_code: 0,
            headers: {},
            body: '',
            body_size: 0,
            duration: 0,
            content_type: '',
            error: result.message,
            is_binary: false,
          },
          isLoading: false,
        })
      }

      // 自动保存历史
      const { settings } = get()
      if (settings?.auto_save_history !== false) {
        await api.getHistory()
        get().loadHistory()
      }
    } catch (error: any) {
      set({
        response: {
          status_code: 0,
          headers: {},
          body: '',
          body_size: 0,
          duration: 0,
          content_type: '',
          error: error.message || '请求失败',
          is_binary: false,
        },
        isLoading: false,
      })
    }
  },

  loadCollections: async () => {
    const result = await api.getCollections()
    if (result.success) {
      set({ collections: result.data })
    }
  },

  loadCollectionRequests: async (collectionId) => {
    const result = await api.getCollectionRequests(collectionId)
    if (result.success) {
      set((state) => ({
        collectionRequests: {
          ...state.collectionRequests,
          [collectionId]: result.data,
        },
      }))
    }
  },

  createCollection: async (name, description) => {
    const result = await api.createCollection(name, description)
    if (result.success) {
      get().loadCollections()
    }
  },

  deleteCollection: async (id) => {
    const result = await api.deleteCollection(id)
    if (result.success) {
      get().loadCollections()
    }
  },

  loadEnvironments: async () => {
    const result = await api.getEnvironments()
    if (result.success) {
      const envs = result.data
      const current = envs.find((e) => e.is_current) || null
      set({ environments: envs, currentEnvironment: current })
    }
  },

  switchEnvironment: async (id) => {
    const result = await api.setCurrentEnvironment(id)
    if (result.success) {
      get().loadEnvironments()
      get().loadCurrentVariables()
    }
  },

  loadCurrentVariables: async () => {
    const result = await api.getCurrentVariables()
    if (result.success) {
      set({ variables: result.data })
    }
  },

  loadHistory: async () => {
    const result = await api.getHistory({ limit: 100 })
    if (result.success) {
      set({ historyRecords: result.data.records })
    }
  },

  clearHistory: async () => {
    const result = await api.clearHistory()
    if (result.success) {
      set({ historyRecords: [] })
    }
  },

  loadMockRoutes: async () => {
    const result = await api.getMockRoutes()
    if (result.success) {
      set({ mockRoutes: result.data })
    }
    const statusResult = await api.getMockStatus()
    if (statusResult.success) {
      set({ mockRunning: statusResult.data.running })
    }
  },

  toggleMockServer: async () => {
    const { mockRunning, settings } = get()
    if (mockRunning) {
      await api.stopMockServer()
    } else {
      await api.startMockServer(settings?.mock_port || 4567)
    }
    get().loadMockRoutes()
  },

  loadSettings: async () => {
    const result = await api.getSettings()
    if (result.success) {
      set({ settings: result.data })
    }
  },

  updateSettings: async (newSettings) => {
    const result = await api.updateSettings(newSettings)
    if (result.success) {
      set({ settings: result.data })
    }
  },

  setActiveSidebar: (sidebar) => set({ activeSidebar: sidebar }),

  loadRequest: (request) => {
    set({
      currentRequest: {
        method: request.method as HttpMethod,
        url: request.url,
        params: request.params || [],
        headers: request.headers || [],
        auth: request.auth || defaultRequest.auth,
        body: request.body || defaultRequest.body,
        timeout: 30,
        preScript: request.pre_script || '',
        testScript: request.test_script || '',
      },
    })
  },

  saveRequestToCollection: async (collectionId, name) => {
    const { currentRequest } = get()
    const result = await api.createRequest({
      name,
      method: currentRequest.method,
      url: currentRequest.url,
      params: currentRequest.params,
      headers: currentRequest.headers,
      auth: currentRequest.auth,
      body_type: currentRequest.body.type,
      body: currentRequest.body,
      collection_id: collectionId,
      pre_script: currentRequest.preScript || '',
      test_script: currentRequest.testScript || '',
    })
    if (result.success) {
      get().loadCollectionRequests(collectionId)
    }
  },
}))
