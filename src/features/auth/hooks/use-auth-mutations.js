import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth-service'
import { useAuthStore } from '@/features/auth/auth-store'

/**
 * Authentication mutations.
 *
 * Each hook returns the standard TanStack mutation object; forms read
 * `error.details` to map field errors onto inputs and `error.message` for the
 * inline alert.
 */

/** `POST /auth/login` — stores the session on success. */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }) => authService.login({ email, password }),
    onSuccess: (data) => {
      useAuthStore.getState().setSession({
        user: data.user,
        accessToken: data.accessToken,
        expiresIn: data.accessTokenExpiresIn,
      })
      // A fresh session must not inherit another user's cached data.
      queryClient.clear()
    },
  })
}

/**
 * `POST /auth/register`.
 * Does **not** sign the user in: the backend returns the created user and an
 * `emailVerificationRequired` flag, and login is a separate, explicit step.
 */
export function useRegister() {
  return useMutation({
    mutationFn: async ({ name, email, password }) =>
      authService.register({ name, email, password }),
    onSuccess: (data) => {
      useAuthStore.getState().setEmailVerificationRequired(Boolean(data?.emailVerificationRequired))
    },
  })
}

/** `POST /auth/forgot-password` — the response is intentionally generic. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }) => authService.forgotPassword({ email }),
  })
}

/** `POST /auth/reset-password` — consumes a single-use token. */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }) => authService.resetPassword({ token, password }),
  })
}

/** `POST /auth/resend-verification` — only meaningful when verification is on. */
export function useResendVerification() {
  return useMutation({
    mutationFn: async ({ email }) => authService.resendVerification({ email }),
  })
}
