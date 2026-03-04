import axiosInstance from '@/utils/axiosInstance'

export interface AnimationSettings {
  welcomeAnimation: {
    isActive: boolean
    duration: number
    showConfetti: boolean
    backgroundColor: string
    circleColor: string
  }
  pageTransitionAnimation: {
    isActive: boolean
    duration: number
    backgroundColor: string
    circleColor: string
  }
}

export interface PopupSettings {
  isActive: boolean
  showTime: number
  delayTime: number
  image?: string
  title?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  pages?: string[]
}

interface AnimationSettingsRes {
  data: {
    animationSettings: AnimationSettings
    popupSettings: PopupSettings
  }
}

export const animationApi = {
  get: () =>
    axiosInstance
      .get<AnimationSettingsRes>('/animation-settings')
      .then((r) => r.data.data),
}
