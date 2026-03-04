import axiosInstance from '@/utils/axiosInstance'

export interface Notice {
  id: number
  text: string
  scrollSpeed: number
}

interface NoticesRes {
  message: string
  data: Notice[]
}

export const noticesApi = {
  getAll: () =>
    axiosInstance.get<NoticesRes>('/notices').then((r) => r.data.data ?? []),
}
