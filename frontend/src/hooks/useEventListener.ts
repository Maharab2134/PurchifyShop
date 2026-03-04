import { useEffect, useRef } from 'react'

function useEventListener<K extends keyof WindowEventMap>(
  eventType: K,
  callback: (event: WindowEventMap[K]) => void,
  element?: HTMLElement | Window | Document
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const targetElement = element ?? (typeof window !== 'undefined' ? window : undefined)
    if (!targetElement) return

    const eventListener = (event: Event) =>
      callbackRef.current(event as WindowEventMap[K])
    targetElement.addEventListener(eventType, eventListener)
    return () => targetElement.removeEventListener(eventType, eventListener)
  }, [eventType, element])
}

export default useEventListener
