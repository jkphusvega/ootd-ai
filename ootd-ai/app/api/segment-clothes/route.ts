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

    // Y-range only 접근: Gemini에 세로 위치 비율만 요청 (가로는 전체 사용)
    const prompt = `Analyze this full-body photo of a person wearing clothes.

Your job: identify each visible clothing item and tell me WHERE it is vertically in the image.

For each item, provide:
- "category": one of "tops", "outer", "bottoms", "shoes"  
- "y_start": where the item starts vertically (0.0 = very top of image, 1.0 = very bottom)
- "y_end": where the item ends vertically

IMPORTANT GUIDELINES:
- "tops" (shirts, sweaters, hoodies): usually starts around 0.15-0.25 (neckline), ends around 0.45-0.55 (waist)
- "bottoms" (pants, skirts): usually starts around 0.45-0.55 (waist), ends around 0.82-0.92 (ankles)
- "shoes" (footwear): usually starts around 0.88-0.93, ends around 0.97-1.0
- "outer" (jackets, coats): ONLY if clearly worn over another top. Similar range to tops but may extend longer.
- Do NOT include "outer" if there is only one upper body layer.
- NEVER include the face/head. tops y_start must be at or below the neckline.
- Items must NOT overlap significantly in their y ranges.

Return ONLY raw JSON (no markdown, no code fences):
{
  "items": [
    { "category": "tops", "y_start": 0.22, "y_end": 0.50 },
    { "category": "bottoms", "y_start": 0.50, "y_end": 0.88 },
    { "category": "shoes", "y_start": 0.90, "y_end": 0.99 }
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
