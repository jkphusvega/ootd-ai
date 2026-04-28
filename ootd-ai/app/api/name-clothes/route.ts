import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { image, category } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const [mimeInfo, base64Data] = image.split(',');
    const mimeType = mimeInfo.split(':')[1].split(';')[0];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `This is a clothing item image (category: ${category}).
Give it a short, specific Korean name that describes color + style + item type.
Examples: "오버핏 블랙 후드집업", "베이지 린넨 슬랙스", "화이트 크롭 반팔티", "카키 카고 팬츠"

Return ONLY raw JSON: { "name": "<Korean name, 15 chars max>" }`;

    const result = await model.generateContent(
      [prompt, { inlineData: { data: base64Data, mimeType } }],
      // @ts-expect-error: thinkingConfig is valid for gemini-2.5-flash
      { thinkingConfig: { thinkingBudget: 0 } }
    );

    const text = result.response.text().trim()
      .replace(/```json/g, '').replace(/```/g, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON not found');

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ name: parsed.name || category.toUpperCase() });
  } catch (e) {
    console.error('name-clothes error:', e);
    // 실패해도 카테고리명 fallback 반환 — UX 블로킹 없음
    return NextResponse.json({ name: null });
  }
}
