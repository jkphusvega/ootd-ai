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
    const prompt = `You are a highly precise computer vision expert specializing in fashion and apparel parsing.
Analyze the uploaded full body selfie/photo.
Identify the distinct clothing items worn by the person. Specifically classify them tightly into:
- "outer" (long coats, heavy jackets, cardigans)
- "tops" (inner shirts, sweaters, hoodies worn INSIDE the outer)
- "bottoms" (pants, skirts, shorts)
- "shoes" (sneakers, boots, etc)

CRITICAL INSTRUCTION:
The bounding boxes MUST tightly encapsulate ONLY the clothing fabric. 
You MUST strictly EXCLUDE the person's face, head, hair, hands, and bare skin as much as realistically possible.
For 'outer' and 'tops', the ymin MUST start strictly below the chin (at the neckline/collar), never higher.
Do NOT include the head under any circumstances.

Return your analysis strictly as a raw JSON object and nothing else. No markdown wrappers.
Use the exact following structure:
{
  "items": [
    { "category": "outer", "box": [0.15, 0.10, 0.85, 0.90] },
    { "category": "tops", "box": [0.20, 0.30, 0.45, 0.70] },
    { "category": "bottoms", "box": [0.45, 0.25, 0.85, 0.75] }
  ]
}
Only output the JSON object. Do not include labels, explanations, or code blocks like \`\`\`json.`;

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
