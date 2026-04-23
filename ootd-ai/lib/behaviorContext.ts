import { SupabaseClient } from '@supabase/supabase-js';

interface BehaviorContext {
  recentStyles: string[];       // 최근 착용한 스타일 태그
  avgScore: number | null;      // 최근 OOTD 평균 점수
  wornCount: number;            // 총 착용 확정 횟수
  summary: string;              // AI 프롬프트에 주입할 요약 문자열
}

export async function getUserBehaviorContext(
  supabase: SupabaseClient,
  userId: string
): Promise<BehaviorContext> {
  const empty: BehaviorContext = { recentStyles: [], avgScore: null, wornCount: 0, summary: '' };

  try {
    // 최근 30일 journal_entries 조회 (착용 기록 + OOTD 점수)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('tags, score, memo')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) return empty;

    // 착용 확정 항목에서 스타일 태그 추출
    const wornEntries = data.filter(e => e.tags?.includes('착용확정'));
    const wornCount = wornEntries.length;

    // 스타일 태그 빈도 집계 (착용확정, 날씨 태그 제외)
    const excludeTags = new Set(['착용확정', 'Clear', 'Rain', 'Snow', 'Cloudy', 'Windy']);
    const tagFreq: Record<string, number> = {};
    for (const entry of wornEntries) {
      for (const tag of (entry.tags ?? [])) {
        if (!excludeTags.has(tag)) {
          tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
        }
      }
    }
    const recentStyles = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // OOTD 점수 평균 (score가 있는 항목만)
    const scores = data.map(e => e.score).filter((s): s is number => typeof s === 'number');
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // AI 프롬프트용 요약
    const styleStr = recentStyles.length > 0
      ? `최근 자주 착용한 스타일: ${recentStyles.join(', ')}`
      : '';
    const scoreStr = avgScore !== null ? `최근 OOTD 평균 점수: ${avgScore}점` : '';
    const wornStr = wornCount > 0 ? `이번 달 착용 확정 횟수: ${wornCount}회` : '';

    const parts = [styleStr, scoreStr, wornStr].filter(Boolean);
    const summary = parts.length > 0
      ? `[유저 행동 패턴]\n${parts.join('\n')}`
      : '';

    return { recentStyles, avgScore, wornCount, summary };
  } catch {
    return empty;
  }
}
