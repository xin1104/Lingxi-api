// 工具函数

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 类名合并
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 格式化耗时
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

// 获取状态码颜色
export function getStatusColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'text-success'
  if (statusCode >= 300 && statusCode < 400) return 'text-info'
  if (statusCode >= 400 && statusCode < 500) return 'text-warning'
  return 'text-error'
}

// 获取方法颜色
export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-success',
    POST: 'text-warning',
    PUT: 'text-info',
    PATCH: 'text-purple-400',
    DELETE: 'text-error',
    HEAD: 'text-gray-400',
    OPTIONS: 'text-gray-400',
  }
  return colors[method.toUpperCase()] || 'text-gray-400'
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

// JSON 格式化
export function formatJson(str: string): { formatted: string; error?: string } {
  try {
    const parsed = JSON.parse(str)
    return { formatted: JSON.stringify(parsed, null, 2) }
  } catch (e: any) {
    return { formatted: str, error: e.message }
  }
}

// 生成唯一 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 格式化时间
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
