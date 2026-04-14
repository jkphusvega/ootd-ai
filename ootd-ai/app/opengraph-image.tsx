import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OOTD AI — AI 패션 스타일리스트';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-60px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Grid lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '100px',
          padding: '8px 20px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#34d399',
            display: 'flex',
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
          }}>
            AI FASHION STYLIST
          </span>
        </div>

        {/* Main Title */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '40px',
        }}>
          <div style={{
            fontSize: '88px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            display: 'flex',
          }}>
            OOTD AI
          </div>
          <div style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            display: 'flex',
          }}>
            사진 한 장으로 AI가 오늘의 코디를 완성해드려요
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          {['옷장 AI 분석', '매일 코디 추천', '스타일 큐레이션'].map((text) => (
            <div key={text} style={{
              display: 'flex',
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '100px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '16px',
              fontWeight: 600,
            }}>
              {text}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
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
