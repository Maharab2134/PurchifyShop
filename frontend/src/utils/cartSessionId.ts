const CART_SESSION_KEY = 'cartSessionId'

function randomId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
}

export function getCartSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(CART_SESSION_KEY)
  if (!id) {
    id = randomId()
    localStorage.setItem(CART_SESSION_KEY, id)
  }
  return id
}
