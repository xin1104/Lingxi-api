// UI 组件库

import React from 'react'
import { cn } from '@/shared/utils'

// 按钮组件
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-600 text-white',
    secondary: 'bg-dark-card hover:bg-dark-border text-dark-text border border-dark-border',
    ghost: 'hover:bg-dark-card text-dark-text-secondary hover:text-dark-text',
    danger: 'bg-error hover:bg-red-600 text-white',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// 输入框组件
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-dark-text-secondary">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-dark-text text-sm',
          'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
          'placeholder:text-dark-text-secondary',
          error && 'border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// 选择框组件
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-dark-text-secondary">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-dark-text text-sm',
          'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// 文本框组件
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-dark-text-secondary">{label}</label>}
      <textarea
        className={cn(
          'w-full px-3 py-1.5 bg-dark-card border border-dark-border rounded-md text-dark-text text-sm',
          'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
          'placeholder:text-dark-text-secondary resize-none',
          className
        )}
        {...props}
      />
    </div>
  )
}

// 卡片组件
interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('bg-dark-card border border-dark-border rounded-lg', className)}>
      {children}
    </div>
  )
}

// 标签组件
interface TabsProps {
  tabs: { key: string; label: string }[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-dark-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            activeKey === tab.key
              ? 'text-primary'
              : 'text-dark-text-secondary hover:text-dark-text'
          )}
        >
          {tab.label}
          {activeKey === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}

// 加载动画
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-5 w-5 text-primary', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// 空状态
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-dark-text-secondary">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}
