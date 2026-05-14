'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';
import type { WeatherData } from './useWeather';

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

export type FeedbackType = 'like' | 'dislike' | 'worn' | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export function useMobileCuration({
  user,
  weather,
  supabase,
}: {
  user: { id: string } | null;
  weather: WeatherData | null;
  supabase: SupabaseClient;
}) {
  const { toast } = useToast();
  const [curation, setCuration] = useState<CurationResult | null>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [pastSimilarOutfits, setPastSimilarOutfits] = useState<Array<{ image_url: string; title: string; style: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('clothes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('category', 'ootd_feed')
      .then(({ count }: { count: number | null }) => setWardrobeCount(count || 0));
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !weather) return;
    const fetchPastOutfits = async () => {
      const { data } = await supabase
        .from('clothes')
        .select('image_url, name')
        .eq('user_id', user.id)
        .eq('category', 'ootd_feed')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const similar = data.map((item: { image_url: string; name: string }) => {
          try { return { ...JSON.parse(item.name), image_url: item.image_url }; }
          catch { return null; }
        }).filter((item: any) => {
          if (!item || !item.weather || !item.worn) return false;
          const tempMatch = item.weather.match(/(-?\d+)°/);
          if (tempMatch) {
            const temp = parseInt(tempMatch[1], 10);
            return Math.abs(temp - weather.temperature) <= 4; // ±4도 이내
          }
          return false;
        });

        // 가장 최근의 비슷한 코디 3개
        setPastSimilarOutfits(similar.slice(0, 3).map((i: any) => ({
          image_url: i.image_url,
          title: i.title || '',
          style: i.style || ''
        })));
      }
    };
    fetchPastOutfits();
  }, [user, weather, supabase]);

  const generateCuration = async () => {
    if (!user) return;
    setIsCurating(true);
    setCurationError(null);
    setFeedback(null); // 새 추천 시 피드백 초기화
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

  // 피드백 저장: 좋아요/싫어요/착용확정을 ootd_feed에 저장
  const submitFeedback = useCallback(async (type: 'like' | 'dislike' | 'worn') => {
    if (!user || !curation || isSavingFeedback) return;
    setIsSavingFeedback(true);
    try {
      const meta = {
        title: curation.title,
        description: curation.description,
        style: curation.style,
        colorTone: curation.colorTone,
        feedback: type,
        worn: type === 'worn',
        weather: weather ? `${Math.round(weather.temperature)}° ${weather.condition}` : '',
        items: curation.items.map(i => ({ name: i.name, category: i.category })),
      };

      const { error } = await supabase.from('clothes').insert({
        user_id: user.id,
        category: 'ootd_feed',
        name: JSON.stringify(meta),
        image_url: curation.items[0]?.image_url || '',
      });

      if (error) throw error;
      setFeedback(type);
    } catch {
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSavingFeedback(false);
    }
  }, [user, curation, weather, supabase, isSavingFeedback]);

  return {
    curation, isCurating, curationError, wardrobeCount,
    feedback, isSavingFeedback, pastSimilarOutfits,
    generateCuration, submitFeedback,
  };
}
