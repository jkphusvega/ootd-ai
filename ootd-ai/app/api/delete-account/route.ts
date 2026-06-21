import { createClient } from '../../../lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. 스토리지 이미지 삭제
    const { data: clothes } = await admin.from('clothes').select('image_url').eq('user_id', user.id);
    if (clothes && clothes.length > 0) {
      const prefix = '/storage/v1/object/public/clothes/';
      const fileNames = clothes
        .map(c => { const i = c.image_url.indexOf(prefix); return i !== -1 ? c.image_url.slice(i + prefix.length) : null; })
        .filter(Boolean) as string[];
      if (fileNames.length > 0) await admin.storage.from('clothes').remove(fileNames);
    }

    // 2. DB 레코드 삭제
    await admin.from('clothes').delete().eq('user_id', user.id);
    await admin.from('user_profiles').delete().eq('user_id', user.id);

    // 3. auth.users 삭제 (service role 필요)
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '계정 삭제 중 오류가 발생했습니다.';
    console.error('[delete-account]', err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
