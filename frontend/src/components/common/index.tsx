/**
 * @/components/common — shared UI primitives used across CricPro scoring pages.
 */

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ── Spinner ───────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' }[size]
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-primary-600 border-t-transparent',
        sizeClass,
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  name?: string | null
  photo?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name, photo, size = 'md', className }: AvatarProps) {
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size]

  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (photo) {
    return (
      <img
        src={photo}
        alt={name ?? 'avatar'}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white',
        sizeClass,
        className,
      )}
      aria-label={name ?? 'avatar'}
    >
      {initials}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: string   // tailwind bg class e.g. 'bg-green-500'
  className?: string
}

export function Badge({ label, color = 'bg-slate-500', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white',
        color,
        className,
      )}
    >
      {label}
    </span>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
      {icon && <span className="text-4xl">{icon}</span>}
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {description && <p className="max-w-xs text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  )
}

// ── TabBar ────────────────────────────────────────────────────────────────────

interface Tab {
  key: string
  label: string
  icon?: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  return (
    <div className={cn('flex gap-1 rounded-xl bg-slate-100 border border-slate-200 p-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active === tab.key
              ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── InputField ────────────────────────────────────────────────────────────────

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function InputField({ label, error, hint, className, id, ...props }: InputFieldProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// ── SelectField ───────────────────────────────────────────────────────────────

interface SelectOption {
  value: string | number
  label: string
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  placeholder?: string
}

export function SelectField({ label, options, error, placeholder, className, id, ...props }: SelectFieldProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className={cn(
          'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── TextareaField ─────────────────────────────────────────────────────────────

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function TextareaField({ label, error, hint, className, id, ...props }: TextareaFieldProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className={cn(
          'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
