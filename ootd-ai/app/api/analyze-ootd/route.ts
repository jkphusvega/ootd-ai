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
        } finally {
          controller.close();
        }

        // ── fire-and-forget: 응답 반환 후 DB 저장 (블로킹 없음) ──
        (async () => {
          try {
            const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);

              // 1. 이미지 백그라운드 업로드
              let publicUrl = '';
              try {
                const base64Data = imageBase64.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `journal_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
                
                const { error: uploadError } = await supabase.storage
                  .from('clothes')
                  .upload(fileName, buffer, { contentType: 'image/webp' });
                
                if (!uploadError) {
                  const { data } = supabase.storage.from('clothes').getPublicUrl(fileName);
                  publicUrl = data.publicUrl;
                }
              } catch (e) {
                console.error('Background image upload error:', e);
              }

              // 2. 저널 DB 인서트
              await supabase.from('journal_entries').insert({
                user_id: user.id,
                score: parsed.score ?? null,
                weather_condition: weatherInfo?.condition ?? 'Clear',
                temperature: String(weatherInfo?.temperature ?? ''),
                memo: parsed.headline ?? '',
                tags: [],
                image_url: publicUrl,
              });
            }
          } catch (e) {
            console.error('Background processing error:', e);
          }
        })();
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
