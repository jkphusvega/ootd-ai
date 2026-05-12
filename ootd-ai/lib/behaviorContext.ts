import { SupabaseClient } from '@supabase/supabase-js';

interface BehaviorContext {
  recentStyles: string[];       // 최근 착용한 스타일 태그
  avgScore: number | null;      // 최근 OOTD 평균 점수
  wornCount: number;            // 총 착용 확정 횟수
  likedStyles: string[];        // 좋아요한 스타일
  dislikedStyles: string[];     // 싫어요한 스타일
  summary: string;              // AI 프롬프트에 주입할 요약 문자열
}

interface FeedMeta {
  style?: string;
  colorTone?: string;
  feedback?: 'like' | 'dislike' | 'worn';
  worn?: boolean;
  score?: number;
  items?: Array<{ name: string; category: string }>;
}

export async function getUserBehaviorContext(
  supabase: SupabaseClient,
  userId: string
): Promise<BehaviorContext> {
  const empty: BehaviorContext = {
    recentStyles: [], avgScore: null, wornCount: 0,
    likedStyles: [], dislikedStyles: [], summary: '',
  };

  try {
    // 최근 60일 ootd_feed 데이터에서 행동 패턴 추출
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('clothes')
      .select('name, created_at')
      .eq('user_id', userId)
      .eq('category', 'ootd_feed')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return empty;

    // name 필드에 JSON으로 저장된 메타데이터 파싱
    const parsed: FeedMeta[] = data.map(item => {
      try { return JSON.parse(item.name) as FeedMeta; }
      catch { return null; }
    }).filter((x): x is FeedMeta => x !== null);

    // ── 피드백 분류 ──
    const liked = parsed.filter(p => p.feedback === 'like' || p.worn === true);
    const disliked = parsed.filter(p => p.feedback === 'dislike');
    const wornEntries = parsed.filter(p => p.worn === true || p.feedback === 'worn');

    // 좋아요한 스타일 빈도
    const likeFreq: Record<string, number> = {};
    for (const entry of liked) {
      if (entry.style) likeFreq[entry.style] = (likeFreq[entry.style] ?? 0) + 1;
      if (entry.colorTone) likeFreq[entry.colorTone] = (likeFreq[entry.colorTone] ?? 0) + 1;
    }
    const likedStyles = Object.entries(likeFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // 싫어요한 스타일 빈도
    const dislikeFreq: Record<string, number> = {};
    for (const entry of disliked) {
      if (entry.style) dislikeFreq[entry.style] = (dislikeFreq[entry.style] ?? 0) + 1;
      if (entry.colorTone) dislikeFreq[entry.colorTone] = (dislikeFreq[entry.colorTone] ?? 0) + 1;
    }
    const dislikedStyles = Object.entries(dislikeFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // 전체 스타일 빈도 (최근 착용)
    const tagFreq: Record<string, number> = {};
    for (const entry of wornEntries) {
      if (entry.style) tagFreq[entry.style] = (tagFreq[entry.style] ?? 0) + 1;
      if (entry.colorTone) tagFreq[entry.colorTone] = (tagFreq[entry.colorTone] ?? 0) + 1;
    }
    const recentStyles = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    const wornCount = wornEntries.length;

    // OOTD 점수 평균
    const scores = parsed
      .map(p => p.score)
      .filter((s): s is number => typeof s === 'number');
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // ── AI 프롬프트용 요약 생성 ──
    const parts: string[] = [];

    if (likedStyles.length > 0) {
      parts.push(`선호 스타일 (좋아요 ${liked.length}회): ${likedStyles.join(', ')}`);
    }
    if (dislikedStyles.length > 0) {
      parts.push(`비선호 스타일 (싫어요 ${disliked.length}회): ${dislikedStyles.join(', ')} → 이 스타일은 피해주세요`);
    }
    if (recentStyles.length > 0) {
      parts.push(`최근 실제 착용 스타일: ${recentStyles.join(', ')}`);
    }
    if (avgScore !== null) {
      parts.push(`최근 OOTD 평균 점수: ${avgScore}점`);
    }
    if (wornCount > 0) {
      parts.push(`착용 확정 횟수: ${wornCount}회`);
    }

    const summary = parts.length > 0
      ? `[유저 스타일 학습 데이터 — 반드시 반영]\n${parts.join('\n')}`
      : '';

    return { recentStyles, avgScore, wornCount, likedStyles, dislikedStyles, summary };
  } catch {
    return empty;
  }
}
