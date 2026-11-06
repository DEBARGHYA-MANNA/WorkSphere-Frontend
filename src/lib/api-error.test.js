import { describe, expect, it } from 'vitest'
import { ApiError, ApiErrorCode } from '@/lib/api-error'

describe('ApiError', () => {
  it('keeps the backend error code separate from the normalised one', () => {
    const error = new ApiError({
      message: 'Already a member',
      status: 409,
      code: ApiErrorCode.CONFLICT,
      serverCode: 'ALREADY_A_MEMBER',
    })

    expect(error.status).toBe(409)
    expect(error.code).toBe(ApiErrorCode.CONFLICT)
    expect(error.serverCode).toBe('ALREADY_A_MEMBER')
    expect(error.isApiError).toBe(true)
  })

  it('flags network-ish failures', () => {
    expect(new ApiError({ code: ApiErrorCode.NETWORK }).isNetworkError).toBe(true)
    expect(new ApiError({ code: ApiErrorCode.TIMEOUT }).isNetworkError).toBe(true)
    expect(new ApiError({ status: 500 }).isNetworkError).toBe(false)
  })

  it('falls back to a safe generic message', () => {
    expect(new ApiError({}).message).toMatch(/Something went wrong/)
  })
})
