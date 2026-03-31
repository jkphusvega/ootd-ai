import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, weatherInfo, userProfile } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 사용자 프로필 정보를 프롬프트에 반영
    let profileContext = '';
    if (userProfile) {
      profileContext = `
The user's body profile:
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg  
- Preferred fit: ${userProfile.fit_preference}
- Style preferences: ${userProfile.style_moods?.join(', ') || 'Not specified'}
Take these into account when giving fit and styling advice. For example, if they prefer oversized fits, don't criticize loose silhouettes. If they like minimal style, suggest clean, simple upgrades.`;
    }

    const prompt = `You are a highly sought-after, trendy celebrity fashion stylist in Seoul. 
You are extremely sensitive to current fashion trends (like Y2K, Gorpcore, Minimal, Old Money, etc.) and know exactly how to make anyone look effortlessly stylish.
Analyze this user's OOTD (Outfit of the Day) carefully. The current weather is ${weatherInfo.temperature}°C, ${weatherInfo.condition}.
${profileContext}

Provide warm but honest, sharp styling advice. Do not use overly difficult avant-garde fashion jargon that normal people can't understand. Use trendy but accessible brand/fit terms (e.g., "와이드 팬츠", "레더 자켓", "고프코어 감성", "아식스 스니커즈", "실버 악세서리", "크롭 기장", "톤온톤").
If the outfit is too generic or boring, tell them exactly how to elevate it with a 1-2 point items (like a specific color or a trendy accessory).

Structure your JSON EXACTLY like this:
{
  "score": <0-100 score strictly evaluated based on real-world trendy fashion standards>,
  "summary": "<A catchy, short headline. E.g., '깔끔하지만 한 끗의 포인트가 아쉬운 룩'>",
  "weatherAdvice": "<How this fit handles the ${weatherInfo.temperature}°C weather. E.g., '14도엔 얇은 아우터가 필수예요. 지금 룩은 저녁에 꽤 쌀쌀할 수 있습니다.'>",
  "fitAndColor": "<Honest critique on the silhouette and colors. Use friendly but professional fashion terms.>",
  "stylistRecommendation": "<At least 2 highly specific, trendy recommendations to upgrade the look. E.g., '심심한 무지 양말 대신 트렌디한 버터 옐로우 컬러 양말로 포인트를 줘보세요', '신발을 볼드한 실루엣의 스니커즈로 바꾸면 비율이 훨씬 좋아 보일 거예요.'>"
}
Write EVERYTHING in Korean. Keep the tone friendly, incredibly trendy, and professional like a star's personal stylist. Return ONLY raw JSON string. No markdown brackets whatsoever.`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI Evaluation' }, { status: 500 });
  }
}
