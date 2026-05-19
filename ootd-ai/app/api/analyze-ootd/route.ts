import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.4 },
    });

    let profileContext = '';
    if (userProfile) {
      const parts = [
        userProfile.height && userProfile.weight ? `키 ${userProfile.height}cm, 몸무게 ${userProfile.weight}kg` : '',
        userProfile.fit_preference ? `선호 핏: ${userProfile.fit_preference}` : '',
        userProfile.style_moods?.length ? `스타일: ${userProfile.style_moods.join(', ')}` : '',
        userProfile.body_goal ? `바디 목표: ${userProfile.body_goal}` : '',
      ].filter(Boolean);
      if (parts.length) profileContext = `\n착용자 정보: ${parts.join(' / ')}`;
    }

    const prompt = `당신은 서울 기반의 전문 패션 에디터입니다. 아래 OOTD 사진을 심층 분석해주세요.

날씨: ${weatherInfo.temperature}°C, ${weatherInfo.condition}${profileContext}

다음 JSON만 반환하세요 (마크다운 없이):
{
  "score": <전체 점수 0-100, 엄격하게>,
  "fit": <핏·실루엣 점수 0-100>,
  "color": <컬러 조합 점수 0-100>,
  "styling": <스타일링 완성도 점수 0-100>,
  "weather": <날씨 적합도 점수 0-100>,
  "headline": "<전체 룩을 꿰뚫는 한 줄 평, 20자 이내, 직설적, 한국어>",
  "strengths": ["<이 룩에서 잘된 점 1, 구체적 아이템 언급>", "<잘된 점 2>"],
  "improvements": ["<구체적 개선점 1, 아이템+방향>", "<구체적 개선점 2>"],
  "tips": ["<실행 가능한 스타일링 팁 1>", "<팁 2>", "<팁 3>"],
  "weatherNote": "<현재 날씨 기준 이 옷차림의 적합성 한 줄>"
}

작성 규칙:
- headline: 직설적이고 핵심을 찌를 것 (예: "컬러는 완벽, 비율이 발목 잡는 룩")
- strengths/improvements: 각 2개, 구체적인 아이템 언급 필수
- tips: 3개, 당장 실행 가능한 것 (착장 변경, 아이템 추가/교체)
- weatherNote: 날씨와 옷차림의 관계를 한 문장으로
- 모든 텍스트 한국어, JSON만 반환`;

    const streamResult = await model.generateContentStream(
      [prompt, imagePart],
      // @ts-expect-error: thinkingConfig is valid at runtime for gemini-2.5-flash
      { thinkingConfig: { thinkingBudget: 0 } }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
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
    const msg = error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
