import axiosInstance from '@/utils/axiosInstance'

export interface SeoSettings {
  defaultTitle: string
  defaultDescription: string
  defaultKeywords: string
  defaultOgImage: string
  pages: Array<{
    path: string
    title?: string
    description?: string
    keywords?: string
    ogImage?: string
  }>
}

export interface SeoData {
  title: string
  description: string
  keywords: string
  ogImage: string
  ogType?: string
  headings?: { h1?: string; h2?: string; h3?: string }
  schema?: unknown
}

export const seoApi = {
  get: (path: string = '/') =>
    axiosInstance.get<{ message: string; data: SeoData }>('/seo', { params: { path } }),
}
