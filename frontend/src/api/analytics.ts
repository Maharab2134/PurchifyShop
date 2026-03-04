import axiosInstance from '@/utils/axiosInstance'

const ANALYTICS_SESSION_KEY = 'analytics_session_id'

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem(ANALYTICS_SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(ANALYTICS_SESSION_KEY, sid)
  }
  return sid
}

export async function trackPageView(path: string, referrer?: string): Promise<void> {
  try {
    await axiosInstance.post<{ sessionId?: string }>('/track-page-view', {
      path,
      referrer: referrer || (typeof document !== 'undefined' ? document.referrer : undefined) || null,
      sessionId: getAnalyticsSessionId(),
    })
  } catch {
    // ignore
  }
}
