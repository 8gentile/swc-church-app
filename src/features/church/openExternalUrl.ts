import { Linking, Platform } from 'react-native'

/** Opens HTTPS URLs in the system browser (new tab on web). */
export async function openExternalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const can = await Linking.canOpenURL(url)
  if (!can) {
    throw new Error('Cannot open URL')
  }
  await Linking.openURL(url)
}
