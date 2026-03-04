import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export default function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  )
}
