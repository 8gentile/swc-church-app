import { router } from 'one'
import { memo, useState } from 'react'
import { H3, Separator, Sheet, XStack, YStack } from 'tamagui'

import { useLogout } from '~/features/auth/useLogout'
import { Logo } from '~/interface/app/Logo'
import { Button } from '~/interface/buttons/Button'
import { DoorIcon } from '~/interface/icons/phosphor/DoorIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { ListIcon } from '~/interface/icons/phosphor/ListIcon'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

import { useAuth } from '~/features/auth/client/authClient'
import { Avatar } from '~/interface/avatars/Avatar'

export const MainHeaderMenu = memo(() => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { logout } = useLogout()

  const handleLogout = () => {
    void logout()
    setOpen(false)
  }
  return (
    <>
      <Button
        variant="transparent"
        circular
        icon={<ListIcon size="$1" />}
        aria-label="Menu"
        onPress={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        transition="medium"
        modal
        dismissOnSnapToBottom
        snapPoints={[50]}
      >
        <Sheet.Overlay
          bg="$shadow6"
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame bg="$color2" boxShadow="0 0 10px $shadow4">
          <YStack flex={1} gap="$2">
            <XStack p="$4" pb="$3" justify="space-between" items="center">
              <XStack gap="$3" items="center">
                <Logo height={32} />
              </XStack>
              <ThemeSwitch />
            </XStack>

            <Separator />

            <YStack flex={1} p="$3" gap="$2">
              <XStack
                p="$3"
                rounded="$4"
                gap="$3"
                items="center"
                hoverStyle={{ bg: '$color3' }}
                pressStyle={{ bg: '$color4' }}
                cursor="pointer"
                onPress={() => {
                  setOpen(false)
                  router.push('/home/settings')
                }}
              >
                <GearIcon />
                <H3 size="$3">Settings</H3>
              </XStack>

              <XStack
                p="$3"
                rounded="$4"
                gap="$3"
                items="center"
                hoverStyle={{ bg: '$color3' }}
                pressStyle={{ bg: '$color4' }}
                cursor="pointer"
                onPress={handleLogout}
              >
                <DoorIcon />
                <H3 size="$3">Logout</H3>
              </XStack>
            </YStack>

            {user && (
              <XStack p="$4" pt="$2" gap="$3" items="center">
                <Avatar size={40} image={user.image} name={user.name ?? 'User'} />
                <YStack flex={1}>
                  <H3 size="$3" fontWeight="600">
                    {user.name || user.email}
                  </H3>
                </YStack>
              </XStack>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
})
