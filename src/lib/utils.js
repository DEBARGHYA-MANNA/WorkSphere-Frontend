import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind utilities.
 * @param {...any} inputs clsx-compatible class inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with locale-aware separators, falling back to a dash for
 * missing values so tables never render "undefined".
 * @param {number|null|undefined} value
 * @param {Intl.NumberFormatOptions} [options]
 */
export function formatNumber(value, options) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat(undefined, options).format(Number(value))
}

/**
 * Percentage of `part` in `total`, clamped to 0–100. Returns 0 for bad input.
 */
export function percentage(part, total) {
  const p = Number(part)
  const t = Number(total)
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((p / t) * 100)))
}

/**
 * Turn a string into initials (max 2 chars) for avatars.
 */
export function initialsOf(nameOrEmail = '') {
  const value = String(nameOrEmail).trim()
  if (!value) return '?'
  const namePart = value.includes('@') ? value.split('@')[0].replace(/[._-]+/g, ' ') : value
  const words = namePart.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Build a human friendly title from a slug such as `my-tasks`.
 */
export function titleFromSlug(slug = '') {
  return String(slug)
    .split(/[-_/]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Clamp a number between min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Debounce a function. Returns the debounced fn plus a `.cancel()`. */
export function debounce(fn, wait = 300) {
  let timer = null
  const debounced = (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  debounced.flush = (...args) => {
    if (timer) clearTimeout(timer)
    timer = null
    fn(...args)
  }
  return debounced
}

/**
 * Safely read a nested property with a fallback.
 * `get(obj, 'a.b.c', null)`
 */
export function get(obj, path, fallback = undefined) {
  const result = String(path)
    .split('.')
    .reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj)
  return result === undefined ? fallback : result
}
