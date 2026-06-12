export type ScreenshotType =
  | 'tweet'
  | 'article'
  | 'recipe'
  | 'outfit'
  | 'product'
  | 'shoes'
  | 'code'
  | 'receipt'
  | 'meme'
  | 'chat'
  | 'other';

export type ProcessingStatus = 'pending' | 'analysing' | 'done' | 'error';

export interface ScreenshotCard {
  id: string;
  uri: string;
  type: ScreenshotType;
  title: string;
  tags: string[];
  extracted_text: string;
  summary: string;
  status: ProcessingStatus;
  error?: string;
  createdAt: string;
}

export interface GeminiAnalysis {
  type: ScreenshotType;
  title: string;
  tags: string[];
  extracted_text: string;
  summary: string;
}
