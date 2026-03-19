import { getAPIKeyWithRotation, incrementAPIKeyUsage, recordAPIKeyError } from './apiKeyService';

/**
 * Translate text using Gemini API
 */
export async function translateWithGemini(
  text: string,
  targetLang: string = 'vi',
  sourceLang: string = 'auto'
): Promise<string> {
  let currentKeyId: string | undefined;
  let retries = 3;

  while (retries > 0) {
    try {
      // Get API key with rotation
      const keyInfo = await getAPIKeyWithRotation('gemini', currentKeyId);
      if (!keyInfo) {
        throw new Error('Không có API key Gemini nào khả dụng');
      }

      currentKeyId = keyInfo.id;

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keyInfo.api_key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Dịch đoạn văn bản sau sang ${targetLang === 'vi' ? 'tiếng Việt' : targetLang}. Chỉ trả về bản dịch, không thêm giải thích:\n\n${text}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        // Record error
        await recordAPIKeyError(keyInfo.id, errorMessage);

        // If rate limit or quota exceeded, try next key
        if (response.status === 429 || response.status === 403) {
          currentKeyId = keyInfo.id; // Exclude this key
          retries--;
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const translatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

      // Increment usage on success
      await incrementAPIKeyUsage(keyInfo.id);

      return translatedText;
    } catch (error: any) {
      console.error('Gemini translation error:', error);
      if (retries <= 1) {
        // Fallback to Google Translate if all retries failed
        return translateWithGoogleTranslate(text, targetLang, sourceLang);
      }
      retries--;
    }
  }

  // Final fallback
  return translateWithGoogleTranslate(text, targetLang, sourceLang);
}

/**
 * Translate text using Perplexity API
 */
export async function translateWithPerplexity(
  text: string,
  targetLang: string = 'vi',
  sourceLang: string = 'auto'
): Promise<string> {
  let currentKeyId: string | undefined;
  let retries = 3;

  while (retries > 0) {
    try {
      // Get API key with rotation
      const keyInfo = await getAPIKeyWithRotation('perplexity', currentKeyId);
      if (!keyInfo) {
        throw new Error('Không có API key Perplexity nào khả dụng');
      }

      currentKeyId = keyInfo.id;

      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyInfo.api_key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: `Dịch đoạn văn bản sau sang ${targetLang === 'vi' ? 'tiếng Việt' : targetLang}. Chỉ trả về bản dịch, không thêm giải thích:\n\n${text}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        // Record error
        await recordAPIKeyError(keyInfo.id, errorMessage);

        // If rate limit or quota exceeded, try next key
        if (response.status === 429 || response.status === 403) {
          currentKeyId = keyInfo.id; // Exclude this key
          retries--;
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim() || text;

      // Increment usage on success
      await incrementAPIKeyUsage(keyInfo.id);

      return translatedText;
    } catch (error: any) {
      console.error('Perplexity translation error:', error);
      if (retries <= 1) {
        // Fallback to Google Translate if all retries failed
        return translateWithGoogleTranslate(text, targetLang, sourceLang);
      }
      retries--;
    }
  }

  // Final fallback
  return translateWithGoogleTranslate(text, targetLang, sourceLang);
}

/**
 * Fallback: Translate using Google Translate (free, no API key needed)
 */
export async function translateWithGoogleTranslate(
  text: string,
  targetLang: string = 'vi',
  sourceLang: string = 'auto'
): Promise<string> {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item: any[]) => item[0]).join('');
    }

    throw new Error('Invalid translation response');
  } catch (error) {
    console.error('Google Translate error:', error);
    return `[Lỗi dịch] ${text}`;
  }
}

/**
 * Main translate function - tries Gemini first, then Perplexity, then Google Translate
 */
export async function translateText(
  text: string,
  targetLang: string = 'vi',
  sourceLang: string = 'auto',
  preferredProvider: 'gemini' | 'perplexity' | 'auto' = 'auto'
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    if (preferredProvider === 'gemini') {
      return await translateWithGemini(text, targetLang, sourceLang);
    } else if (preferredProvider === 'perplexity') {
      return await translateWithPerplexity(text, targetLang, sourceLang);
    } else {
      // Auto: Try Gemini first, then Perplexity, then Google Translate
      try {
        return await translateWithGemini(text, targetLang, sourceLang);
      } catch (error) {
        console.warn('Gemini translation failed, trying Perplexity:', error);
        try {
          return await translateWithPerplexity(text, targetLang, sourceLang);
        } catch (error2) {
          console.warn('Perplexity translation failed, using Google Translate:', error2);
          return await translateWithGoogleTranslate(text, targetLang, sourceLang);
        }
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
    return `[Lỗi dịch] ${text}`;
  }
}

/**
 * AI Chat using Gemini
 */
export async function chatWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  let currentKeyId: string | undefined;
  let retries = 3;

  while (retries > 0) {
    try {
      const keyInfo = await getAPIKeyWithRotation('gemini', currentKeyId);
      if (!keyInfo) {
        throw new Error('Không có API key Gemini nào khả dụng');
      }

      currentKeyId = keyInfo.id;

      const contents = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      if (systemPrompt) {
        contents.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }],
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keyInfo.api_key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        await recordAPIKeyError(keyInfo.id, errorMessage);

        if (response.status === 429 || response.status === 403) {
          currentKeyId = keyInfo.id;
          retries--;
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      await incrementAPIKeyUsage(keyInfo.id);

      return reply;
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      if (retries <= 1) {
        throw error;
      }
      retries--;
    }
  }

  throw new Error('Không thể kết nối với Gemini API');
}

/**
 * AI Chat using Perplexity
 */
export async function chatWithPerplexity(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  let currentKeyId: string | undefined;
  let retries = 3;

  while (retries > 0) {
    try {
      const keyInfo = await getAPIKeyWithRotation('perplexity', currentKeyId);
      if (!keyInfo) {
        throw new Error('Không có API key Perplexity nào khả dụng');
      }

      currentKeyId = keyInfo.id;

      const chatMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (systemPrompt) {
        chatMessages.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyInfo.api_key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: chatMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        await recordAPIKeyError(keyInfo.id, errorMessage);

        if (response.status === 429 || response.status === 403) {
          currentKeyId = keyInfo.id;
          retries--;
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '';

      await incrementAPIKeyUsage(keyInfo.id);

      return reply;
    } catch (error: any) {
      console.error('Perplexity chat error:', error);
      if (retries <= 1) {
        throw error;
      }
      retries--;
    }
  }

  throw new Error('Không thể kết nối với Perplexity API');
}

