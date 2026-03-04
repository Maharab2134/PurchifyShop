import axiosInstance from '@/utils/axiosInstance'

export interface FooterLink {
  label: string
  url: string
}

export interface FooterColumn {
  id: number
  columnName: string
  title: string | null
  logoUrl?: string | null
  links: FooterLink[]
  socialLinks?: Array<{ platform: string; url: string }>
  contactInfo?: Array<{ type: string; value: string }>
  content: string | null
  sortOrder: number
  isActive: boolean
}

interface FooterRes {
  message: string
  data: {
    columns: Record<string, FooterColumn[]>
    copyright?: string | null
    poweredBy?: string | null
  }
}

export const footerApi = {
  get: () =>
    axiosInstance
      .get<FooterRes>('/footer')
      .then((r) => r.data.data ?? { columns: {}, copyright: null, poweredBy: null })
      .catch(() => ({ columns: {}, copyright: null, poweredBy: null })),
}
