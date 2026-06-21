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
  if (!allowed) return NextResponse.json({ name: null });

  try {
    const { image, category } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const commaIdx = image.indexOf(',');
    if (commaIdx === -1) return NextResponse.json({ error: '이미지 형식이 올바르지 않습니다.' }, { status: 400 });
    const mimeType = image.slice(0, commaIdx).split(':')[1]?.split(';')[0] || 'image/jpeg';
    const base64Data = image.slice(commaIdx + 1);

    const prompt = `This is a clothing item image (category: ${category}).
Give it a short, specific Korean name that describes color + style + item type.
Examples: "오버핏 블랙 후드집업", "베이지 린넨 슬랙스", "화이트 크롭 반팔티", "카키 카고 팬츠"

Return ONLY raw JSON: { "name": "<Korean name, 15 chars max>" }`;

    let responseText = '';
    outer: for (const modelName of MODELS) {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent(
            [prompt, { inlineData: { data: base64Data, mimeType } }],
            // @ts-expect-error: thinkingConfig is valid for gemini-2.5-flash
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

    if (!responseText) return NextResponse.json({ name: null });

    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ name: null });

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ name: parsed.name || null });
  } catch (e) {
    console.error('name-clothes error:', e);
    return NextResponse.json({ name: null });
  }
}
