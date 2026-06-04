// Toast 通知组件

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/shared/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
  duration?: number
}

let toastId = 0
const listeners: Set<(toasts: ToastMessage[]) => void> = new Set()
let currentToasts: ToastMessage[] = []

function notifyListeners() {
  listeners.forEach((fn) => fn([...currentToasts]))
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000,
) {
  const id = ++toastId
  const toast: ToastMessage = { id, type, message, duration }
  currentToasts = [...currentToasts, toast]
  notifyListeners()

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }

  return id
}

export function dismissToast(id: number) {
  currentToasts = currentToasts.filter((t) => t.id !== id)
  notifyListeners()
}

// 便捷方法
export const toast = {
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (newToasts: ToastMessage[]) => setToasts(newToasts)
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t }: { toast: ToastMessage }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const config = {
    success: {
      icon: <CheckCircle size={18} />,
      bg: 'bg-success/10 border-success/30',
      text: 'text-success',
      iconColor: 'text-success',
    },
    error: {
      icon: <XCircle size={18} />,
      bg: 'bg-error/10 border-error/30',
      text: 'text-error',
      iconColor: 'text-error',
    },
    info: {
      icon: <Info size={18} />,
      bg: 'bg-primary/10 border-primary/30',
      text: 'text-primary',
      iconColor: 'text-primary',
    },
    warning: {
      icon: <AlertTriangle size={18} />,
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      text: 'text-yellow-500',
      iconColor: 'text-yellow-500',
    },
  }

  const c = config[t.type]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        'bg-dark-card backdrop-blur transition-all duration-300',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
        c.bg,
      )}
    >
      <span className={cn('flex-shrink-0', c.iconColor)}>{c.icon}</span>
      <p className={cn('text-sm flex-1', c.text)}>{t.message}</p>
      <button
        onClick={() => dismissToast(t.id)}
        className="text-dark-text-secondary hover:text-dark-text flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
