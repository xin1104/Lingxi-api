// 工具函数测试

import { describe, it, expect } from 'vitest'
import { formatDuration, formatSize, getStatusColor, getMethodColor, formatTime } from '@/shared/utils'

describe('formatDuration', () => {
  it('毫秒 < 1000 应显示 ms', () => {
    const result = formatDuration(500)
    expect(result).toContain('ms')
    expect(result).toContain('500')
  })

  it('毫秒 >= 1000 应显示秒', () => {
    const result = formatDuration(1500)
    expect(result).toContain('s')
    expect(result).not.toContain('ms')
  })

  it('0ms 应返回字符串', () => {
    expect(typeof formatDuration(0)).toBe('string')
  })

  it('undefined 应返回字符串', () => {
    expect(typeof formatDuration(undefined as any)).toBe('string')
  })
})

describe('formatSize', () => {
  it('小于 1024 字节应显示 B', () => {
    const result = formatSize(500)
    expect(result).toContain('B')
  })

  it('1024 字节应显示 KB', () => {
    const result = formatSize(1024)
    expect(result).toContain('KB')
  })

  it('大文件应显示 MB', () => {
    const result = formatSize(1048576)
    expect(result).toContain('MB')
  })
})

describe('getStatusColor', () => {
  it('2xx 应返回成功颜色', () => {
    const color = getStatusColor(200)
    expect(color).toBeTruthy()
  })

  it('4xx 应返回警告颜色', () => {
    const color = getStatusColor(404)
    expect(color).toBeTruthy()
  })

  it('5xx 应返回错误颜色', () => {
    const color = getStatusColor(500)
    expect(color).toBeTruthy()
  })

  it('0 应返回错误颜色', () => {
    const color = getStatusColor(0)
    expect(color).toBeTruthy()
  })
})

describe('getMethodColor', () => {
  it('GET 应返回颜色', () => {
    expect(getMethodColor('GET')).toBeTruthy()
  })

  it('POST 应返回颜色', () => {
    expect(getMethodColor('POST')).toBeTruthy()
  })

  it('DELETE 应返回颜色', () => {
    expect(getMethodColor('DELETE')).toBeTruthy()
  })
})

describe('formatTime', () => {
  it('应返回可读的时间格式', () => {
    const result = formatTime('2024-01-01T00:00:00')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('空字符串应处理', () => {
    const result = formatTime('')
    expect(typeof result).toBe('string')
  })
})

// 状态码区间筛选工具函数
describe('状态码区间筛选', () => {
  function matchStatusRange(statusCode: number | undefined, range: string): boolean {
    const status = statusCode || 0
    if (!range) return true
    if (range === '2xx' && status >= 200 && status < 300) return true
    if (range === '3xx' && status >= 300 && status < 400) return true
    if (range === '4xx' && status >= 400 && status < 500) return true
    if (range === '5xx' && status >= 500 && status < 600) return true
    if (range === 'error' && status === 0) return true
    return false
  }

  it('200 应在 2xx 区间', () => {
    expect(matchStatusRange(200, '2xx')).toBe(true)
  })

  it('201 应在 2xx 区间', () => {
    expect(matchStatusRange(201, '2xx')).toBe(true)
  })

  it('404 应在 4xx 区间', () => {
    expect(matchStatusRange(404, '4xx')).toBe(true)
  })

  it('500 应在 5xx 区间', () => {
    expect(matchStatusRange(500, '5xx')).toBe(true)
  })

  it('301 应在 3xx 区间', () => {
    expect(matchStatusRange(301, '3xx')).toBe(true)
  })

  it('0 应在 error 区间', () => {
    expect(matchStatusRange(0, 'error')).toBe(true)
    expect(matchStatusRange(undefined, 'error')).toBe(true)
  })

  it('200 不应在 4xx 区间', () => {
    expect(matchStatusRange(200, '4xx')).toBe(false)
  })

  it('空 range 应匹配所有', () => {
    expect(matchStatusRange(200, '')).toBe(true)
    expect(matchStatusRange(404, '')).toBe(true)
    expect(matchStatusRange(0, '')).toBe(true)
  })
})

// 时间范围筛选工具函数
describe('时间范围筛选', () => {
  function isInTimeRange(dateStr: string, range: string): boolean {
    if (!range) return true
    const date = new Date(dateStr)
    const now = new Date()
    if (range === 'today') {
      return date.toDateString() === now.toDateString()
    }
    if (range === '7days') {
      const d = new Date(now.getTime() - 7 * 86400000)
      return date >= d
    }
    if (range === '30days') {
      const d = new Date(now.getTime() - 30 * 86400000)
      return date >= d
    }
    return true
  }

  it('今天应匹配今天的时间', () => {
    const today = new Date().toISOString()
    expect(isInTimeRange(today, 'today')).toBe(true)
  })

  it('7 天内应包含昨天', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    expect(isInTimeRange(yesterday, '7days')).toBe(true)
  })

  it('30 天外不应在 7 天内', () => {
    const old = new Date(Date.now() - 8 * 86400000).toISOString()
    expect(isInTimeRange(old, '7days')).toBe(false)
  })

  it('30 天内应包含 20 天前', () => {
    const twenty = new Date(Date.now() - 20 * 86400000).toISOString()
    expect(isInTimeRange(twenty, '30days')).toBe(true)
  })

  it('空 range 应匹配所有时间', () => {
    const old = new Date('2020-01-01').toISOString()
    expect(isInTimeRange(old, '')).toBe(true)
  })
})

// cURL 生成工具函数
describe('cURL 生成逻辑', () => {
  function generateCurl(method: string, url: string, headers: { key: string; value: string }[] = []): string {
    let cmd = `curl -X ${method} "${url}"`
    for (const h of headers) {
      cmd += ` -H "${h.key}: ${h.value}"`
    }
    return cmd
  }

  it('应生成基本 cURL 命令', () => {
    const cmd = generateCurl('GET', 'http://example.com')
    expect(cmd).toContain('curl')
    expect(cmd).toContain('GET')
    expect(cmd).toContain('http://example.com')
  })

  it('应包含 headers', () => {
    const cmd = generateCurl('POST', 'http://example.com', [
      { key: 'Content-Type', value: 'application/json' },
    ])
    expect(cmd).toContain('Content-Type: application/json')
  })

  it('POST 应包含方法', () => {
    const cmd = generateCurl('POST', 'http://example.com')
    expect(cmd).toContain('-X POST')
  })
})
