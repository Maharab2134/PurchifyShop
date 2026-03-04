import { useAppSelector } from '@/store/hooks'
import { useEffect, useState } from 'react'

export function useAuth() {
  const reduxUser = useAppSelector((s) => s.auth.user)
  const [localUser, setLocalUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage immediately on mount (synchronous check)
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('accessToken')
      
      if (userStr && token) {
        try {
          const parsedUser = JSON.parse(userStr)
          setLocalUser(parsedUser)
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e)
        }
      }
      
      // Mark as loaded after checking localStorage
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Update localUser when reduxUser changes
    if (reduxUser) {
      setLocalUser(null) // Clear localUser when reduxUser is available
    } else if (!reduxUser && typeof window !== 'undefined') {
      // Fallback to localStorage if Redux user is null (for initial load)
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          setLocalUser(JSON.parse(userStr))
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e)
        }
      }
    }
  }, [reduxUser])

  const user = reduxUser || localUser

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
  }
}
