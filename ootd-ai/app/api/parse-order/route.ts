import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, 'segment-clothes');
  if (!allowed) return NextResponse.json({ error: '요청 한도 초과' }, { status: 429 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const commaIdx = image.indexOf(',');
    if (commaIdx === -1) return NextResponse.json({ error: '이미지 형식 오류' }, { status: 400 });
    const mimeType = image.slice(0, commaIdx).split(':')[1]?.split(';')[0] || 'image/jpeg';
    const base64Data = image.slice(commaIdx + 1);

    const prompt = `이것은 한국 패션 쇼핑몰(무신사, 29CM 등)의 주문 내역 스크린샷입니다.

주문 목록에서 의류/패션 아이템을 모두 추출하세요. 각 아이템에 대해:
- "brand": 브랜드명
- "productName": 화면에 표시된 원래 상품명
- "koreanName": 짧은 한국어 이름 (색상+스타일+종류, 최대 15자). 예: "화이트 그래픽 반팔티", "블랙 배럴 데님 팬츠"
- "category": "tops", "outer", "bottoms", "shoes", "bag", "accessory" 중 하나
- "color": 언급된 주요 색상 (한국어)

반품/취소 상태는 제외하세요.
구매확정/배송완료/배송중/상품준비중/교환 상태는 포함하세요.

JSON만 반환:
{
  "items": [
    {
      "brand": "마하그리드",
      "productName": "STRANGE PUPPY TEE_4colors",
      "koreanName": "화이트 그래픽 반팔티",
      "category": "tops",
      "color": "화이트"
    }
  ]
}`;

    let responseText = '';
    outer: for (const modelName of MODELS) {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent(
            [prompt, { inlineData: { data: base64Data, mimeType } }],
            // @ts-expect-error: thinkingConfig
            { thinkingConfig: { thinkingBudget: 0 } }
          );
          responseText = result.response.text().trim();
          break outer;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
          if (!isOverloaded) break;
          if (attempt === 0) await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    if (!responseText) return NextResponse.json({ error: 'AI 응답 없음' }, { status: 500 });

    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'JSON 파싱 실패' }, { status: 500 });

    return NextResponse.json(JSON.parse(match[0]));
  } catch (e) {
    console.error('parse-order error:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
