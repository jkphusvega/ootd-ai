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
      profileContext = `
The user's body profile:
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Preferred fit: ${userProfile.fit_preference}
- Style preferences: ${userProfile.style_moods?.join(', ') || 'Not specified'}
Take these into account when giving fit and styling advice.`;
    }

    const prompt = `You are a highly sought-after, trendy celebrity fashion stylist in Seoul. 
You are extremely sensitive to current fashion trends (like Y2K, Gorpcore, Minimal, Old Money, etc.) and know exactly how to make anyone look effortlessly stylish.
Analyze this user's OOTD (Outfit of the Day) carefully. The current weather is ${weatherInfo.temperature}°C, ${weatherInfo.condition}.
${profileContext}

Provide warm but honest, sharp styling advice. Do not use overly difficult avant-garde fashion jargon that normal people can't understand. Use trendy but accessible brand/fit terms (e.g., "와이드 팬츠", "레더 자켓", "고프코어 감성", "아식스 스니커즈", "실버 악세서리", "크롭 기장", "톤온톤").
If the outfit is too generic or boring, tell them exactly how to elevate it with a 1-2 point items (like a specific color or a trendy accessory).

Structure your JSON EXACTLY like this:
{
  "score": <0-100 score strictly evaluated based on real-world trendy fashion standards>,
  "summary": "<A catchy, short headline. E.g., '깔끔하지만 한 끗의 포인트가 아쉬운 룩'>",
  "weatherAdvice": "<How this fit handles the ${weatherInfo.temperature}°C weather.>",
  "fitAndColor": "<Honest critique on the silhouette and colors. Use friendly but professional fashion terms.>",
  "stylistRecommendation": "<At least 2 highly specific, trendy recommendations to upgrade the look.>"
}
Write EVERYTHING in Korean. Keep the tone friendly, incredibly trendy, and professional like a star's personal stylist. Return ONLY raw JSON string. No markdown brackets whatsoever.`;

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
        try {
          const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            Promise.resolve(supabase.from('journal_entries').insert({
              user_id: user.id,
              score: parsed.score ?? null,
              weather_condition: weatherInfo?.condition ?? 'Clear',
              temperature: String(weatherInfo?.temperature ?? ''),
              memo: parsed.summary ?? '',
              tags: [],
              image_url: '',
            })).catch(() => {/* 비핵심 기능: 저장 실패 무시 */});
          }
        } catch {
          // 파싱 실패해도 무시
        }
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
