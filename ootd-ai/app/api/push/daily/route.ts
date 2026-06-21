import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-loaded services
let supabaseInstance: SupabaseClient | null = null;
let webpushInitialized = false;

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase URL or Service Role Key is missing');
    }
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

function initWebpush() {
  if (!webpushInitialized) {
    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!subject || !publicKey || !privateKey) {
      throw new Error('VAPID details are missing');
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    webpushInitialized = true;
  }
}

// Vercel Cron이 매일 UTC 00:00 (KST 09:00)에 호출합니다
export async function GET(req: NextRequest) {
  // Vercel Cron 요청 검증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    initWebpush();

    // 구독 중인 모든 유저 가져오기
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth');

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title: '오늘 코디 아직 못 골랐죠? 👗',
      body: 'AI가 오늘 날씨에 맞는 코디를 골라드릴게요!',
      url: '/curation',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    // 만료된 구독 정리
    const expiredEndpoints: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number };
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(subs[i].endpoint);
        }
      }
    });
    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    console.error('Daily push error:', err);
    return NextResponse.json({ error: 'Failed to send daily push' }, { status: 500 });
  }
}
