// Tests DSL 运行器测试

import { describe, it, expect } from 'vitest'
import { runTests, TestCase } from '@/shared/utils/testRunner'

const createContext = () => ({
  response: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: '{"ok":true}',
    json: () => ({ ok: true }),
    time: 150,
  },
  request: {
    method: 'GET',
    url: 'http://example.com/api',
  },
})

describe('Tests DSL 运行器', () => {
  it('空脚本应返回空结果', () => {
    const results = runTests('', createContext())
    expect(results).toEqual([])
  })

  it('空/whitespace 脚本应返回空结果', () => {
    const results = runTests('   ', createContext())
    expect(results).toEqual([])
  })

  it('pm.test 应执行并返回通过', () => {
    const script = 'pm.test("状态码为 200", () => { pm.assert.equal(pm.response.status, 200) })'
    const results = runTests(script, createContext())
    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(true)
    expect(results[0].name).toBe('状态码为 200')
  })

  it('pm.test 断言失败应返回失败', () => {
    const script = 'pm.test("状态码为 201", () => { pm.assert.equal(pm.response.status, 201) })'
    const results = runTests(script, createContext())
    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(false)
  })

  it('pm.assert.ok 真值应通过', () => {
    const script = 'pm.test("body 不为空", () => { pm.assert.ok(pm.response.body) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(true)
  })

  it('pm.assert.ok 假值应失败', () => {
    const script = 'pm.test("空检查", () => { pm.assert.ok(undefined) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(false)
  })

  it('pm.assert.contains 应通过', () => {
    const script = 'pm.test("包含 ok", () => { pm.assert.contains(pm.response.body, "ok") })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(true)
  })

  it('pm.assert.contains 不包含应失败', () => {
    const script = 'pm.test("包含 notfound", () => { pm.assert.contains(pm.response.body, "notfound") })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(false)
  })

  it('pm.assert.gt 应通过', () => {
    const script = 'pm.test("时间 > 100", () => { pm.assert.gt(pm.response.time, 100) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(true)
  })

  it('pm.assert.gt 应失败', () => {
    const script = 'pm.test("时间 > 200", () => { pm.assert.gt(pm.response.time, 200) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(false)
  })

  it('pm.assert.lt 应通过', () => {
    const script = 'pm.test("时间 < 200", () => { pm.assert.lt(pm.response.time, 200) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(true)
  })

  it('pm.assert.lt 应失败', () => {
    const script = 'pm.test("时间 < 100", () => { pm.assert.lt(pm.response.time, 100) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(false)
  })

  it('多个测试应全部执行', () => {
    const script = `
      pm.test("test1", () => { pm.assert.equal(1, 1) })
      pm.test("test2", () => { pm.assert.equal(2, 2) })
      pm.test("test3", () => { pm.assert.equal(1, 2) })
    `
    const results = runTests(script, createContext())
    expect(results).toHaveLength(3)
    expect(results.filter((r: TestCase) => r.passed)).toHaveLength(2)
    expect(results.filter((r: TestCase) => !r.passed)).toHaveLength(1)
  })

  it('语法错误应捕获并返回失败', () => {
    const script = 'pm.test("broken", () => { this.is.broken })'
    const results = runTests(script, createContext())
    expect(results.length).toBeGreaterThan(0)
  })

  it('pm.response.json() 应返回解析后的 JSON', () => {
    const script = 'pm.test("json", () => { pm.assert.equal(pm.response.json().ok, true) })'
    const results = runTests(script, createContext())
    expect(results[0].passed).toBe(true)
  })

  it('自定义错误消息应在失败时显示', () => {
    const script = 'pm.test("custom msg", () => { pm.assert.equal(1, 2, "值不相等") })'
    const results = runTests(script, createContext())
    expect(results[0].message).toContain('值不相等')
  })
})
