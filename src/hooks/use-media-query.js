import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query.
 * @param {string} query e.g. '(min-width: 1024px)'
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const media = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True on viewports below the `lg` breakpoint (mobile nav drawer). */
export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)')
}

/** True while the user asks for reduced motion. */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
