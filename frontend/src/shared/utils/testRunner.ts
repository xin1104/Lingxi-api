// Tests DSL 运行器 — 响应返回后执行测试断言

// 测试 DSL 支持:
//   pm.test("name", () => { ... })
//   pm.response.status         — 状态码
//   pm.response.headers        — 响应头
//   pm.response.body           — 响应体字符串
//   pm.response.json()         — JSON 解析
//   pm.response.time           — 响应时间 (ms)
//   pm.assert.equal(a, b)      — 断言相等
//   pm.assert.ok(value)        — 断言真值
//   pm.assert.contains(a, b)   — 断言包含
//   pm.assert.gt(a, b)         — 断言大于
//   pm.assert.lt(a, b)         — 断言小于

export interface TestCase {
  name: string
  passed: boolean
  message: string
  expected?: any
  actual?: any
  duration?: number
}

export interface TestContext {
  response: {
    status: number
    headers: Record<string, string>
    body: string
    json(): any
    time: number
  }
  request: {
    method: string
    url: string
  }
}

export function runTests(
  script: string,
  context: TestContext,
): TestCase[] {
  const results: TestCase[] = []

  if (!script || !script.trim()) {
    return results
  }

  const pm = {
    test(name: string, fn: () => void) {
      try {
        fn()
        results.push({ name, passed: true, message: '通过' })
      } catch (e: any) {
        results.push({
          name,
          passed: false,
          message: e.message || '测试失败',
        })
      }
    },
    response: context.response,
    request: context.request,
    assert: {
      equal(a: any, b: any, msg?: string) {
        if (a !== b) {
          throw new Error(msg || `期望 ${JSON.stringify(b)}，实际 ${JSON.stringify(a)}`)
        }
      },
      ok(value: any, msg?: string) {
        if (!value) {
          throw new Error(msg || `期望为真值，实际 ${JSON.stringify(value)}`)
        }
      },
      contains(str: string, substr: string, msg?: string) {
        if (!str.includes(substr)) {
          throw new Error(msg || `期望包含 "${substr}"`)
        }
      },
      gt(a: number, b: number, msg?: string) {
        if (!(a > b)) {
          throw new Error(msg || `期望 ${a} > ${b}`)
        }
      },
      lt(a: number, b: number, msg?: string) {
        if (!(a < b)) {
          throw new Error(msg || `期望 ${a} < ${b}`)
        }
      },
    },
  }

  try {
    const fn = new Function('pm', script)
    fn(pm)
  } catch (e: any) {
    results.push({
      name: '脚本执行错误',
      passed: false,
      message: e.message || '未知错误',
    })
  }

  return results
}
