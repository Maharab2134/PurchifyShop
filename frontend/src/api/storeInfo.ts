import axiosInstance from '@/utils/axiosInstance'

export interface StoreInfo {
  storeName: string
  logo: string
  address: string
  email: string
  phone: string
  whatsappLink: string
  messengerLink: string
}

interface StoreInfoRes {
  message: string
  data: StoreInfo
}

const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: '',
  logo: '',
  address: '',
  email: '',
  phone: '',
  whatsappLink: '',
  messengerLink: '',
}

export const storeInfoApi = {
  get: () =>
    axiosInstance
      .get<StoreInfoRes>('/store-info')
      .then((r) => ({ ...DEFAULT_STORE_INFO, ...(r.data.data ?? {}) } as StoreInfo))
      .catch(() => DEFAULT_STORE_INFO),
}
