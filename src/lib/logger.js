import { env } from '@/lib/env'

/**
 * Minimal logger. In production only warnings/errors are emitted, and callers
 * are responsible for never passing tokens, passwords or personal data.
 */
const noop = () => {}

const isEnabled = env.isDev

export const logger = {
  debug: isEnabled ? (...args) => console.warn('[worksphere:debug]', ...args) : noop,
  info: isEnabled ? (...args) => console.warn('[worksphere:info]', ...args) : noop,
  warn: (...args) => console.warn('[worksphere]', ...args),
  error: (...args) => console.error('[worksphere]', ...args),
}

export default logger
