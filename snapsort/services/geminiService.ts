import { GeminiAnalysis } from '@/types';

const getApiUrl = () => {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
  return `${base}/api/analyze`;
};

export async function analyzeImage(
  base64: string,
  mimeType = 'image/jpeg',
): Promise<GeminiAnalysis> {
  const url = getApiUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mimeType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status));
    throw new Error(`Analysis failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as GeminiAnalysis & { error?: string };

  if (data.error) throw new Error(data.error);

  return {
    type: data.type ?? 'other',
    title: data.title ?? 'Untitled',
    tags: Array.isArray(data.tags) ? data.tags : [],
    extracted_text: data.extracted_text ?? '',
    summary: data.summary ?? '',
  };
}
