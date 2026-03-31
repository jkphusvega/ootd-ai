import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { weatherInfo, userProfile } = await request.json();

    // 사용자의 옷장에서 아이템 가져오기
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', 'guest_user_123')
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Curation API Error:', error);
    return NextResponse.json({ error: error.message || 'Curation failed' }, { status: 500 });
  }
}
