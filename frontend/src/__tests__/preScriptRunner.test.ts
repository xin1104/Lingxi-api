// Pre Script 运行器测试

import { describe, it, expect } from 'vitest'
import { runPreScript } from '@/shared/utils/preScriptRunner'

describe('Pre Script 运行器', () => {
  it('空脚本应返回 success', () => {
    const result = runPreScript('', {})
    expect(result.success).toBe(true)
    expect(result.headerChanges).toHaveLength(0)
  })

  it('pm.setHeader 应记录到 headerChanges', () => {
    const script = 'pm.setHeader("X-Custom", "value")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.headerChanges).toHaveLength(1)
    expect(result.headerChanges[0]).toEqual({
      action: 'set',
      key: 'X-Custom',
      value: 'value',
    })
  })

  it('pm.removeHeader 应记录到 headerChanges', () => {
    const script = 'pm.removeHeader("X-Unwanted")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.headerChanges).toHaveLength(1)
    expect(result.headerChanges[0]).toEqual({
      action: 'remove',
      key: 'X-Unwanted',
    })
  })

  it('pm.setEnv 应记录到 envChanges', () => {
    const script = 'pm.setEnv("API_KEY", "secret123")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.envChanges).toEqual({ API_KEY: 'secret123' })
  })

  it('pm.setParam 应记录到 paramChanges', () => {
    const script = 'pm.setParam("page", "1")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.paramChanges).toHaveLength(1)
    expect(result.paramChanges[0]).toEqual({
      action: 'set',
      key: 'page',
      value: '1',
    })
  })

  it('pm.removeParam 应记录到 paramChanges', () => {
    const script = 'pm.removeParam("page")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.paramChanges[0]).toEqual({
      action: 'remove',
      key: 'page',
    })
  })

  it('pm.setBody 应设置 bodyOverride', () => {
    const script = 'pm.setBody({ "name": "test" })'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.bodyOverride).toEqual({ name: 'test' })
  })

  it('console.log 应记录日志', () => {
    const script = 'console.log("hello world")'
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.logs).toContain('[log] hello world')
  })

  it('console.warn 应记录警告', () => {
    const script = 'console.warn("warning message")'
    const result = runPreScript(script, {})
    expect(result.logs).toContain('[warn] warning message')
  })

  it('console.error 应记录错误', () => {
    const script = 'console.error("error message")'
    const result = runPreScript(script, {})
    expect(result.logs).toContain('[error] error message')
  })

  it('多个操作应全部记录', () => {
    const script = `
      pm.setHeader("X-1", "v1")
      pm.setHeader("X-2", "v2")
      pm.setEnv("k1", "v1")
      console.log("done")
    `
    const result = runPreScript(script, {})
    expect(result.success).toBe(true)
    expect(result.headerChanges).toHaveLength(2)
    expect(Object.keys(result.envChanges)).toHaveLength(1)
    expect(result.logs.length).toBeGreaterThan(0)
  })

  it('语法错误应返回 success: false', () => {
    const script = 'this.will.throw.error'
    const result = runPreScript(script, {})
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('可以读取 variables 参数', () => {
    const script = 'pm.setHeader("X-Token", variables.token)'
    const result = runPreScript(script, { token: 'abc' })
    expect(result.headerChanges[0].value).toBe('abc')
  })
})
