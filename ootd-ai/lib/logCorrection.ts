import { SupabaseClient } from '@supabase/supabase-js';

export type CorrectionAction = 'name_edit' | 'category_change' | 'name_and_category' | 'item_delete' | 'manual_add';

export interface CorrectionEntry {
  action: CorrectionAction;
  ai_name?: string | null;
  ai_category?: string | null;
  user_name?: string | null;
  user_category?: string | null;
  item_image_url?: string | null;
}

export async function logCorrections(
  supabase: SupabaseClient,
  userId: string,
  entries: CorrectionEntry[]
) {
  if (!entries.length) return;
  try {
    await supabase.from('correction_logs').insert(
      entries.map(e => ({ user_id: userId, ...e }))
    );
  } catch (e) {
    // 로깅 실패가 저장 흐름을 막으면 안 됨
    console.warn('[correction_log] insert failed:', e);
  }
}
