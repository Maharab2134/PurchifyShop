const DEV = 'http://localhost:8000/api/v1'
const PROD = import.meta.env.VITE_API_URL || ''

export const API_BASE_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || DEV) : (import.meta.env.VITE_API_URL || PROD || DEV)

export const AUTH_API_BASE_URL = API_BASE_URL
