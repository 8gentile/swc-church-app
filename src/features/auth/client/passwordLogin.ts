import { authClient } from './authClient'

type Result =
  | { success: true; error?: undefined }
  | {
      success: false
      error: { code: string; title: string; message: string }
    }

/**
 * Sign in or sign up with email and password.
 *
 * Uses `sign-up/email`: the server handler turns an existing-user sign-up (422) into
 * `sign-in/email`, so one call covers both new accounts and returning users.
 */
export async function passwordLogin(email: string, password: string): Promise<Result> {
  const normalizedEmail = email.trim().toLowerCase()
  const localPart = normalizedEmail.split('@')[0]?.trim()
  const name = localPart && localPart.length > 0 ? localPart : 'User'

  const { error } = await authClient.signUp.email({
    email: normalizedEmail,
    password,
    name,
  })

  if (!error) {
    return { success: true }
  }

  const { code, message } = standardizeBetterAuthError(error)

  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return {
        success: false,
        error: {
          code,
          title: 'Incorrect Password',
          message: 'The password you entered is incorrect. Please try again.',
        },
      }

    default: {
      return {
        success: false,
        error: {
          code,
          title: 'An Error Occurred',
          message: `Failed to log in: "${message}" (${code}). Please try again.`,
        },
      }
    }
  }
}

export function standardizeBetterAuthError(error: unknown) {
  let code = 'UNKNOWN'
  let message = 'Unknown error'

  if (error && typeof error === 'object') {
    const errorCode = Reflect.get(error, 'code')
    if (errorCode && typeof errorCode === 'string') {
      code = errorCode
    }

    const errorMessage = Reflect.get(error, 'message')
    if (errorMessage && typeof errorMessage === 'string') {
      message = errorMessage
    }
  }

  return { code, message }
}
