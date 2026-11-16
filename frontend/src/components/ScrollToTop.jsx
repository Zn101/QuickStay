import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual'
      } catch {
        // ignore in test environments
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        } catch {
          try {
            window.scrollTo(0, 0)
          } catch {
            // ignore jsdom not implemented
          }
        }
      }
    }
  }, [pathname, search])

  return null
}
