import { SupabaseClient } from '@supabase/supabase-js';

interface BehaviorContext {
  recentStyles: string[];
  avgScore: number | null;
  wornCount: number;
  likedStyles: string[];
  dislikedStyles: string[];
  favoriteItems: string[];    // 좋아요/착용 코디에 자주 등장한 아이템
  avoidItems: string[];       // 싫어요 코디에 등장한 아이템
  recentCombos: string[][];   // 최근 착용 조합 (반복 방지)
  summary: string;
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
    likedStyles: [], dislikedStyles: [],
    favoriteItems: [], avoidItems: [], recentCombos: [],
    summary: '',
  };

  try {
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

    const parsed: FeedMeta[] = data.map(item => {
      try { return JSON.parse(item.name) as FeedMeta; }
      catch { return null; }
    }).filter((x): x is FeedMeta => x !== null);

    const liked    = parsed.filter(p => p.feedback === 'like' || p.worn === true);
    const disliked = parsed.filter(p => p.feedback === 'dislike');
    const worn     = parsed.filter(p => p.worn === true || p.feedback === 'worn');

    // ── 스타일 선호도 ──
    const likeFreq: Record<string, number> = {};
    for (const e of liked) {
      if (e.style)     likeFreq[e.style]     = (likeFreq[e.style]     ?? 0) + 1;
      if (e.colorTone) likeFreq[e.colorTone] = (likeFreq[e.colorTone] ?? 0) + 1;
    }
    const likedStyles = Object.entries(likeFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    const dislikeFreq: Record<string, number> = {};
    for (const e of disliked) {
      if (e.style)     dislikeFreq[e.style]     = (dislikeFreq[e.style]     ?? 0) + 1;
      if (e.colorTone) dislikeFreq[e.colorTone] = (dislikeFreq[e.colorTone] ?? 0) + 1;
    }
    const dislikedStyles = Object.entries(dislikeFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    const tagFreq: Record<string, number> = {};
    for (const e of worn) {
      if (e.style)     tagFreq[e.style]     = (tagFreq[e.style]     ?? 0) + 1;
      if (e.colorTone) tagFreq[e.colorTone] = (tagFreq[e.colorTone] ?? 0) + 1;
    }
    const recentStyles = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    // ── 아이템 단위 선호도 ──
    const favoriteFreq: Record<string, number> = {};
    for (const e of liked) {
      for (const item of e.items ?? []) {
        favoriteFreq[item.name] = (favoriteFreq[item.name] ?? 0) + 1;
      }
    }
    const favoriteItems = Object.entries(favoriteFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);

    const avoidFreq: Record<string, number> = {};
    for (const e of disliked) {
      for (const item of e.items ?? []) {
        avoidFreq[item.name] = (avoidFreq[item.name] ?? 0) + 1;
      }
    }
    // 싫어요에만 등장하고 좋아요엔 없는 아이템만 회피 목록에 포함
    const avoidItems = Object.entries(avoidFreq)
      .filter(([name]) => !favoriteFreq[name])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

    // ── 최근 착용 조합 (반복 방지용, 최근 5개) ──
    const recentCombos = worn.slice(0, 5)
      .map(e => (e.items ?? []).map(i => i.name))
      .filter(combo => combo.length > 0);

    const wornCount = worn.length;

    const scores = parsed.map(p => p.score).filter((s): s is number => typeof s === 'number');
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // ── 프롬프트 요약 ──
    const parts: string[] = [];

    if (likedStyles.length > 0)
      parts.push(`선호 스타일 (좋아요 ${liked.length}회): ${likedStyles.join(', ')}`);
    if (dislikedStyles.length > 0)
      parts.push(`비선호 스타일 (싫어요 ${disliked.length}회): ${dislikedStyles.join(', ')} → 이 스타일은 피해주세요`);
    if (recentStyles.length > 0)
      parts.push(`최근 실제 착용 스타일: ${recentStyles.join(', ')}`);
    if (favoriteItems.length > 0)
      parts.push(`자주 착용/좋아요한 아이템: ${favoriteItems.join(', ')} → 적극적으로 활용하세요`);
    if (avoidItems.length > 0)
      parts.push(`싫어요에만 등장한 아이템: ${avoidItems.join(', ')} → 가능하면 피해주세요`);
    if (recentCombos.length > 0) {
      const comboStrs = recentCombos.map(c => `[${c.join(' + ')}]`).join(', ');
      parts.push(`최근 착용 조합 (동일 조합 추천 금지): ${comboStrs}`);
    }
    if (avgScore !== null)
      parts.push(`최근 OOTD 평균 점수: ${avgScore}점`);
    if (wornCount > 0)
      parts.push(`착용 확정 횟수: ${wornCount}회`);

    const summary = parts.length > 0
      ? `[유저 스타일 학습 데이터 — 반드시 반영]\n${parts.join('\n')}`
      : '';

    return { recentStyles, avgScore, wornCount, likedStyles, dislikedStyles, favoriteItems, avoidItems, recentCombos, summary };
  } catch {
    return empty;
  }
}
