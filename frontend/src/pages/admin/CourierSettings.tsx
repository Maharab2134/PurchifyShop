import { useEffect, useState } from 'react'
import { Truck, Key, Save, Loader2, Eye, EyeOff, Settings, Package } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

type CourierTab = 'steadfast' | 'pathao'

const TABS: { id: CourierTab; label: string; icon: typeof Truck }[] = [
  { id: 'steadfast', label: 'Steadfast Settings', icon: Package },
  { id: 'pathao', label: 'Pathao Settings', icon: Truck },
]

export default function AdminCourierSettings() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<CourierTab>('steadfast')

  // Steadfast
  const [sfApiKey, setSfApiKey] = useState('')
  const [sfSecretKey, setSfSecretKey] = useState('')
  const [sfBaseUrl, setSfBaseUrl] = useState('https://portal.packzy.com/api/v1')
  const [sfWebhookToken, setSfWebhookToken] = useState('')
  const [sfActive, setSfActive] = useState(true)
  const [sfLoading, setSfLoading] = useState(true)
  const [sfSaving, setSfSaving] = useState(false)
  const [sfShowApiKey, setSfShowApiKey] = useState(false)
  const [sfShowSecretKey, setSfShowSecretKey] = useState(false)
  const [sfShowWebhook, setSfShowWebhook] = useState(false)

  // Pathao
  const [paApiKey, setPaApiKey] = useState('')
  const [paSecretKey, setPaSecretKey] = useState('')
  const [paBaseUrl, setPaBaseUrl] = useState('https://api-hermes.pathao.com')
  const [paStoreId, setPaStoreId] = useState('')
  const [paUsername, setPaUsername] = useState('')
  const [paPassword, setPaPassword] = useState('')
  const [paActive, setPaActive] = useState(true)
  const [paLoading, setPaLoading] = useState(true)
  const [paSaving, setPaSaving] = useState(false)
  const [paShowApiKey, setPaShowApiKey] = useState(false)
  const [paShowSecretKey, setPaShowSecretKey] = useState(false)
  const [paShowPassword, setPaShowPassword] = useState(false)

  const loadSteadfast = async () => {
    setSfLoading(true)
    try {
      const res = await adminApi.courier.steadfast.getSettings()
      const d = res.data.data
      setSfApiKey(d?.apiKey ?? '')
      setSfSecretKey(d?.secretKey ?? '')
      setSfBaseUrl(d?.baseUrl ?? 'https://portal.packzy.com/api/v1')
      setSfWebhookToken(d?.webhookBearerToken ?? '')
      setSfActive(d?.active ?? true)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      showToast(msg, 'error')
    } finally {
      setSfLoading(false)
    }
  }

  const loadPathao = async () => {
    setPaLoading(true)
    try {
      const res = await adminApi.courier.pathao.getSettings()
      const d = res.data.data
      setPaApiKey(d?.apiKey ?? '')
      setPaSecretKey(d?.secretKey ?? '')
      setPaBaseUrl(d?.baseUrl ?? 'https://api-hermes.pathao.com')
      setPaStoreId(d?.storeId ?? '')
      setPaUsername(d?.username ?? '')
      setPaActive(d?.active ?? true)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      showToast(msg, 'error')
    } finally {
      setPaLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'steadfast') loadSteadfast()
    else loadPathao()
  }, [activeTab])

  const saveSteadfast = async () => {
    setSfSaving(true)
    try {
      await adminApi.courier.steadfast.updateSettings({
        apiKey: sfApiKey.trim() || undefined,
        secretKey: sfSecretKey.trim() || undefined,
        baseUrl: sfBaseUrl.trim() || undefined,
        webhookBearerToken: sfWebhookToken.trim() || undefined,
        active: sfActive,
      })
      showToast('Steadfast settings saved', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'
      showToast(msg, 'error')
    } finally {
      setSfSaving(false)
    }
  }

  const savePathao = async () => {
    setPaSaving(true)
    try {
      await adminApi.courier.pathao.updateSettings({
        apiKey: paApiKey.trim() || undefined,
        secretKey: paSecretKey.trim() || undefined,
        baseUrl: paBaseUrl.trim() || undefined,
        storeId: paStoreId.trim() || undefined,
        username: paUsername.trim() || undefined,
        password: paPassword ? paPassword : undefined,
        active: paActive,
      })
      if (paPassword) setPaPassword('')
      showToast('Pathao settings saved', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'
      showToast(msg, 'error')
    } finally {
      setPaSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Courier Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure API credentials for each courier. Add Steadfast Settings, Pathao Settings, or more couriers below.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Steadfast Settings */}
      {activeTab === 'steadfast' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Steadfast API credentials</h2>
          </div>
          {sfLoading ? (
            <div className="p-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Steadfast Courier Service</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sfActive}
                  onClick={() => setSfActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${sfActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${sfActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">{sfActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={sfShowApiKey ? 'text' : 'password'}
                    value={sfApiKey}
                    onChange={(e) => setSfApiKey(e.target.value)}
                    placeholder="Steadfast API Key"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setSfShowApiKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={sfShowApiKey ? 'Hide' : 'Show'} aria-label={sfShowApiKey ? 'Hide API Key' : 'Show API Key'}>
                    {sfShowApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                <div className="relative">
                  <input
                    type={sfShowSecretKey ? 'text' : 'password'}
                    value={sfSecretKey}
                    onChange={(e) => setSfSecretKey(e.target.value)}
                    placeholder="Steadfast Secret Key"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setSfShowSecretKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={sfShowSecretKey ? 'Hide' : 'Show'} aria-label={sfShowSecretKey ? 'Hide Secret Key' : 'Show Secret Key'}>
                    {sfShowSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL</label>
                <input type="url" value={sfBaseUrl} onChange={(e) => setSfBaseUrl(e.target.value)} placeholder="https://portal.packzy.com/api/v1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Bearer Token (optional)</label>
                <div className="relative">
                  <input
                    type={sfShowWebhook ? 'text' : 'password'}
                    value={sfWebhookToken}
                    onChange={(e) => setSfWebhookToken(e.target.value)}
                    placeholder="Token for webhook callbacks"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setSfShowWebhook((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={sfShowWebhook ? 'Hide' : 'Show'} aria-label={sfShowWebhook ? 'Hide token' : 'Show token'}>
                    {sfShowWebhook ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Set in Steadfast merchant portal callback URL auth.</p>
              </div>
              <Button type="button" variant="primary" onClick={saveSteadfast} disabled={sfSaving}>
                {sfSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Saving…</> : <><Save className="w-4 h-4 mr-2 inline" /> Save Steadfast settings</>}
              </Button>
            </div>
          )}
          <p className="px-5 pb-4 text-xs text-gray-500 dark:text-gray-400">
            Base URL per official doc: <strong>https://portal.packzy.com/api/v1</strong>. Get API Key & Secret from Steadfast merchant panel.
          </p>
        </div>
      )}

      {/* Pathao Settings */}
      {activeTab === 'pathao' && (
        <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pathao API credentials</h2>
          </div>
          {paLoading ? (
            <div className="p-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30 px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pathao Courier Service</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={paActive}
                  onClick={() => setPaActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${paActive ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${paActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">{paActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
                <div className="relative">
                  <input
                    type={paShowApiKey ? 'text' : 'password'}
                    value={paApiKey}
                    onChange={(e) => setPaApiKey(e.target.value)}
                    placeholder="Pathao Client ID"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setPaShowApiKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={paShowApiKey ? 'Hide' : 'Show'} aria-label={paShowApiKey ? 'Hide API Key' : 'Show API Key'}>
                    {paShowApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Secret</label>
                <div className="relative">
                  <input
                    type={paShowSecretKey ? 'text' : 'password'}
                    value={paSecretKey}
                    onChange={(e) => setPaSecretKey(e.target.value)}
                    placeholder="Pathao Client Secret"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setPaShowSecretKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={paShowSecretKey ? 'Hide' : 'Show'} aria-label={paShowSecretKey ? 'Hide Secret Key' : 'Show Secret Key'}>
                    {paShowSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base URL</label>
                <input type="url" value={paBaseUrl} onChange={(e) => setPaBaseUrl(e.target.value)} placeholder="https://api-hermes.pathao.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pathao Merchant API: https://api-hermes.pathao.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Pathao Merchant login)</label>
                <input type="text" value={paUsername} onChange={(e) => setPaUsername(e.target.value)} placeholder="Merchant email / username" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" autoComplete="username" />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Required for parcel creation (OAuth).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (Pathao Merchant login)</label>
                <div className="relative">
                  <input
                    type={paShowPassword ? 'text' : 'password'}
                    value={paPassword}
                    onChange={(e) => setPaPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setPaShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-400" title={paShowPassword ? 'Hide' : 'Show'} aria-label={paShowPassword ? 'Hide password' : 'Show password'}>
                    {paShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Required for parcel creation. Leave blank to keep existing password.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store ID (required for parcel creation)</label>
                <input type="text" value={paStoreId} onChange={(e) => setPaStoreId(e.target.value)} placeholder="Pathao Store ID" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Get store list from Pathao Merchant panel or API.</p>
              </div>
              <Button type="button" variant="primary" onClick={savePathao} disabled={paSaving}>
                {paSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Saving…</> : <><Save className="w-4 h-4 mr-2 inline" /> Save Pathao settings</>}
              </Button>
            </div>
          )}
          <p className="px-5 pb-4 text-xs text-gray-500 dark:text-gray-400">
            Get API access from <a href="https://merchant.pathao.com/courier/developer-api" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">Pathao Merchant Developer API</a>
          </p>
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        You can add more couriers later by adding a new tab and settings API. All control is manual from Courier → Steadfast Courier Management (or Pathao Management when added).
      </p>
    </div>
  )
}
