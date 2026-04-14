import { Metadata } from 'next';
import { createClient } from '../../../lib/supabase/server';
import SharedWardrobeClient from './SharedWardrobeClient';

export async function generateMetadata(
  { params }: { params: Promise<{ shareId: string }> }
): Promise<Metadata> {
  const { shareId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('nickname, is_public')
    .eq('share_id', shareId)
    .single();

  if (!data || !data.is_public) {
    return { title: '비공개 옷장 — OOTD AI' };
  }

  const nickname = data.nickname || 'OOTD User';
  return {
    title: `${nickname}님의 옷장 — OOTD AI`,
    description: `${nickname}님의 AI 큐레이션 옷장을 구경해보세요. OOTD AI로 나만의 스타일을 만들어보세요.`,
    openGraph: {
      title: `${nickname}님의 옷장`,
      description: `${nickname}님의 AI 큐레이션 옷장을 구경해보세요.`,
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'OOTD AI' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nickname}님의 옷장 — OOTD AI`,
      description: `${nickname}님의 AI 큐레이션 옷장을 구경해보세요.`,
      images: ['/og-image.png'],
    },
  };
}

export default async function SharedWardrobePage(
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  return <SharedWardrobeClient shareId={shareId} />;
}
