import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

const FAL_KEY = process.env.FAL_KEY;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!FAL_KEY) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const { image } = await request.json();
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  // 1. base64 → binary buffer로 변환해서 fal.ai 스토리지에 업로드
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const uploadRes = await fetch('https://storage.fal.ai/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'image/jpeg',
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error('[remove-bg] fal.ai upload failed:', err);
    return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 502 });
  }

  const { url: imageUrl } = await uploadRes.json();

  // 2. rembg 모델로 배경 제거
  const rembgRes = await fetch('https://fal.run/fal-ai/imageutils/rembg', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!rembgRes.ok) {
    const err = await rembgRes.text();
    console.error('[remove-bg] fal.ai rembg failed:', err);
    return NextResponse.json({ error: '배경 제거 실패' }, { status: 502 });
  }

  const result = await rembgRes.json();
  const resultUrl: string = result.image?.url;
  if (!resultUrl) return NextResponse.json({ error: '결과 없음' }, { status: 502 });

  // 3. 결과 이미지(PNG) 다운로드 → base64로 변환해서 반환
  const imgRes = await fetch(resultUrl);
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

  return NextResponse.json({
    image: `data:image/png;base64,${imgBuffer.toString('base64')}`,
  });
}
