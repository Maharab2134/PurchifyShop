import { useEffect, useState } from 'react'
import { Truck, Key, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

export default function AdminSteadfastSettings() {
  const { showToast } = useToast()
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://portal.packzy.com/api/v1')
  const [webhookBearerToken, setWebhookBearerToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.courier.steadfast.getSettings()
      const d = res.data.data
      setApiKey(d?.apiKey ?? '')
      setSecretKey(d?.secretKey ?? '')
      setBaseUrl(d?.baseUrl ?? 'https://portal.packzy.com/api/v1')
      setWebhookBearerToken(d?.webhookBearerToken ?? '')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load settings'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.courier.steadfast.updateSettings({
        apiKey: apiKey.trim() || undefined,
        secretKey: secretKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        webhookBearerToken: webhookBearerToken.trim() || undefined,
      })
      showToast('Steadfast settings saved', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Truck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          Steadfast Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Set Steadfast Courier API credentials here. Used for creating parcels and checking status (manual control only).
        </p>
      </div>

      <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API credentials</h2>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Steadfast API Key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Steadfast Secret Key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  title={showSecretKey ? 'Hide Secret Key' : 'Show Secret Key'}
                  aria-label={showSecretKey ? 'Hide Secret Key' : 'Show Secret Key'}
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://portal.packzy.com/api/v1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Bearer Token (optional)</label>
              <div className="relative">
                <input
                  type={showWebhookToken ? 'text' : 'password'}
                  value={webhookBearerToken}
                  onChange={(e) => setWebhookBearerToken(e.target.value)}
                  placeholder="Token for Steadfast webhook callbacks"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookToken((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  title={showWebhookToken ? 'Hide token' : 'Show token'}
                  aria-label={showWebhookToken ? 'Hide token' : 'Show token'}
                >
                  {showWebhookToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set this in Steadfast merchant portal callback URL auth. Used for delivery status webhooks.
              </p>
            </div>
            <div className="pt-2">
              <Button type="button" variant="primary" onClick={save} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save settings
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Get API Key and Secret from Steadfast merchant panel. Base URL per official doc: <strong>https://portal.packzy.com/api/v1</strong>
        . You can add more couriers (e.g. Pathao) later from this Courier section.
      </p>
    </div>
  )
}
