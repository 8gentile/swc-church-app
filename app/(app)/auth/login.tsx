import { router } from 'one'
import { useState } from 'react'
import { Circle, isWeb, Spinner, XStack, YStack } from 'tamagui'

import { APP_NAME } from '~/constants/app'
import { authClient } from '~/features/auth/client/authClient'
import { signInAsDemo } from '~/features/auth/client/signInAsDemo'
import { isDemoMode } from '~/helpers/isDemoMode'
import { Link } from '~/interface/app/Link'
import { LogoIcon } from '~/interface/app/LogoIcon'
import { Button } from '~/interface/buttons/Button'
import { AppleIcon } from '~/interface/icons/AppleIcon'
import { GoogleIcon } from '~/interface/icons/GoogleIcon'
import { H2 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'

export const LoginPage = () => {
  const [demoLoading, setDemoLoading] = useState<boolean>(false)
  const [socialBusy, setSocialBusy] = useState<'google' | 'apple' | null>(null)

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialBusy(provider)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const callbackURL = `${origin}/home/feed`
      const res = await authClient.signIn.social({
        provider,
        callbackURL,
      })

      if (res.error) {
        const code =
          res.error && typeof res.error === 'object' && 'code' in res.error
            ? String((res.error as { code?: string }).code)
            : ''
        const message =
          code === 'PROVIDER_NOT_FOUND'
            ? 'Google or Apple sign-in is not configured on the server. Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (and Apple keys if needed), or use Continue with Email.'
            : ((res.error as { message?: string })?.message ?? 'Social sign-in failed')
        showToast(message, { type: 'error' })
        return
      }

      const url = (res.data as { url?: string } | undefined)?.url
      if (typeof window !== 'undefined' && url) {
        window.location.assign(url)
      }
    } catch (e) {
      console.error(e)
      showToast(
        e instanceof Error
          ? e.message
          : 'Could not start social sign-in. Is the auth API running?',
        { type: 'error' },
      )
    } finally {
      setSocialBusy(null)
    }
  }

  return (
    <YStack
      flex={1}
      justify="center"
      items="center"
      width="100%"
      maxW="100%"
      $platform-web={{ minHeight: '100dvh' }}
    >
      <Circle
        size={80}
        my="$4"
        transition="medium"
        enterStyle={{ scale: 0.95, opacity: 0 }}
      >
        <LogoIcon size={42} />
      </Circle>

      <YStack
        gap="$6"
        width="100%"
        items="center"
        bg="$background"
        rounded="$8"
        p={isWeb ? '$6' : '$4'}
        maxW={isWeb ? 400 : '90%'}
      >
        <H2 text="center">Login to {APP_NAME}</H2>

        <YStack
          key="welcome-content"
          gap="$4"
          items="center"
          width="100%"
          transition="medium"
          enterStyle={{ opacity: 0, y: 10 }}
          exitStyle={{ opacity: 0, y: -10 }}
          position="relative"
          overflow="hidden"
        >
          <YStack width="100%" gap="$3">
            <Link
              href="/auth/signup/email"
              $platform-web={{
                display: 'contents',
              }}
              asChild
            >
              <Button
                size="$5"
                theme="dark_blue"
                variant="floating"
                pressStyle={{
                  scale: 0.97,
                  opacity: 0.9,
                }}
                transition="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
              >
                Continue with Email
              </Button>
            </Link>

            {/* DEMO mode - enabled in dev or when VITE_DEMO_MODE=1 */}
            {isDemoMode && (
              <Button
                variant="outlined"
                size="$5"
                onPress={async () => {
                  setDemoLoading(true)
                  const { error } = await signInAsDemo()
                  setDemoLoading(false)
                  if (error) {
                    const msg =
                      (error as { message?: string })?.message ??
                      'Demo login failed. Start Postgres and run the backend (e.g. bun backend) so /api/auth is available.'
                    showToast(msg, { type: 'error' })
                    return
                  }
                  router.replace('/home/feed')
                }}
                disabled={demoLoading}
                width="100%"
                data-testid="login-as-demo"
                pressStyle={{
                  scale: 0.97,
                }}
                transition="200ms"
                enterStyle={{ opacity: 0, scale: 0.95 }}
              >
                {demoLoading ? <Spinner size="small" /> : 'Login as Demo User'}
              </Button>
            )}
          </YStack>

          <XStack width="100%" gap="$3" justify="center" overflow="visible">
            <Button
              size="$5"
              onPress={() => handleSocialLogin('google')}
              disabled={!!socialBusy}
              pressStyle={{
                scale: 0.97,
                bg: '$color2',
              }}
              hoverStyle={{
                bg: '$color2',
              }}
              transition="200ms"
              enterStyle={{ opacity: 0, scale: 0.95 }}
              icon={
                socialBusy === 'google' ? (
                  <Spinner size="small" />
                ) : (
                  <GoogleIcon size={18} />
                )
              }
            />

            <Button
              size="$5"
              onPress={() => handleSocialLogin('apple')}
              disabled={!!socialBusy}
              pressStyle={{
                scale: 0.97,
                bg: '$color2',
              }}
              hoverStyle={{
                bg: '$color2',
              }}
              transition="200ms"
              enterStyle={{ opacity: 0, scale: 0.95 }}
              icon={
                socialBusy === 'apple' ? (
                  <Spinner size="small" />
                ) : (
                  <AppleIcon size={20} />
                )
              }
            />
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
