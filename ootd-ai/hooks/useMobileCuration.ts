'use client';
import { useState, useEffect } from 'react';

export interface CurationItem {
  category: string;
  name: string;
  image_url: string;
  reason: string;
}

export interface CurationResult {
  title: string;
  description: string;
  style: string;
  colorTone: string;
  items: CurationItem[];
}

interface WeatherInfo { temperature: number; condition: string; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export function useMobileCuration({
  user,
  weather,
  supabase,
}: {
  user: { id: string } | null;
  weather: WeatherInfo | null;
  supabase: SupabaseClient;
}) {
  const [curation, setCuration] = useState<CurationResult | null>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('clothes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('category', 'ootd_feed')
      .then(({ count }: { count: number | null }) => setWardrobeCount(count || 0));
  }, [user, supabase]);

  const generateCuration = async () => {
    if (!user) return;
    setIsCurating(true);
    setCurationError(null);
    try {
      const { data: profile } = await supabase
        .from('user_profiles').select('*').eq('user_id', user.id).single();
      const res = await fetch('/api/curate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: profile || null,
        }),
      });
      const data = await res.json();
      if (res.ok) setCuration(data);
      else setCurationError(data.error || 'AI 큐레이션 오류');
    } catch {
      setCurationError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsCurating(false);
    }
  };

  return { curation, isCurating, curationError, wardrobeCount, generateCuration };
}
