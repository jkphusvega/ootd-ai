import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { getUserBehaviorContext } from '../../../lib/behaviorContext';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting
    const { allowed, remaining, limit } = await checkRateLimit(user.id, 'curate-outfit');
    if (!allowed) {
      return NextResponse.json(
        { error: `일일 추천 한도(${limit}회)를 초과했습니다. 내일 다시 시도해주세요.` },
        { status: 429 }
      );
    }

    const { weatherInfo, userProfile, occasion } = await request.json();

    const OCCASION_LABELS: Record<string, string> = {
      daily: '일상 외출',
      work: '출근/비즈니스',
      date: '데이트',
      outdoor: '야외활동/운동',
      formal: '격식있는 자리/행사',
    };
    const occasionLabel = OCCASION_LABELS[occasion] || '일상 외출';

    // 행동 컨텍스트 (착용 이력, 스타일 패턴) — 실패해도 추천은 진행
    const behaviorContext = await getUserBehaviorContext(supabase, user.id);

    // 사용자의 옷장에서 아이템 가져오기
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id)
      .neq('category', 'ootd_feed');

    if (error) throw error;

    if (!clothes || clothes.length === 0) {
      return NextResponse.json({
        title: '옷장이 비어 있어요',
        description: '먼저 AI 추출 기능으로 옷을 등록해주세요!',
        style: 'N/A',
        colorTone: 'N/A',
        items: [],
      });
    }

    // 옷장 아이템 정보를 텍스트로 변환
    const wardrobeDescription = clothes.map(item => 
      `- ${item.category}: "${item.name}" (이미지: ${item.image_url})`
    ).join('\n');

    let profileContext = '';
    if (userProfile) {
      const embedding = userProfile.style_embedding;
      const styleDesc = embedding
        ? `Style profile: ${embedding.dominant_styles?.join(', ')} aesthetic · prefers ${embedding.fit_tendency} fit · color palette: ${embedding.dominant_colors?.join(', ')} · vibes: ${embedding.dominant_vibes?.join(', ')}.`
        : `Style moods: ${userProfile.style_moods?.join(', ') || 'not specified'}.`;
      profileContext = `User's body: ${userProfile.height}cm, ${userProfile.weight}kg, prefers ${userProfile.fit_preference} fit. Body shape: ${userProfile.body_shape || 'not specified'}. Styling goal: ${userProfile.body_goal || 'not specified'}. ${styleDesc}`;
    }

    const prompt = `You are a trendy top fashion stylist in Seoul.
The user has these items in their wardrobe:
${wardrobeDescription}

Today's situation: ${occasionLabel}
Current weather: ${weatherInfo?.temperature || 20}°C, ${weatherInfo?.condition || 'Clear'}.
${profileContext}
${behaviorContext.summary}

Based on the ACTUAL items in their wardrobe, suggest ONE complete outfit combination perfectly suited for "${occasionLabel}" in today's weather.
Pick specific items from their wardrobe that go well together (you MUST use items they actually own).
The outfit MUST be appropriate for the occasion — e.g. for work: neat and polished; for a date: stylish and put-together; for outdoor: comfortable and functional.

Return JSON only:
{
  "title": "<catchy Korean title for the outfit, e.g. '비 오는 날의 시크한 레이어드 룩'>",
  "description": "<2-3 sentences in Korean describing why this combination works for the occasion and today's weather>",
  "style": "<style keyword, e.g. 'Minimal', 'Street', 'Casual'>",
  "colorTone": "<color description, e.g. 'Monotone', 'Earth Tone', 'Pastel'>",
  "items": [
    {
      "category": "<outer/tops/bottoms/shoes/socks>",
      "name": "<item name from wardrobe>",
      "image_url": "<item image_url from wardrobe>",
      "reason": "<why this item suits the occasion, 1 sentence in Korean>"
    }
  ]
}

IMPORTANT: Only return raw JSON. No markdown. Write title, description, and reasons in Korean.`;

    // Gemini 호출 — 2.5-flash 실패 시 1.5-flash로 fallback, 각 모델 최대 2회 재시도
    const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let responseText = '';
    let lastError: unknown;

    outer: for (const modelName of MODELS) {
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.4 } });
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent(
            prompt,
            // @ts-expect-error: thinkingConfig is a valid runtime option for gemini-2.5-flash
            { thinkingConfig: { thinkingBudget: 0 } }
          );
          responseText = result.response.text();
          break outer;
        } catch (e: unknown) {
          lastError = e;
          const msg = e instanceof Error ? e.message : '';
          const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
          if (!isOverloaded) break; // 과부하 아닌 에러는 즉시 fallback
          if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
        }
      }
    }

    if (!responseText) throw lastError;
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('AI 응답 JSON 파싱 실패');
    }
    if (!parsedData.title || !Array.isArray(parsedData.items)) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    // Push notification — fire and forget, don't block response
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL('/api/push/send', request.url).toString() : '/api/push/send'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        title: '오늘의 코디 추천 ✨',
        body: parsedData.title || '새로운 코디 추천이 준비됐어요!',
        url: '/curation',
      }),
    }).catch(() => {}); // ignore push errors

    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    console.error('Curation API Error:', error);
    const message = error instanceof Error ? error.message : 'Curation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
