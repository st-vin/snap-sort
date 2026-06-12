import { ScreenshotType } from '@/types';

export interface CategoryMeta {
  type: ScreenshotType | 'all';
  label: string;
  icon: string;
  color: string;
}

export const CATEGORY_META: Record<ScreenshotType | 'all', CategoryMeta> = {
  all: { type: 'all', label: 'All', icon: 'apps', color: '#7C6FFF' },
  tweet: { type: 'tweet', label: 'Tweet', icon: 'logo-twitter', color: '#1D9BF0' },
  article: { type: 'article', label: 'Article', icon: 'newspaper', color: '#9CA3AF' },
  recipe: { type: 'recipe', label: 'Recipe', icon: 'restaurant', color: '#F59E0B' },
  outfit: { type: 'outfit', label: 'Outfit', icon: 'shirt', color: '#EC4899' },
  product: { type: 'product', label: 'Product', icon: 'bag-handle', color: '#8B5CF6' },
  shoes: { type: 'shoes', label: 'Shoes', icon: 'walk', color: '#10B981' },
  code: { type: 'code', label: 'Code', icon: 'code-slash', color: '#06B6D4' },
  receipt: { type: 'receipt', label: 'Receipt', icon: 'document-text', color: '#84CC16' },
  meme: { type: 'meme', label: 'Meme', icon: 'happy', color: '#F97316' },
  chat: { type: 'chat', label: 'Chat', icon: 'chatbubble', color: '#3B82F6' },
  other: { type: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
};

export const ALL_SCREENSHOT_TYPES: ScreenshotType[] = [
  'tweet', 'article', 'recipe', 'outfit', 'product',
  'shoes', 'code', 'receipt', 'meme', 'chat', 'other',
];
