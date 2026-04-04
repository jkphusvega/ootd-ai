import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json(); // base64 encoded image string (data URI)
    if (!image) {
      return NextResponse.json({ error: '이미지가 제공되지 않았습니다.' }, { status: 400 });
    }

    // data:image/jpeg;base64,... 에서 순수 데이터만 추출
    const [mimeInfo, base64Data] = image.split(',');
    const mimeType = mimeInfo.split(':')[1].split(';')[0];
    
    // 환경 변수 검증 (Milestone 2에서는 Gemini 2.5 Flash를 사용하여 최고 속도로 바운딩 박스를 뽑습니다)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key가 설정되지 않았습니다.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 프롬프트: 패션 이미지 객체 인식 전문가 페르소나 적용 및 엄격한 좌표 리턴 지시
    const prompt = `You are a precise fashion image segmentation expert.

TASK: Given a full-body photo, identify and return tight bounding boxes for each visible clothing item.

COORDINATE FORMAT (CRITICAL):
- Use normalized coordinates from 0.0 to 1.0
- Format: [y_min, x_min, y_max, x_max]
- (0.0, 0.0) = TOP-LEFT corner of image
- (1.0, 1.0) = BOTTOM-RIGHT corner of image
- y increases DOWNWARD, x increases RIGHTWARD

CATEGORIES (use only these exact strings):
- "tops": shirts, sweaters, hoodies, t-shirts (upper body garment)
- "outer": jackets, coats, cardigans (ONLY if a separate outer layer is clearly visible over the top)
- "bottoms": pants, skirts, shorts (lower body garment)
- "shoes": footwear visible at the bottom

LOCATION GUIDE for a typical standing full-body photo:
- tops: typically y_min ≈ 0.15-0.25, y_max ≈ 0.45-0.55 (upper torso area, BELOW the chin)
- bottoms: typically y_min ≈ 0.45-0.55, y_max ≈ 0.80-0.90 (waist to ankles)
- shoes: typically y_min ≈ 0.85-0.92, y_max ≈ 0.95-1.0 (feet area at bottom)
- outer: similar to tops but slightly larger if a jacket/coat is worn over

RULES:
1. Each box MUST NOT include the person's face or head. For tops/outer, y_min must start at the neckline.
2. Boxes for different categories MUST NOT significantly overlap.
3. Only include categories that are clearly visible. Do NOT guess.
4. If no outer layer is visible (just a single top), do NOT include "outer".

Return ONLY a raw JSON object (no markdown, no code fences):
{
  "items": [
    { "category": "tops", "box": [0.20, 0.25, 0.50, 0.75] },
    { "category": "bottoms", "box": [0.50, 0.25, 0.88, 0.75] },
    { "category": "shoes", "box": [0.88, 0.30, 0.98, 0.70] }
  ]
}`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let responseText = result.response.text().trim();
    
    console.log("Raw Gemini Segmentation Response: ", responseText);

    // Markdown 방어막 정제
    if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    if (responseText.startsWith('```')) responseText = responseText.replace(/```/g, '').trim();

    // 정규식으로 JSON 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       throw new Error('Gemini 응답에서 JSON 배열을 찾을 수 없습니다: ' + responseText);
    }
    
    const parsedOutputs = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedOutputs);

  } catch (error: unknown) {
    console.error('Auto Segmentation API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown segmentation error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
