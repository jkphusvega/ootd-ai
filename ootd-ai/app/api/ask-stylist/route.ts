import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { allowed, remaining } = await checkRateLimit(user.id, 'ask-stylist');
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: '오늘 무료 질문 횟수(3회)를 모두 사용했습니다.' }),
      { status: 429 }
    );
  }

  const body = await request.json();
  const { question, critiqueContext, history = [] } = body;

  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: 'No question provided' }), { status: 400 });
  }

  const contextSummary = critiqueContext ? `
이 사용자의 오늘 OOTD 분석 결과:
- 총점: ${critiqueContext.score}점 (평균 65점 기준)
- 헤드라인: "${critiqueContext.headline}"
- 잘된 점: ${critiqueContext.strengths?.join(', ')}
- 개선점: ${critiqueContext.improvements?.join(', ')}
- 스타일링 팁: ${critiqueContext.tips?.join(', ')}
` : '';

  const historyText = history.length > 0
    ? '\n이전 대화:\n' + history.map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? '사용자' : '스타일리스트'}: ${m.content}`
      ).join('\n')
    : '';

  const prompt = `${contextSummary}${historyText}

사용자 질문: ${question}

위 OOTD 분석 결과를 바탕으로 질문에 답해주세요. 3-5문장으로 간결하게, 구체적인 아이템이나 브랜드를 언급해도 좋습니다.

답변에서 구체적인 의류/신발/악세서리 아이템을 추천한 경우, 답변 맨 마지막 줄에 반드시 다음 형식으로 추가하세요 (실제로 추천한 아이템만, 없으면 생략):
##ITEMS: 아이템명1, 아이템명2, 아이템명3`;

  const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];

  let streamResult: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>['generateContentStream']>> | null = null;
  outer: for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.7 },
      systemInstruction: `당신은 서울 기반의 전문 패션 에디터입니다. 패션을 잘 아는 친한 친구처럼 솔직하고 따뜻하게 조언합니다. 구체적인 스타일링 방법, 아이템 추천, 브랜드 제안을 편하게 해줍니다. 한국어로만 답변하고, 마크다운 없이 자연스러운 말투로 씁니다. 아이템을 추천할 때는 답변 마지막 줄에 ##ITEMS: 형식으로 추천 아이템을 나열하세요. 패션/스타일링/코디와 전혀 관계없는 질문(음식, 날씨 감상, 일상 잡담 등)은 한 문장으로 가볍게 패션 주제로 돌려보내세요. 예: "저는 패션 얘기만 할 수 있어요 😄 오늘 코디 고민 있으면 뭐든 물어봐요!"`,
    });
    const callOptions = modelName === 'gemini-2.5-flash' ? { thinkingConfig: { thinkingBudget: 0 } } : {};
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // @ts-expect-error: thinkingConfig is valid at runtime for gemini-2.5-flash
        streamResult = await model.generateContentStream(prompt, callOptions);
        break outer;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        const isRetryable = msg.includes('503') || msg.includes('overloaded');
        if (!isRetryable) throw e;
        if (attempt === 0) await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  if (!streamResult) throw new Error('AI 서비스가 일시적으로 혼잡합니다.');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 남은 횟수를 첫 청크로 전달
      controller.enqueue(encoder.encode(`\x00${remaining}`));
      try {
        for await (const chunk of streamResult!.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
