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

    // Rate Limiting
    const { allowed, remaining, limit } = await checkRateLimit(user.id, 'curate-outfit');
    if (!allowed) {
      return NextResponse.json(
        { error: `일일 추천 한도(${limit}회)를 초과했습니다. 내일 다시 시도해주세요.` },
        { status: 429 }
      );
    }

    const { weatherInfo, userProfile } = await request.json();

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
      profileContext = `User's body: ${userProfile.height}cm, ${userProfile.weight}kg, prefers ${userProfile.fit_preference} fit. Style moods: ${userProfile.style_moods?.join(', ') || 'not specified'}.`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.4 } });

    const prompt = `You are a trendy top fashion stylist in Seoul.
The user has these items in their wardrobe:
${wardrobeDescription}

Current weather: ${weatherInfo?.temperature || 20}°C, ${weatherInfo?.condition || 'Clear'}.
${profileContext}

Based on the ACTUAL items in their wardrobe, suggest ONE complete outfit combination for today's weather.
Pick specific items from their wardrobe that go well together (you MUST use items they actually own).

Return JSON only:
{
  "title": "<catchy Korean title for the outfit, e.g. '비 오는 날의 시크한 레이어드 룩'>",
  "description": "<2-3 sentences in Korean describing why this combination works for today's weather and style>",
  "style": "<style keyword, e.g. 'Minimal', 'Street', 'Casual'>",
  "colorTone": "<color description, e.g. 'Monotone', 'Earth Tone', 'Pastel'>",
  "items": [
    {
      "category": "<outer/tops/bottoms/shoes/socks>",
      "name": "<item name from wardrobe>",
      "image_url": "<item image_url from wardrobe>",
      "reason": "<why this item was chosen, 1 sentence in Korean>"
    }
  ]
}

IMPORTANT: Only return raw JSON. No markdown. Write title, description, and reasons in Korean.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    const parsedData = JSON.parse(jsonMatch[0]);

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
