import { ImageResponse } from 'next/og';
import { createClient } from '../../../lib/supabase/server';

export const runtime = 'edge';
export const alt = 'OOTD AI 옷장 공유';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage(
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  let nickname = 'OOTD User';
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_profiles')
      .select('nickname, is_public')
      .eq('share_id', shareId)
      .single();
    if (data?.is_public && data.nickname) nickname = data.nickname;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0c0c0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />

        {/* Wardrobe icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          fontSize: '40px',
        }}>
          👔
        </div>

        {/* Nickname */}
        <div style={{
          fontSize: '60px',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          marginBottom: '16px',
          display: 'flex',
        }}>
          {nickname}님의 옷장
        </div>

        <div style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.35)',
          fontWeight: 500,
          marginBottom: '48px',
          display: 'flex',
        }}>
          AI가 큐레이션한 스타일을 구경해보세요
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex',
          padding: '14px 36px',
          background: '#ffffff',
          borderRadius: '100px',
          color: '#000000',
          fontSize: '16px',
          fontWeight: 800,
          letterSpacing: '0.1em',
        }}>
          OOTD AI로 나도 시작하기
        </div>

        {/* Bottom */}
        <div style={{
          position: 'absolute',
          bottom: '36px',
          display: 'flex',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.1em',
        }}>
          ootdai.me
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
