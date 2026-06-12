import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  base64: string;
  mimeType: string;
}

export async function pickScreenshots(): Promise<PickedImage[]> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera roll permission denied. Please allow access in Settings.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images' as any,
    allowsMultipleSelection: true,
    selectionLimit: 20,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return [];

  return result.assets
    .filter(a => !!a.base64)
    .map(a => ({
      uri: a.uri,
      base64: a.base64!,
      mimeType: (a as any).mimeType ?? 'image/jpeg',
    }));
}
