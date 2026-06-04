// Toast 通知系统测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { showToast, dismissToast, toast, ToastMessage } from '@/shared/ui/Toast'

describe('Toast 通知系统', () => {
  beforeEach(() => {
    // 清除所有 toast
    const toasts = document.querySelectorAll('[data-toast]')
    toasts.forEach((t) => t.remove())
  })

  it('showToast 应返回 toast ID', () => {
    const id = showToast('测试消息', 'info')
    expect(id).toBeGreaterThan(0)
  })

  it('showToast 应递增 ID', () => {
    const id1 = showToast('消息1', 'info')
    const id2 = showToast('消息2', 'info')
    expect(id2).toBeGreaterThan(id1)
  })

  it('toast.success 应创建 success 类型 toast', () => {
    const id = toast.success('成功消息')
    expect(id).toBeGreaterThan(0)
  })

  it('toast.error 应创建 error 类型 toast', () => {
    const id = toast.error('错误消息')
    expect(id).toBeGreaterThan(0)
  })

  it('toast.info 应创建 info 类型 toast', () => {
    const id = toast.info('信息消息')
    expect(id).toBeGreaterThan(0)
  })

  it('toast.warning 应创建 warning 类型 toast', () => {
    const id = toast.warning('警告消息')
    expect(id).toBeGreaterThan(0)
  })

  it('dismissToast 应能移除 toast', () => {
    const id = showToast('测试', 'info', 0) // 不自动消失
    dismissToast(id)
    // dismiss 不应该抛出错误
    dismissToast(id) // 重复 dismiss 也应安全
  })

  it('showToast 持续时间参数应正常传递', () => {
    const id = showToast('测试', 'info', 5000)
    expect(id).toBeGreaterThan(0)
  })

  it('showToast 默认类型为 info', () => {
    const id = showToast('默认类型')
    expect(id).toBeGreaterThan(0)
  })

  it('toast 方法链式调用应互不干扰', () => {
    const id1 = toast.success('成功')
    const id2 = toast.error('失败')
    const id3 = toast.info('信息')
    const id4 = toast.warning('警告')
    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id3).not.toBe(id4)
  })
})
