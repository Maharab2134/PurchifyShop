import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  roleId?: string | null
  roleModel?: {
    id: string
    name: string
    permissions: string[]
  } | null
  avatar: string | null
}

interface AuthState {
  user: User | null
}

const initialState: AuthState = { user: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user
    },
    logout: (state) => {
      state.user = null
    },
  },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer
