import { createClient } from './supabase/server';

const DAILY_LIMITS: Record<string, number> = {
  'analyze-ootd': 20,    // OOTD 분석: 하루 20회
  'segment-clothes': 30, // 옷 추출: 하루 30회
  'curate-outfit': 15,   // 코디 추천: 하루 15회
  'shopping': 10,        // 쇼핑 추천: 하루 10회
};

/**
 * 유저별 일일 API 호출 횟수를 체크하고 카운트를 증가시킵니다.
 * Supabase user_profiles 테이블의 api_usage JSONB 컬럼을 활용합니다.
 * 
 * @returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkRateLimit(userId: string, endpoint: string) {
  const supabase = await createClient();
  const limit = DAILY_LIMITS[endpoint] || 20;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 현재 사용량 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('api_usage')
    .eq('user_id', userId)
    .single();

  const usage = profile?.api_usage || {};
  const dayKey = `${endpoint}_${today}`;
  const currentCount = usage[dayKey] || 0;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  // 카운트 증가
  const newUsage = { ...usage, [dayKey]: currentCount + 1 };

  // 3일 이상 지난 키는 정리 (스토리지 절약)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().split('T')[0];
  for (const key of Object.keys(newUsage)) {
    const keyDate = key.split('_').pop() || '';
    if (keyDate < cutoff) delete newUsage[key];
  }

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ api_usage: newUsage })
    .eq('user_id', userId);

  if (updateError) console.error('[rateLimit] usage update failed:', updateError.message);

  return { allowed: true, remaining: limit - currentCount - 1, limit };
}
