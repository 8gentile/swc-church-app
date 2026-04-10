/**
 * demo mode is enabled in development or when VITE_DEMO_MODE=1
 */
function viteEnvFlag(): boolean {
  try {
    return (
      import.meta.env.DEV === true ||
      import.meta.env.VITE_DEMO_MODE === '1' ||
      import.meta.env.VITE_DEMO_MODE === 'true'
    )
  } catch {
    return false
  }
}

export const isDemoMode =
  viteEnvFlag() ||
  (typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'development' || process.env.VITE_DEMO_MODE === '1'))
