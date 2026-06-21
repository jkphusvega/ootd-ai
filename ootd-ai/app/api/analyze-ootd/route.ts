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

    const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];

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

    const prompt = `아래 OOTD 사진을 심층 분석해주세요.

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
  "tips": ["<실행 가능한 스타일링 팁 1>", "<팁 2>"],
  "weatherNote": "<현재 날씨 기준 이 옷차림의 적합성 한 줄>"
}

작성 규칙:
- headline: 직설적이고 핵심을 찌를 것 (예: "컬러는 완벽, 비율이 발목 잡는 룩")
- strengths/improvements: 각 2개, 구체적인 아이템 언급 필수
- tips: 2개, 당장 실행 가능한 것 (착장 변경, 아이템 추가/교체)
- weatherNote: 날씨와 옷차림의 관계를 한 문장으로
- 모든 텍스트 한국어, JSON만 반환`;

    let streamResult: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>['generateContentStream']>> | null = null;
    outer: for (const modelName of MODELS) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.4 },
        systemInstruction: `당신은 서울 기반의 전문 패션 에디터입니다.
- 평가 기준: 핏·비율·컬러 밸런스·스타일 완성도를 종합해 엄격하게 채점 (100점은 화보급, 평균은 65점)
- 어조: 패션을 잘 아는 친한 친구처럼 솔직하고 따뜻하게, 칭찬과 조언 모두 구체적인 아이템 근거로`,
      });
      // thinkingConfig는 gemini-2.5-flash 전용 — 다른 모델에 보내면 Invalid Argument 에러 발생
      const callOptions = modelName === 'gemini-2.5-flash'
        ? { thinkingConfig: { thinkingBudget: 0 } }
        : {};
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          // @ts-expect-error: thinkingConfig is valid at runtime for gemini-2.5-flash
          streamResult = await model.generateContentStream([prompt, imagePart], callOptions);
          break outer;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          console.error(`[analyze-ootd] ${modelName} attempt ${attempt + 1} failed:`, msg);
          const isRetryable = msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
          if (!isRetryable) throw e;
          if (attempt === 0) await new Promise(r => setTimeout(r, 800));
        }
      }
    }
    if (!streamResult) throw new Error('AI 서비스가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult!.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
          controller.close();
        } catch (e) {
          console.error('Stream error:', e);
          controller.error(e);
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
    const msg = error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
