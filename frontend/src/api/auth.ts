import axiosInstance from '@/utils/axiosInstance'
import type { User } from '@/store/slices/authSlice'

const AUTH = '/auth'

export interface SignInRes {
  message: string
  data: { user: User; accessToken: string }
}

export interface SignUpRes {
  message: string
  data: { user: User; accessToken: string }
}

export const authApi = {
  signIn: (body: { email: string; password: string }) =>
    axiosInstance.post<SignInRes>(`${AUTH}/sign-in`, body),

  signUp: (body: { name: string; email: string; password: string }) =>
    axiosInstance.post<SignUpRes>(`${AUTH}/sign-up`, body),

  signOut: () => axiosInstance.post<{ message: string }>(`${AUTH}/sign-out`),

  refreshToken: () =>
    axiosInstance.post<{ message: string; data: { user: User; accessToken: string } }>(
      `${AUTH}/refresh-token`
    ),

  me: () =>
    axiosInstance.get<{ data: { user: User } }>(`${AUTH}/me`),

  forgotPassword: (body: { email: string }) =>
    axiosInstance.post<{ message: string }>(`${AUTH}/forgot-password`, body),

  resetPassword: (body: { token: string; newPassword: string }) =>
    axiosInstance.post<{ message: string }>(`${AUTH}/reset-password`, body),

  updateProfile: (body: { name?: string; email?: string; phone?: string }) =>
    axiosInstance.put<{ message: string; data: { user: User } }>(`${AUTH}/profile`, body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    axiosInstance.put<{ message: string }>(`${AUTH}/change-password`, body),
}
