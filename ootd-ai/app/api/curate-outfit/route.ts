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
    const { allowed, limit } = await checkRateLimit(user.id, 'curate-outfit');
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

    const FIT_LABEL: Record<string, string> = {
      slim: 'slim-fitting (body-hugging silhouette)',
      regular: 'regular fit (comfortable, not too loose or tight)',
      oversized: 'oversized/relaxed fit (loose, roomy silhouette)',
    };
    const GOAL_LABEL: Record<string, string> = {
      taller:     'make legs look longer and proportions taller — prioritize high-waisted bottoms, monochrome, vertical lines',
      broader:    'make shoulders look wider — prioritize structured tops, horizontal stripes, layering on top',
      slimmer:    'create a slimmer overall silhouette — prioritize dark tones, vertical lines, well-fitted pieces',
      cover_legs: 'cover the leg line — prioritize longer outer layers, wide-leg or straight-leg bottoms, midi lengths',
    };

    let profileContext = '';
    if (userProfile) {
      const embedding = userProfile.style_embedding;
      const fitPref = userProfile.fit_preference;
      const bodyGoal = userProfile.body_goal;
      const styleDesc = embedding
        ? `Style aesthetic: ${embedding.dominant_styles?.join(', ')} · color palette: ${embedding.dominant_colors?.join(', ')} · vibes: ${embedding.dominant_vibes?.join(', ')}.`
        : `Style moods: ${userProfile.style_moods?.join(', ') || 'not specified'}.`;

      profileContext = [
        `USER PROFILE:`,
        `- Height: ${userProfile.height}cm, Weight: ${userProfile.weight}kg`,
        fitPref ? `- Fit preference: ${FIT_LABEL[fitPref] || fitPref} → YOU MUST select items that match this fit` : '',
        bodyGoal ? `- Styling goal: ${GOAL_LABEL[bodyGoal] || bodyGoal} → YOU MUST apply this styling strategy when choosing items` : '',
        `- ${styleDesc}`,
      ].filter(Boolean).join('\n');
    }

    // 날씨 정보 구성 (Phase 2: 시간별 예보 포함)
    let weatherContext = `Current weather: ${weatherInfo?.temperature || 20}°C, ${weatherInfo?.condition || 'Clear'}.`;
    if (weatherInfo?.tempMin !== undefined && weatherInfo?.tempMax !== undefined) {
      weatherContext += `\nToday's range: ${weatherInfo.tempMin}°C ~ ${weatherInfo.tempMax}°C.`;
    }
    if (weatherInfo?.precipitationProbability > 0) {
      weatherContext += `\nRain probability: ${weatherInfo.precipitationProbability}%.`;
    }
    if (weatherInfo?.weatherTip) {
      weatherContext += `\nStyling tip: ${weatherInfo.weatherTip}`;
    }

    const prompt = `You are a top fashion stylist in Seoul who specializes in personalized styling.
The user has these items in their wardrobe:
${wardrobeDescription}

Today's situation: ${occasionLabel}
${weatherContext}
${profileContext}
${behaviorContext.summary}

Your task: suggest ONE complete outfit from their wardrobe that:
1. Uses ONLY items they actually own (listed above)
2. Is perfectly suited for "${occasionLabel}" and today's weather
3. STRICTLY follows their fit preference — do not pick items that contradict it
4. STRICTLY applies their styling goal strategy — explain in the description how the outfit achieves it
5. Reflects their style aesthetic

The occasion style guide: work → neat and polished; date → stylish and put-together; outdoor → comfortable and functional; formal → semi-formal or above; daily → relaxed but coordinated.

Return JSON only:
{
  "title": "<catchy Korean title for the outfit, e.g. '비 오는 날의 시크한 레이어드 룩'>",
  "description": "<2-3 sentences in Korean: why this combination works for the occasion AND how it achieves the user's styling goal>",
  "style": "<style keyword, e.g. 'Minimal', 'Street', 'Casual'>",
  "colorTone": "<color description, e.g. 'Monotone', 'Earth Tone', 'Pastel'>",
  "items": [
    {
      "category": "<outer/tops/bottoms/shoes/socks>",
      "name": "<item name from wardrobe>",
      "image_url": "<item image_url from wardrobe>",
      "reason": "<1 sentence in Korean: why this specific item fits the occasion AND supports the styling goal>"
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
    fetch(new URL('/api/push/send', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
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
