import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit } from '../../../lib/rateLimit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed, limit } = await checkRateLimit(user.id, 'shopping');
    if (!allowed) {
      return NextResponse.json(
        { error: `일일 쇼핑 추천 한도(${limit}회)를 초과했습니다. 내일 다시 시도해주세요.` },
        { status: 429 }
      );
    }

    const { weatherInfo, userProfile } = await request.json();

    // 사용자의 옷장 아이템 가져오기
    const { data: clothes } = await supabase
      .from('clothes')
      .select('category, name')
      .eq('user_id', user.id)
      .neq('category', 'ootd_feed');

    const wardrobeDescription = (clothes || []).map(item =>
      `- ${item.category}: "${item.name}"`
    ).join('\n');

    let profileContext = '';
    if (userProfile) {
      profileContext = `User profile: ${userProfile.height}cm, ${userProfile.weight}kg, prefers ${userProfile.fit_preference} fit. Body shape: ${userProfile.body_shape || 'Not specified'}. Styling goal: ${userProfile.body_goal || 'Not specified'}. Style moods: ${userProfile.style_moods?.join(', ') || 'not specified'}.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.4 } });

    const prompt = `You are a personal fashion shopping advisor in Seoul, Korea.

The user currently has these items in their wardrobe:
${wardrobeDescription || 'No items yet.'}

${profileContext}
Current weather: ${weatherInfo?.temperature || 20}°C, ${weatherInfo?.condition || 'Clear'}.

Analyze what's MISSING from their wardrobe — items that would complete their collection and create more outfit combinations. Consider:
1. Category gaps (e.g. they have tops but few bottoms)
2. Seasonal needs based on current weather
3. Style preferences from their profile
4. Versatile items that pair well with what they already own

Suggest exactly 4 items they should consider buying. For each item, provide a realistic product description.

Return JSON only:
{
  "analysis": "<2-3 sentences in Korean analyzing what their wardrobe is missing>",
  "suggestions": [
    {
      "name": "<specific product name in Korean, e.g. '워싱 데님 와이드 팬츠'>",
      "category": "<outer/tops/bottoms/shoes/socks>",
      "reason": "<why this item would complement their wardrobe, 1-2 sentences in Korean>",
      "priceRange": "<approximate price range in KRW, e.g. '39,000 ~ 59,000원'>",
      "brandTip": "<1 sentence Korean tip about where to find similar items, mentioning real Korean fashion platforms like 무신사, 에이블리, 29CM, W컨셉>"
    }
  ]
}

IMPORTANT: Only return raw JSON. No markdown. Write everything in Korean.`;

    const result = await model.generateContent(
      prompt,
      // @ts-expect-error: thinkingConfig is a valid runtime option for gemini-2.5-flash
      { thinkingConfig: { thinkingBudget: 0 } }
    );
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('AI 응답 JSON 파싱 실패');
    }
    if (!parsedData.analysis || !Array.isArray(parsedData.suggestions)) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    console.error('Shopping API Error:', error);
    const message = error instanceof Error ? error.message : 'Shopping recommendation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
