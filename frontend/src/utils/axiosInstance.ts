import axios, { type AxiosInstance } from 'axios'
import { API_BASE_URL } from '@/lib/config'
import { getCartSessionId } from '@/utils/cartSessionId'

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  const url = (config.url ?? '').toString()
  const isCart = url.startsWith('/cart') || url.includes('/cart/items') || url.includes('/incomplete-orders/track') || url.includes('/checkout')
  if (isCart && typeof window !== 'undefined') {
    config.headers['X-Cart-Session-ID'] = getCartSessionId()
  }
  return config
})

axiosInstance.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const token = getToken()
      if (token) {
        try {
          const { data } = await axios.post<{ data?: { accessToken: string } }>(
            `${API_BASE_URL}/auth/refresh-token`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const next = data?.data?.accessToken
          if (next && typeof window !== 'undefined') {
            localStorage.setItem('accessToken', next)
            orig.headers.Authorization = `Bearer ${next}`
            return axiosInstance(orig)
          }
        } catch (_) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            window.dispatchEvent(new Event('auth:logout'))
          }
        }
      }
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
