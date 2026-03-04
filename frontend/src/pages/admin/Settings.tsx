import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Search, Layout, Store, Upload, X, Globe, Plus, Trash2, Settings2, MessageSquare, Sparkles, Languages } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import { categoriesApi, type Category } from '@/api/categories'
import useToast from '@/hooks/useToast'
import { toImageUrl } from '@/utils/imageUrl'

type TopbarForm = {
  isActive: boolean
  email: string
  phone: string
  bgColor: string
  textColor: string
  linkColor: string
  wishlistLabel: string
  wishlistPath: string
  trackOrderLabel: string
  trackOrderPath: string
  showTrackOrder: boolean
  showApplyForVendors: boolean
  applyForVendorsLabel: string
  applyForVendorsPath: string
}

type StoreInfoForm = {
  storeName: string
  logo: string
  address: string
  email: string
  phone: string
  whatsappLink: string
  messengerLink: string
}

type SeoSettingsForm = {
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

type PopupSettingsForm = {
  isActive: boolean
  showTime: number
  delayTime: number
  image: string
  title: string
  description: string
  buttonText: string
  buttonLink: string
  pages: string[]
}

type AnimationSettingsForm = {
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

type LanguageSettingsForm = {
  isActive: boolean
  defaultLang: 'en' | 'bn'
  enabled: {
    en: boolean
    bn: boolean
  }
}

type TranslationsForm = Record<string, Record<string, Record<string, string>>>

type FormValues = {
  searchPlaceholder: string
  topbar: TopbarForm
  storeInfo: StoreInfoForm
  seoSettings: SeoSettingsForm
  popupSettings: PopupSettingsForm
  animationSettings: AnimationSettingsForm
  languageSettings: LanguageSettingsForm
  translations: TranslationsForm
}

/** Suggested page paths for popup "Show On Pages" (public-facing routes) */
const POPUP_SUGGESTED_PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/categories', label: 'Categories' },
  { path: '/wishlist', label: 'Wishlist' },
  { path: '/track-order', label: 'Track Order' },
  { path: '/orders', label: 'My Orders' },
]

const defaultTopbar: TopbarForm = {
  isActive: true,
  email: '',
  phone: '',
  bgColor: '#ffffff',
  textColor: '#374151',
  linkColor: '#4f46e5',
  wishlistLabel: 'My Wishlist',
  wishlistPath: '/wishlist',
  trackOrderLabel: 'Track Order',
  trackOrderPath: '/track-order',
  showTrackOrder: true,
  showApplyForVendors: false,
  applyForVendorsLabel: 'Apply for Vendors',
  applyForVendorsPath: '/apply-vendor',
}

const defaultStoreInfo: StoreInfoForm = {
  storeName: '',
  logo: '',
  address: '',
  email: '',
  phone: '',
  whatsappLink: '',
  messengerLink: '',
}

const defaultSeoSettings: SeoSettingsForm = {
  defaultTitle: '',
  defaultDescription: '',
  defaultKeywords: '',
  defaultOgImage: '',
  pages: [],
}

const defaultPopupSettings: PopupSettingsForm = {
  isActive: false,
  showTime: 3000,
  delayTime: 1000,
  image: '',
  title: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  pages: [],
}

const defaultAnimationSettings: AnimationSettingsForm = {
  welcomeAnimation: {
    isActive: false,
    duration: 3000,
    showConfetti: true,
    backgroundColor: '#000000',
    circleColor: '#ffffff',
  },
  pageTransitionAnimation: {
    isActive: false,
    duration: 1000,
    backgroundColor: '#000000',
    circleColor: '#6366f1',
  },
}

const defaultLanguageSettings: LanguageSettingsForm = {
  isActive: true,
  defaultLang: 'en',
  enabled: { en: true, bn: true },
}

const defaultTranslations: TranslationsForm = {
  en: {
    common: {
      'language.en': 'English',
      'language.bn': 'বাংলা',
    },
  },
  bn: {
    common: {
      'language.en': 'English',
      'language.bn': 'বাংলা',
    },
  },
}

export default function AdminSettings() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [categorySuggestions, setCategorySuggestions] = useState<Category[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  const form = useForm<FormValues>({
    defaultValues: {
      searchPlaceholder: 'Search products, brands...',
      topbar: defaultTopbar,
      storeInfo: defaultStoreInfo,
      seoSettings: defaultSeoSettings,
      popupSettings: defaultPopupSettings,
      animationSettings: defaultAnimationSettings,
      languageSettings: defaultLanguageSettings,
      translations: defaultTranslations,
    },
  })

  const { fields: seoPages, append: appendSeoPage, remove: removeSeoPage } = useFieldArray({
    control: form.control,
    name: 'seoSettings.pages',
  })

  useEffect(() => {
    adminApi.settings
      .get()
      .then((res) => {
        const d = res.data.data
        const search = d?.searchPlaceholder ?? 'Search products, brands...'
        const tb = (d?.topbar ?? defaultTopbar) as TopbarForm
        const si = d?.storeInfo ?? defaultStoreInfo
        const seo = d?.seoSettings ?? defaultSeoSettings
        const popup = d?.popupSettings ?? defaultPopupSettings
        const anim = d?.animationSettings ?? defaultAnimationSettings
        const lang = d?.languageSettings ?? defaultLanguageSettings
        const translations = (d?.translations ?? defaultTranslations) as TranslationsForm
        form.reset({
          searchPlaceholder: search,
          topbar: {
            isActive: tb.isActive ?? true,
            email: tb.email ?? '',
            phone: tb.phone ?? '',
            bgColor: tb.bgColor ?? '#ffffff',
            textColor: tb.textColor ?? '#374151',
            linkColor: tb.linkColor ?? '#4f46e5',
            wishlistLabel: tb.wishlistLabel ?? 'My Wishlist',
            wishlistPath: tb.wishlistPath ?? '/wishlist',
            trackOrderLabel: tb.trackOrderLabel ?? 'Track Order',
            trackOrderPath: tb.trackOrderPath ?? '/track-order',
            showTrackOrder: tb.showTrackOrder ?? true,
            showApplyForVendors: tb.showApplyForVendors ?? false,
            applyForVendorsLabel: tb.applyForVendorsLabel ?? 'Apply for Vendors',
            applyForVendorsPath: tb.applyForVendorsPath ?? '/apply-vendor',
          },
          storeInfo: {
            storeName: si.storeName ?? '',
            logo: si.logo ?? '',
            address: si.address ?? '',
            email: si.email ?? '',
            phone: si.phone ?? '',
            whatsappLink: si.whatsappLink ?? '',
            messengerLink: si.messengerLink ?? '',
          },
          seoSettings: {
            defaultTitle: seo.defaultTitle ?? '',
            defaultDescription: seo.defaultDescription ?? '',
            defaultKeywords: seo.defaultKeywords ?? '',
            defaultOgImage: seo.defaultOgImage ?? '',
            pages: Array.isArray(seo.pages) ? seo.pages : [],
          },
          popupSettings: {
            isActive: popup.isActive ?? false,
            showTime: popup.showTime ?? 3000,
            delayTime: popup.delayTime ?? 1000,
            image: popup.image ?? '',
            title: popup.title ?? '',
            description: popup.description ?? '',
            buttonText: popup.buttonText ?? '',
            buttonLink: popup.buttonLink ?? '',
            pages: Array.isArray(popup.pages) ? popup.pages : [],
          },
          animationSettings: {
            welcomeAnimation: {
              isActive: anim.welcomeAnimation?.isActive ?? false,
              duration: anim.welcomeAnimation?.duration ?? 3000,
              showConfetti: anim.welcomeAnimation?.showConfetti ?? true,
              backgroundColor: anim.welcomeAnimation?.backgroundColor ?? '#000000',
              circleColor: anim.welcomeAnimation?.circleColor ?? '#ffffff',
            },
            pageTransitionAnimation: {
              isActive: anim.pageTransitionAnimation?.isActive ?? false,
              duration: anim.pageTransitionAnimation?.duration ?? 1000,
              backgroundColor: anim.pageTransitionAnimation?.backgroundColor ?? '#000000',
              circleColor: anim.pageTransitionAnimation?.circleColor ?? '#6366f1',
            },
          },
          languageSettings: {
            isActive: lang.isActive ?? true,
            defaultLang: (lang.defaultLang === 'bn' ? 'bn' : 'en'),
            enabled: {
              en: lang.enabled?.en ?? true,
              bn: lang.enabled?.bn ?? true,
            },
          },
          translations,
        })
      })
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
  }, [form, showToast])

  useEffect(() => {
    setCategoryLoading(true)
    categoriesApi
      .getAll()
      .then((res) => setCategorySuggestions(res.data.data ?? []))
      .catch(() => setCategorySuggestions([]))
      .finally(() => setCategoryLoading(false))
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('images[]', file)
      const res = await adminApi.uploads(formData, { folder: 'logo' })
      const path = res.data.data?.[0]?.path
      if (path) {
        form.setValue('storeInfo.logo', path)
        try {
          await adminApi.settings.update({ storeInfo: { logo: path } })
          showToast('Logo saved', 'success')
        } catch {
          showToast('Logo saved failed', 'error')
        }
      }
    } catch {
      showToast('Logo upload failed', 'error')
    } finally {
      setLogoUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleLogoRemove = async () => {
    const current = form.watch('storeInfo.logo')
    if (current) {
      try {
        await adminApi.images.delete({
          path: current,
          ownerType: 'settings',
          field: 'storeInfo.logo',
        })
      } catch {
        showToast('Failed to delete logo', 'error')
        return
      }
    }
    form.setValue('storeInfo.logo', '')
    try {
      await adminApi.settings.update({ storeInfo: { logo: '' } })
      showToast('Logo removed', 'success')
    } catch {
      showToast('Failed to update logo', 'error')
    }
  }

  const handlePopupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('images[]', file)
      const res = await adminApi.uploads(formData, { folder: 'utility' })
      const path = res.data.data?.[0]?.path
      if (path) {
        form.setValue('popupSettings.image', path)
        showToast('Popup image uploaded', 'success')
      }
    } catch {
      showToast('Popup image upload failed', 'error')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const handlePopupImageRemove = async () => {
    const current = form.watch('popupSettings.image')
    if (current) {
      try {
        await adminApi.images.delete({
          path: current,
          ownerType: 'settings',
          field: 'popupSettings.image',
        })
      } catch {
        showToast('Failed to delete popup image', 'error')
        return
      }
    }
    form.setValue('popupSettings.image', '')
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setSaving(true)
    try {
      console.log('Submitting storeInfo:', data.storeInfo)
      await adminApi.settings.update({
        searchPlaceholder: data.searchPlaceholder?.trim() || '',
        topbar: {
          ...data.topbar,
          phone: String(data.topbar?.phone || ''),
        },
        storeInfo: {
          ...data.storeInfo,
          phone: String(data.storeInfo?.phone || ''),
        },
        seoSettings: {
          defaultTitle: data.seoSettings?.defaultTitle?.trim() || '',
          defaultDescription: data.seoSettings?.defaultDescription?.trim() || '',
          defaultKeywords: data.seoSettings?.defaultKeywords?.trim() || '',
          defaultOgImage: data.seoSettings?.defaultOgImage?.trim() || '',
          pages: data.seoSettings?.pages?.filter((p) => p.path && p.path.trim() !== '') || [],
        },
        popupSettings: data.popupSettings,
        animationSettings: data.animationSettings,
        languageSettings: data.languageSettings,
        translations: data.translations,
      })
      showToast('Settings saved', 'success')
    } catch {
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  })

  const handleAddSuggestedPath = (path: string) => {
    const existing = form.getValues('seoSettings.pages') || []
    if (existing.some((p) => (p.path || '').trim() === path)) {
      showToast('Path already added', 'error')
      return
    }
    appendSeoPage({ path, title: '', description: '', keywords: '', ogImage: '' })
    showToast('Path added to SEO pages', 'success')
  }

  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'popup' | 'animation' | 'language'>('general')

  const availableNamespaces = useMemo(() => {
    const t = form.watch('translations') as TranslationsForm
    const enNs = t?.en ? Object.keys(t.en) : []
    const bnNs = t?.bn ? Object.keys(t.bn) : []
    const merged = Array.from(new Set(['common', ...enNs, ...bnNs]))
    return merged.sort()
  }, [form])

  const [selectedNamespace, setSelectedNamespace] = useState<string>('common')
  const [translationSearch, setTranslationSearch] = useState('')

  const translationRows = useMemo(() => {
    const t = form.watch('translations') as TranslationsForm
    const en = (t?.en?.[selectedNamespace] || {}) as Record<string, string>
    const bn = (t?.bn?.[selectedNamespace] || {}) as Record<string, string>
    const keys = Array.from(new Set([...Object.keys(en), ...Object.keys(bn)])).sort()
    const filtered = translationSearch.trim()
      ? keys.filter((k) => k.toLowerCase().includes(translationSearch.trim().toLowerCase()))
      : keys
    return filtered.map((key) => ({ key, en: en[key] ?? '', bn: bn[key] ?? '' }))
  }, [form, selectedNamespace, translationSearch])

  return (
    
      <div className="max-w-7xl space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings2 size={16} />
                <span>General</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'seo'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span>SEO Settings</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('popup')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'popup'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Popup Settings</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('animation')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'animation'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>Animation Settings</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('language')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'language'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Languages size={16} />
                <span>Language</span>
              </div>
            </button>
          </nav>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <>
              {/* Search bar and Top bar - Side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search bar section */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <Search size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Search bar</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Placeholder (typing recommendation)
                  </label>
                  <input
                    {...form.register('searchPlaceholder')}
                    placeholder="e.g. Searching Products..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Shown word-by-word in the storefront search bar.
                  </p>
                </div>

                {/* Store Name, Logo, Address - Moved from Our Info */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Store Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Store Name
                    </label>
                    <input
                      {...form.register('storeInfo.storeName')}
                      placeholder="e.g. My Awesome Store"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Displayed on the left side of the navbar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                    <div className="flex items-start gap-4">
                      {form.watch('storeInfo.logo') && (
                        <div className="relative group">
                          <img
                            src={toImageUrl(form.watch('storeInfo.logo'))}
                            alt="Store logo"
                            className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleLogoRemove}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                        />
                        {logoUploading ? (
                          <span className="text-xs text-gray-500">Uploading...</span>
                        ) : (
                          <>
                            <Upload size={18} className="text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Displayed in the middle of the navbar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <textarea
                      {...form.register('storeInfo.address')}
                      placeholder="Store address..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top bar section */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <Layout size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Top bar (above navbar)</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bar above the main navbar: email, phone, My Wishlist, Track Order. SUPARADMIN controls colors and data.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('topbar.isActive')}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show top bar</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      {...form.register('topbar.email')}
                      placeholder="mail@gmail.com"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      {...form.register('topbar.phone')}
                      type="tel"
                      placeholder="+880100000000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background (#hex)</label>
                    <input
                      {...form.register('topbar.bgColor')}
                      placeholder="#ffffff"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text color (#hex)</label>
                    <input
                      {...form.register('topbar.textColor')}
                      placeholder="#374151"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link color (#hex)</label>
                    <input
                      {...form.register('topbar.linkColor')}
                      placeholder="#4f46e5"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm font-mono focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wishlist label</label>
                    <input
                      {...form.register('topbar.wishlistLabel')}
                      placeholder="My Wishlist"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Label shown in top bar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wishlist path</label>
                    <input
                      {...form.register('topbar.wishlistPath')}
                      placeholder="/wishlist"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL path (e.g. /wishlist)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Track Order label</label>
                    <input
                      {...form.register('topbar.trackOrderLabel')}
                      placeholder="Track Order"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Label shown in top bar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Track Order path</label>
                    <input
                      {...form.register('topbar.trackOrderPath')}
                      placeholder="/track-order"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL path (e.g. /track-order)</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('topbar.showTrackOrder')}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Track Order link</span>
                </label>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      {...form.register('topbar.showApplyForVendors')}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Apply for Vendors link (top bar)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apply for Vendors label</label>
                      <input
                        {...form.register('topbar.applyForVendorsLabel')}
                        placeholder="Apply for Vendors"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apply for Vendors path</label>
                      <input
                        {...form.register('topbar.applyForVendorsPath')}
                        placeholder="/apply-vendor"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL path (e.g. /apply-vendor)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Info Section - Contact Information Only */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
              <Store size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Our Info</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contact information used for floating contact widget and throughout the project.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      {...form.register('storeInfo.email')}
                      type="email"
                      placeholder="store@example.com"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      {...form.register('storeInfo.phone')}
                      type="tel"
                      placeholder="+880100000000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Link</label>
                    <input
                      {...form.register('storeInfo.whatsappLink')}
                      type="url"
                      placeholder="https://wa.me/880100000000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Full WhatsApp link (e.g. https://wa.me/880100000000 or https://wa.me/880100000000?text=Hello)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Messenger Link</label>
                    <input
                      {...form.register('storeInfo.messengerLink')}
                      type="url"
                      placeholder="https://m.me/yourpage"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Full Facebook Messenger link (e.g. https://m.me/yourpage or https://m.me/yourpage?ref=welcome)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* SEO Settings Tab */}
          {activeTab === 'seo' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">SEO Settings</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure meta tags (title, description, keywords) for all pages. Set defaults that apply to all pages, or add page-specific SEO settings.
              </p>

              {/* Default SEO Settings */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Default SEO (applies to all pages)</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Title</label>
                  <input
                    {...form.register('seoSettings.defaultTitle')}
                    placeholder="e.g. My Awesome Store - Best Products Online"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default page title (used if page-specific title is not set)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Description</label>
                  <textarea
                    {...form.register('seoSettings.defaultDescription')}
                    placeholder="e.g. Shop the best products online. Fast shipping, secure payment, quality guaranteed."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default meta description (used if page-specific description is not set)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Keywords</label>
                  <input
                    {...form.register('seoSettings.defaultKeywords')}
                    placeholder="e.g. online shopping, ecommerce, products, buy online"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Comma-separated keywords (used if page-specific keywords are not set)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default OG Image</label>
                  <input
                    {...form.register('seoSettings.defaultOgImage')}
                    placeholder="e.g. /storage/og-image.jpg"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default Open Graph image URL (used for social media sharing)</p>
                </div>
              </div>

              {/* Page-Specific SEO Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Page-Specific SEO</h3>
                  <button
                    type="button"
                    onClick={() => appendSeoPage({ path: '', title: '', description: '', keywords: '', ogImage: '' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus size={14} />
                    Add Page
                  </button>
                </div>

                {seoPages.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No page-specific SEO settings. Click "Add Page" to configure SEO for specific pages.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {seoPages.map((field, index) => (
                      <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Page {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeSeoPage(index)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Path *</label>
                          <input
                            {...form.register(`seoSettings.pages.${index}.path` as const)}
                            placeholder="e.g. /shop, /cart, /products/example"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Exact page path (e.g. /shop, /cart, /products/product-slug)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Title</label>
                          <input
                            {...form.register(`seoSettings.pages.${index}.title` as const)}
                            placeholder="Leave empty to use default"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Description</label>
                          <textarea
                            {...form.register(`seoSettings.pages.${index}.description` as const)}
                            placeholder="Leave empty to use default"
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Keywords</label>
                            <input
                              {...form.register(`seoSettings.pages.${index}.keywords` as const)}
                              placeholder="Leave empty to use default"
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OG Image</label>
                            <input
                              {...form.register(`seoSettings.pages.${index}.ogImage` as const)}
                              placeholder="Leave empty to use default"
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Path Suggestions */}
              <div className="space-y-3 p-4 bg-white dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Suggested Category Paths</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/shop?categoryId=...</span>
                </div>
                {categoryLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Loading categories...</p>
                ) : categorySuggestions.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No categories found.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {categorySuggestions.map((cat) => {
                      const path = `/shop?categoryId=${cat.id}`
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-700"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {cat.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {path}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSuggestedPath(path)}
                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                          >
                            Add
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Popup Settings Tab */}
          {activeTab === 'popup' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Popup Settings</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure home page popup display settings.
              </p>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
                <strong>পপআপ কখন দেখাবে:</strong> পেজ লোডের পর <strong>Delay Time</strong> অপেক্ষা করে পপআপ আসবে; <strong>Show Time</strong> ধরে থাকবে তারপর নিজে বন্ধ হবে। শুধু **Show On Pages**-এ বাছা পেজে (খালি থাকলে সব পেজে)। একই পেজে এক সেশনে একবারই দেখাবে।
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('popupSettings.isActive')}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Popup</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Show Time (ms)</label>
                    <input
                      {...form.register('popupSettings.showTime', { valueAsNumber: true })}
                      type="number"
                      min={1000}
                      max={30000}
                      step={500}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">How long the popup stays visible (1000-30000ms)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delay Time (ms)</label>
                    <input
                      {...form.register('popupSettings.delayTime', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      max={10000}
                      step={100}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Delay before showing popup (0-10000ms)</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Popup Image (optional)</label>
                  <div className="space-y-2">
                    {form.watch('popupSettings.image') && (
                      <div className="relative inline-block">
                        <img 
                          src={form.watch('popupSettings.image')?.startsWith('http') 
                            ? form.watch('popupSettings.image') 
                            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${form.watch('popupSettings.image')}`} 
                          alt="Popup preview" 
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" 
                        />
                        <button
                          type="button"
                          onClick={handlePopupImageRemove}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePopupImageUpload}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload an image for the popup product display</p>
                </div>
                
                {/* Text Content */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Text Content</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      {...form.register('popupSettings.title')}
                      type="text"
                      placeholder="Special Offer!"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Popup title text</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      {...form.register('popupSettings.description')}
                      rows={3}
                      placeholder="Get 20% off on your first order!"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Popup description text</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Text</label>
                      <input
                        {...form.register('popupSettings.buttonText')}
                        type="text"
                        placeholder="Shop Now"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Link</label>
                      <input
                        {...form.register('popupSettings.buttonLink')}
                        type="text"
                        placeholder="/products or https://example.com"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Page Selection */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Show On Pages</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const current = form.watch('popupSettings.pages') || []
                        form.setValue('popupSettings.pages', [...current, ''])
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      + Add Page
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to show on all pages. Add specific page paths to show only on those pages.
                  </p>

                  {/* Suggested pages - click to add */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Suggested pages</p>
                    <div className="flex flex-wrap gap-2">
                      {POPUP_SUGGESTED_PAGES.map(({ path, label }) => {
                        const current = form.watch('popupSettings.pages') || []
                        const isAdded = current.includes(path)
                        return (
                          <button
                            key={path}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                form.setValue('popupSettings.pages', current.filter((p) => p !== path))
                              } else if (!current.includes(path)) {
                                form.setValue('popupSettings.pages', [...current.filter(Boolean), path])
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              isAdded
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {label} ({path})
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Custom paths (optional)</p>
                    {(form.watch('popupSettings.pages') || []).map((_, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          {...form.register(`popupSettings.pages.${index}`)}
                          type="text"
                          placeholder="/ or /shop or /page/offers"
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = form.watch('popupSettings.pages') || []
                            form.setValue('popupSettings.pages', current.filter((_, i) => i !== index))
                          }}
                          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {(!form.watch('popupSettings.pages') || form.watch('popupSettings.pages').length === 0) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">No pages specified - popup will show on all pages</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Animation Settings Tab */}
          {activeTab === 'animation' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Animation Settings</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure welcome animation and page transition animation. Both use your website logo dynamically.
              </p>

              {/* Welcome Animation */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Welcome Animation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Shown on first visit to the website</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register('animationSettings.welcomeAnimation.isActive')}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Welcome Animation</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (ms)
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(100-30000)</span>
                      </label>
                      <input
                        {...form.register('animationSettings.welcomeAnimation.duration', { 
                          valueAsNumber: true,
                          min: 100,
                          max: 30000,
                        })}
                        type="number"
                        min={100}
                        max={30000}
                        step={100}
                        placeholder="3000"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Animation duration in milliseconds (100ms - 30s)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Color</label>
                      <input
                        {...form.register('animationSettings.welcomeAnimation.backgroundColor')}
                        type="color"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Circle Color</label>
                      <input
                        {...form.register('animationSettings.welcomeAnimation.circleColor')}
                        type="color"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Color of rotating circle around logo</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register('animationSettings.welcomeAnimation.showConfetti')}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Confetti</span>
                  </label>
                </div>
              </div>

              {/* Page Transition Animation */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Page Transition Animation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Shown when navigating between pages</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register('animationSettings.pageTransitionAnimation.isActive')}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Page Transition Animation</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (ms)
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(100-10000)</span>
                      </label>
                      <input
                        {...form.register('animationSettings.pageTransitionAnimation.duration', { 
                          valueAsNumber: true,
                          min: 100,
                          max: 10000,
                        })}
                        type="number"
                        min={100}
                        max={10000}
                        step={50}
                        placeholder="1000"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Transition duration in milliseconds (100ms - 10s)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Color</label>
                      <input
                        {...form.register('animationSettings.pageTransitionAnimation.backgroundColor')}
                        type="color"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Circle Color</label>
                      <input
                        {...form.register('animationSettings.pageTransitionAnimation.circleColor')}
                        type="color"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Color of rotating circle around logo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-2">
                  <Languages size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Language Settings</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...form.register('languageSettings.isActive')}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable language switcher</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enabled languages</div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...form.register('languageSettings.enabled.en')}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">English (EN)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...form.register('languageSettings.enabled.bn')}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">বাংলা (BN)</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        At least one language must stay enabled.
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Default language</div>
                      <select
                        {...form.register('languageSettings.defaultLang')}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                      >
                        <option value="en">English (EN)</option>
                        <option value="bn">বাংলা (BN)</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Used when user has not selected a language.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Translations</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Edit EN/BN text for translation keys. Use consistent keys in the UI.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedNamespace}
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {availableNamespaces.map((ns) => (
                          <option key={ns} value={ns}>
                            {ns}
                          </option>
                        ))}
                      </select>
                      <input
                        value={translationSearch}
                        onChange={(e) => setTranslationSearch(e.target.value)}
                        placeholder="Search key..."
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {translationRows.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No keys found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 dark:text-gray-300">
                              <th className="py-2 pr-4">Key</th>
                              <th className="py-2 pr-4">English</th>
                              <th className="py-2">বাংলা</th>
                            </tr>
                          </thead>
                          <tbody className="align-top">
                            {translationRows.map((row) => (
                              <tr key={row.key} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="py-3 pr-4 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {row.key}
                                </td>
                                <td className="py-3 pr-4">
                                  <textarea
                                    value={row.en}
                                    onChange={(e) => {
                                      form.setValue(`translations.en.${selectedNamespace}.${row.key}` as const, e.target.value)
                                    }}
                                    rows={2}
                                    className="w-72 sm:w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </td>
                                <td className="py-3">
                                  <textarea
                                    value={row.bn}
                                    onChange={(e) => {
                                      form.setValue(`translations.bn.${selectedNamespace}.${row.key}` as const, e.target.value)
                                    }}
                                    rows={2}
                                    className="w-72 sm:w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button - Always visible */}
          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              disabled={loading || saving}
              className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
