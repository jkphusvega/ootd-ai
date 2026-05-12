import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Rate Limiting
  const { allowed, limit } = await checkRateLimit(user.id, 'analyze-ootd');
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: `일일 분석 한도(${limit}회)를 초과했습니다. 내일 다시 시도해주세요.` }),
      { status: 429 }
    );
  }

  if (!apiKey) return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });

  try {
    const body = await request.json();
    const { imageBase64, weatherInfo, userProfile } = body;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const imagePart = {
      inlineData: { data: base64Data, mimeType: 'image/jpeg' as const }
    };

    // thinkingBudget: 0 → thinking 비활성화로 응답 속도 최적화
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.4 },
    });

    let profileContext = '';
    if (userProfile) {
      const parts = [
        userProfile.height && userProfile.weight ? `${userProfile.height}cm ${userProfile.weight}kg` : '',
        userProfile.body_shape || '',
        userProfile.body_goal || '',
        userProfile.fit_preference ? `${userProfile.fit_preference} fit` : '',
        userProfile.style_moods?.length ? userProfile.style_moods.join(', ') : '',
      ].filter(Boolean);
      if (parts.length) profileContext = `User: ${parts.join(' · ')}`;
    }

    const prompt = `Seoul fashion stylist. Analyze this OOTD. Weather: ${weatherInfo.temperature}°C ${weatherInfo.condition}.${profileContext ? ' ' + profileContext : ''}

Return JSON only — no markdown:
{
  "score": <0-100, strict>,
  "headline": "<10자 이내 한 줄 평가. 예: '깔끔하지만 포인트가 아쉬운 룩'>",
  "tips": ["<구체적 개선팁 1>", "<구체적 개선팁 2>", "<구체적 개선팁 3>"]
}

Rules:
- headline: punchy, 10 chars max, Korean
- tips: 3 items, each under 30 chars, specific (item name + action), Korean
- tips must reference weather or body profile if relevant
- Return ONLY raw JSON`;

    // ── 스트리밍 응답 ──
    const streamResult = await model.generateContentStream(
      [prompt, imagePart],
      // @ts-expect-error: thinkingConfig is a valid runtime option for gemini-2.5-flash
      { thinkingConfig: { thinkingBudget: 0 } }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          console.error('Stream error:', e);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process AI Evaluation';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
