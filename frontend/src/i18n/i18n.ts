import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'

export type SupportedLang = 'en' | 'bn'

export interface LanguageSettings {
  isActive: boolean
  defaultLang: SupportedLang
  enabled: Record<SupportedLang, boolean>
}

export interface TranslationsBundle extends Resource {}

export function resolveInitialLanguage(
  settings: LanguageSettings,
  storedLang: string | null | undefined
): SupportedLang {
  const enabled = settings.enabled || { en: true, bn: true }
  const defaultLang: SupportedLang = settings.defaultLang || 'en'

  const candidate = (storedLang === 'bn' || storedLang === 'en') ? (storedLang as SupportedLang) : null
  if (candidate && enabled[candidate]) return candidate
  if (enabled[defaultLang]) return defaultLang
  // fallback: first enabled lang
  return enabled.en ? 'en' : 'bn'
}

export async function initI18n(args: {
  languageSettings: LanguageSettings
  translations: TranslationsBundle
  initialLang: SupportedLang
}) {
  const { languageSettings, translations, initialLang } = args

  const resources: Resource = translations && typeof translations === 'object' ? translations : {}
  const fallbackLng: SupportedLang = languageSettings.defaultLang || 'en'

  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLang,
        fallbackLng,
        interpolation: { escapeValue: false },
        defaultNS: 'common',
        ns: Object.keys((resources as any)?.[initialLang] || { common: {} }),
        react: { useSuspense: false },
      })
  } else {
    // Update resources + language on subsequent calls
    Object.entries(resources).forEach(([lng, namespaces]) => {
      Object.entries((namespaces || {}) as Record<string, any>).forEach(([ns, dict]) => {
        i18n.addResourceBundle(lng, ns, dict, true, true)
      })
    })
    await i18n.changeLanguage(initialLang)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLang
  }

  return i18n
}

export default i18n
