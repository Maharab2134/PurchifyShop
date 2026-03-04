import axiosInstance from '@/utils/axiosInstance'

export interface Section {
  id: number
  type: string
  title: string | null
  description: string | null
  images: string[]
  icons: string | null
  link: string | null
  ctaText: string | null
  isVisible: boolean
  primaryColor: string | null
  secondaryColor: string | null
}

interface SectionsRes {
  message: string
  data: Section[]
}

export const sectionsApi = {
  getAll: () => axiosInstance.get<SectionsRes>('/sections'),
}
