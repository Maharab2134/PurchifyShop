import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LanguageSettings, SupportedLang } from './i18n'

const STORAGE_KEY = 'language'

type LanguageContextValue = {
  language: SupportedLang
  enabled: Record<SupportedLang, boolean>
  isActive: boolean
  setLanguage: (lang: SupportedLang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: LanguageSettings
}) {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState<SupportedLang>(settings.defaultLang || 'en')

  const enabled = settings.enabled || { en: true, bn: true }

  // Enforce allowed language whenever settings change
  useEffect(() => {
    const current = (i18n.language === 'bn' || i18n.language === 'en') ? (i18n.language as SupportedLang) : null
    const desired: SupportedLang =
      current && enabled[current]
        ? current
        : enabled[settings.defaultLang]
          ? settings.defaultLang
          : enabled.en
            ? 'en'
            : 'bn'

    setLanguageState(desired)
    if (i18n.language !== desired) {
      i18n.changeLanguage(desired)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = desired
    }
  }, [enabled.en, enabled.bn, i18n, settings.defaultLang])

  const setLanguage = useCallback(
    (lang: SupportedLang) => {
      if (!enabled[lang]) return
      setLanguageState(lang)
      i18n.changeLanguage(lang)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang)
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
      }
    },
    [enabled, i18n]
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      enabled,
      isActive: settings.isActive ?? true,
      setLanguage,
    }),
    [enabled, language, settings.isActive, setLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function getStoredLanguage(): SupportedLang | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'bn' || v === 'en' ? v : null
}

