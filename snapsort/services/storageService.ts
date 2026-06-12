import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenshotCard } from '@/types';

const STORAGE_KEY = 'snapsort_cards_v1';

export async function loadCards(): Promise<ScreenshotCard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScreenshotCard[]) : [];
  } catch {
    return [];
  }
}

export async function saveCard(card: ScreenshotCard): Promise<void> {
  try {
    const existing = await loadCards();
    const updated = [card, ...existing.filter(c => c.id !== card.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // fail silently — in-memory state still works
  }
}

export async function deleteCard(id: string): Promise<void> {
  try {
    const existing = await loadCards();
    const updated = existing.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // fail silently
  }
}

export async function clearAllCards(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
