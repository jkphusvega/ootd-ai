import { createClient } from './supabase/client';

export type AnalyticsEvent =
  | 'ootd_analyzed'
  | 'ootd_saved_to_feed'
  | 'curation_generated'
  | 'curation_saved'
  | 'curation_worn'
  | 'clothes_added';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

let _supabase: ReturnType<typeof createClient> | null = null;
const getClient = () => {
  if (!_supabase) _supabase = createClient();
  return _supabase;
};

export async function logEvent(
  userId: string,
  event: AnalyticsEvent,
  properties?: EventProperties
): Promise<void> {
  try {
    await getClient().from('analytics_events').insert({
      user_id: userId,
      event,
      properties: properties ?? {},
    });
  } catch (e) {
    console.error('[analytics] logEvent failed:', e);
  }
}
