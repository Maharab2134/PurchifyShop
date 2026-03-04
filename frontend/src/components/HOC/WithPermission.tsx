import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Map routes to section titles
const routeToSection: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/products': 'Products',
  '/dashboard/categories': 'Products',
  '/dashboard/attributes': 'Products',
  '/dashboard/orders': 'Sales',
  '/dashboard/refunded-orders': 'Sales',
  '/dashboard/transactions': 'Sales',
  '/dashboard/incomplete-orders': 'Sales',
  '/dashboard/shipping': 'Sales',
  '/dashboard/payment-methods': 'Sales',
  '/dashboard/coupons': 'Sales',
  '/dashboard/users': 'Users & Support',
  '/dashboard/roles': 'Users & Support',
  '/dashboard/vendors': 'Users & Support',
  '/dashboard/reviews': 'Users & Support',
  '/dashboard/chats': 'Users & Support',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/reports': 'Analytics',
  '/dashboard/logs': 'Analytics',
  '/dashboard/home-sections': 'Content',
  '/dashboard/pages': 'Content',
  '/dashboard/footer': 'Content',
  '/dashboard/settings': 'Settings',
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredSection?: string
) {
  return function PermissionComponent(props: P) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      if (!user) {
        setChecking(false)
        return
      }

      // SUPERADMIN has access to everything
      if (user.role === 'SUPERADMIN') {
        setChecking(false)
        return
      }

      // Get required section from route or prop
      const section = requiredSection || routeToSection[location.pathname]

      if (!section) {
        // Unknown route, allow access (might be a new route)
        setChecking(false)
        return
      }

      // Check if user has permission for this section
      const hasPermission = (() => {
        // Default ADMIN has all access (backward compatibility)
        if (user.role === 'ADMIN' && !user.roleModel) {
          return true
        }

        // Check role permissions
        if (user.roleModel?.permissions && Array.isArray(user.roleModel.permissions)) {
          return user.roleModel.permissions.includes(section)
        }

        return false
      })()

      if (!hasPermission) {
        // Redirect to dashboard if no permission
        navigate('/dashboard', { replace: true })
        setChecking(false)
        return
      }

      setChecking(false)
    }, [user, location.pathname, navigate, requiredSection])

    if (checking) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default withPermission
