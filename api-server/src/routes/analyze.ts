import { Request, Response, Router } from 'express';

const router: Router = Router();

const MODEL = 'gemini-2.5-flash-lite';

const PROMPT = `Analyze this screenshot and return ONLY valid JSON — no markdown fences, no code blocks, no extra text:
{
  "type": "<one of: tweet|article|recipe|outfit|product|shoes|code|receipt|meme|chat|other>",
  "title": "<descriptive title under 8 words>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "extracted_text": "<all readable text verbatim, empty string if none>",
  "summary": "<one sentence describing what this screenshot shows>"
}`;

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { base64, mimeType = 'image/jpeg' } = req.body as {
      base64?: string;
      mimeType?: string;
    };

    if (!base64) {
      res.status(400).json({ error: 'base64 image data is required' });
      return;
    }

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      return;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    };

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      req.log.error({ status: geminiRes.status, errText }, 'Gemini API error');
      res.status(geminiRes.status).json({ error: `Gemini error: ${geminiRes.status}` });
      return;
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    try {
      const analysis = JSON.parse(clean) as Record<string, unknown>;
      res.json({
        type: analysis['type'] ?? 'other',
        title: analysis['title'] ?? 'Untitled',
        tags: Array.isArray(analysis['tags']) ? analysis['tags'] : [],
        extracted_text: analysis['extracted_text'] ?? '',
        summary: analysis['summary'] ?? '',
      });
    } catch {
      req.log.warn({ raw }, 'Could not parse Gemini JSON response');
      res.json({
        type: 'other',
        title: 'Unreadable screenshot',
        tags: ['error'],
        extracted_text: '',
        summary: 'Could not parse AI response.',
      });
    }
  } catch (err) {
    req.log.error({ err }, 'Analyze route error');
    res.status(500).json({ error: String((err as Error)?.message ?? err) });
  }
});

export default router;
