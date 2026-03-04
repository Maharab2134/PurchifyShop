import { useEffect, useState } from 'react'
import { Clock, type LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface CountdownTimerProps {
  endDate: string // ISO 8601 string
  className?: string
  iconName?: string | null // Lucide icon name (e.g., 'Snowflake', 'Gift', 'Star')
}

/**
 * Countdown timer component that displays remaining time until endDate.
 * Shows: Days : Hours : Minutes : Seconds
 * Hides when countdown reaches zero.
 * Supports custom icon from lucide-react.
 */
export default function CountdownTimer({ endDate, className = '', iconName }: CountdownTimerProps) {
  // Get icon component from lucide-react, fallback to Clock
  let IconComponent: LucideIcon = Clock
  if (iconName && typeof iconName === 'string') {
    const IconName = iconName as keyof typeof LucideIcons
    if (IconName in LucideIcons && typeof LucideIcons[IconName] === 'function') {
      IconComponent = LucideIcons[IconName] as LucideIcon
    }
  }
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const difference = end - now

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, expired: false }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const result = calculateTimeLeft()
      setTimeLeft(result)
      if (result.expired) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endDate])

  if (!timeLeft || timeLeft.expired) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <IconComponent size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
      <div className="flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
        <span className="tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-red-500 dark:text-red-400">:</span>
        <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-red-500 dark:text-red-400">:</span>
        <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-red-500 dark:text-red-400">:</span>
        <span className="tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  )
}
