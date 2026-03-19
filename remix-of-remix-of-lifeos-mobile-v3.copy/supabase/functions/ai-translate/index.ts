import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, sourceLanguage, targetLanguage, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'translate':
        systemPrompt = `You are a professional translator specializing in app/software localization. 
Translate the given content accurately while:
- Preserving technical terms and placeholders (like {name}, {{count}}, etc.)
- Maintaining the same tone and formality level
- Adapting cultural references appropriately
- Keeping the translation concise for UI elements
Return ONLY the translated text, nothing else.`;
        userPrompt = `Translate the following from ${sourceLanguage} to ${targetLanguage}:

"${content}"

${context ? `Context: ${context}` : ''}`;
        break;

      case 'batch-translate':
        systemPrompt = `You are a professional translator for app localization.
Translate each key-value pair accurately while preserving:
- All placeholders like {name}, {{count}}, %s, etc.
- The same tone and formality
- Technical terms

Return a valid JSON object with the same keys but translated values.`;
        userPrompt = `Translate the following JSON from ${sourceLanguage} to ${targetLanguage}:

${JSON.stringify(content, null, 2)}

Return ONLY the JSON object with translated values.`;
        break;

      case 'detect-language':
        systemPrompt = `You are a language detection expert. Identify the language of the given text.
Return ONLY a JSON object with: { "language": "language name", "code": "ISO 639-1 code", "confidence": 0.0-1.0 }`;
        userPrompt = `Detect the language of: "${content}"`;
        break;

      case 'suggest-translations':
        systemPrompt = `You are a localization expert. Suggest multiple translation variants for the given text.
Consider different contexts, formality levels, and regional variations.
Return a JSON array of objects: [{ "translation": "text", "context": "when to use", "formality": "formal/informal/neutral" }]`;
        userPrompt = `Suggest translation variants from ${sourceLanguage} to ${targetLanguage} for:

"${content}"

${context ? `Context: ${context}` : ''}

Provide 3-5 different options.`;
        break;

      case 'improve-translation':
        systemPrompt = `You are a translation quality expert. Review and improve the given translation.
Check for:
- Accuracy and faithfulness to the original
- Natural flow in the target language
- Cultural appropriateness
- UI/UX suitability (conciseness, clarity)

Return JSON: { "improved": "improved translation", "issues": ["list of issues found"], "suggestions": ["improvement suggestions"] }`;
        userPrompt = `Original (${sourceLanguage}): "${content.original}"
Current translation (${targetLanguage}): "${content.translation}"

${context ? `Context: ${context}` : ''}`;
        break;

      default:
        throw new Error(`Unknown translation type: ${type}`);
    }

    console.log(`Processing ${type} request: ${sourceLanguage} -> ${targetLanguage}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '';

    console.log('AI response:', resultText);

    // Parse JSON responses
    if (['batch-translate', 'detect-language', 'suggest-translations', 'improve-translation'].includes(type)) {
      try {
        // Extract JSON from markdown code blocks if present
        let jsonStr = resultText;
        const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }
        const parsed = JSON.parse(jsonStr);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return new Response(JSON.stringify({ result: resultText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ result: resultText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
