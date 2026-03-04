import { type ReactNode } from 'react'

const variantClasses: Record<string, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
  secondary: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
}

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  title?: string
  children: ReactNode
}

export default function Button({
  type = 'button',
  onClick,
  disabled,
  className = '',
  variant,
  size,
  title,
  children,
}: ButtonProps) {
  const variantCn = variant ? variantClasses[variant] ?? '' : ''
  const sizeCn = size ? sizeClasses[size] ?? '' : ''
  const baseCn = 'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseCn} ${sizeCn} ${variantCn} ${className}`.trim()}
    >
      {children}
    </button>
  )
}
