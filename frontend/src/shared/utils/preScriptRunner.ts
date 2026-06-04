// Pre Script 运行器 — 请求发送前执行脚本

// Pre Script DSL 支持:
//   pm.setHeader(key, value)   — 设置请求头
//   pm.removeHeader(key)       — 删除请求头
//   pm.setEnv(key, value)      — 设置环境变量
//   pm.setParam(key, value)    — 设置 URL 参数
//   pm.setBody(json)           — 覆盖请求体（JSON）
//   console.log(...)           — 记录日志

interface PreScriptChange {
  action: 'set' | 'remove'
  key?: string
  value?: string
}

interface LogEntry {
  level: string
  message: string
}

interface PreScriptResult {
  success: boolean
  error?: string
  headerChanges: PreScriptChange[]
  paramChanges: PreScriptChange[]
  envChanges: Record<string, string>
  bodyOverride?: any
  logs: string[]
}

export function runPreScript(
  script: string,
  variables: Record<string, string>,
): PreScriptResult {
  const headerChanges: PreScriptChange[] = []
  const paramChanges: PreScriptChange[] = []
  const envChanges: Record<string, string> = {}
  const logs: string[] = []
  let bodyOverride: any = undefined

  if (!script || !script.trim()) {
    return {
      success: true,
      headerChanges: [],
      paramChanges: [],
      envChanges: {},
      logs: [],
    }
  }

  const pm = {
    setHeader(key: string, value: string) {
      headerChanges.push({ action: 'set', key, value })
      logs.push(`[pm] setHeader("${key}", "${value}")`)
    },
    removeHeader(key: string) {
      headerChanges.push({ action: 'remove', key })
      logs.push(`[pm] removeHeader("${key}")`)
    },
    setEnv(key: string, value: string) {
      envChanges[key] = value
      logs.push(`[pm] setEnv("${key}", "${value}")`)
    },
    setParam(key: string, value: string) {
      paramChanges.push({ action: 'set', key, value })
      logs.push(`[pm] setParam("${key}", "${value}")`)
    },
    removeParam(key: string) {
      paramChanges.push({ action: 'remove', key })
      logs.push(`[pm] removeParam("${key}")`)
    },
    setBody(body: any) {
      bodyOverride = body
      logs.push(`[pm] setBody(${JSON.stringify(body)})`)
    },
  }

  const mockConsole = {
    log: (...args: any[]) => {
      logs.push(`[log] ${args.map(String).join(' ')}`)
    },
    info: (...args: any[]) => {
      logs.push(`[info] ${args.map(String).join(' ')}`)
    },
    warn: (...args: any[]) => {
      logs.push(`[warn] ${args.map(String).join(' ')}`)
    },
    error: (...args: any[]) => {
      logs.push(`[error] ${args.map(String).join(' ')}`)
    },
  }

  try {
    const fn = new Function('pm', 'console', 'variables', script)
    fn(pm, mockConsole, variables)

    return {
      success: true,
      headerChanges,
      paramChanges,
      envChanges,
      bodyOverride,
      logs,
    }
  } catch (e: any) {
    logs.push(`[error] Pre Script 执行异常: ${e.message}`)
    return {
      success: false,
      error: e.message,
      headerChanges,
      paramChanges,
      envChanges,
      bodyOverride,
      logs,
    }
  }
}
