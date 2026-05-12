'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, RefreshCw, Sun, Cloud, CloudRain, CloudSnow, Loader2, AlertCircle, BookmarkCheck, Bookmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../../components/ToastProvider';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';
import { logEvent } from '../../lib/analytics';
import OccasionPicker from '../../components/curation/OccasionPicker';
import CurationItemCard from '../../components/curation/CurationItemCard';

interface CurationItem { category: string; name: string; image_url: string; reason: string; }
interface CurationResult { title: string; description: string; style: string; colorTone: string; items: CurationItem[]; }

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === 'Rain') return <CloudRain className="w-4 h-4" />;
  if (condition === 'Snow') return <CloudSnow className="w-4 h-4" />;
  if (condition === 'Cloudy') return <Cloud className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
}

export default function CurationPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const weather = useWeather();
  const [curation, setCuration] = useState<CurationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isWorn, setIsWorn] = useState(false);
  const [occasion, setOccasion] = useState('daily');
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    supabase.from('clothes').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).neq('category', 'ootd_feed')
      .then(({ count }: { count: number | null }) => setWardrobeCount(count || 0));
  }, [user, authLoading, supabase]);

  const generateCuration = async () => {
    if (!user) return;
    setIsLoading(true); setError(null); setIsSaved(false); setIsWorn(false);
    try {
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
      const res = await fetch('/api/curate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherInfo: weather || { temperature: 20, condition: 'Clear' }, userProfile: profile || null, occasion }),
      });
      const data = await res.json();
      if (res.ok) {
        setCuration(data);
        if (user) logEvent(user.id, 'curation_generated', { style: data.style, colorTone: data.colorTone, items_count: data.items?.length });
      } else {
        setError(data.error || 'AI 큐레이션 오류');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToJournal = async (worn: boolean) => {
    if (!user || !curation || isSaved) return;
    setIsSaving(true);
    try {
      const meta = {
        title: curation.title,
        description: curation.description,
        style: curation.style,
        colorTone: curation.colorTone,
        worn,
        weather: weather ? `${Math.round(weather.temperature)}° ${weather.condition}` : '',
        items: curation.items.map(i => i.name),
      };
      const { error } = await supabase.from('clothes').insert({
        user_id: user.id,
        category: 'ootd_feed',
        name: JSON.stringify(meta),
        image_url: curation.items[0]?.image_url || '',
      });
      if (error) throw error;
      setIsSaved(true);
      if (worn) setIsWorn(true);
      logEvent(user.id, worn ? 'curation_worn' : 'curation_saved', { style: curation.style, colorTone: curation.colorTone });
      toast(worn ? '오늘 착장으로 기록됐어요! 🎉' : '오늘의 코디가 저장됐어요!', 'success');
    } catch {
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0c0f] text-zinc-900 dark:text-white font-sans selection:bg-zinc-200 flex flex-col pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8f9fa] to-zinc-100 z-0 pointer-events-none dark:hidden" />

      <header className="relative z-10 pt-12 lg:pt-8 pb-6 px-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">Seoul</span>
              {weather && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <WeatherIcon condition={weather.condition} />
                    <span className="text-[10px] font-bold tracking-wider">{Math.round(weather.temperature)}°</span>
                  </div>
                </>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white mb-1">
              Today's<br className="lg:hidden" /> AI Curation
            </h1>
            {weather && (
              <p className="text-[11px] text-zinc-400 font-medium mt-1">
                {weather.condition === 'Rain' ? '🌧️ 비 오는 날씨에 맞는 코디' : weather.condition === 'Snow' ? '❄️ 눈 오는 날씨에 맞는 코디' : `${Math.round(weather.temperature)}°C 날씨에 맞는 코디`}
              </p>
            )}
          </div>
          <button onClick={generateCuration} disabled={isLoading}
            className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 text-white dark:text-black ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-8 max-w-6xl mx-auto w-full" ref={containerRef}>
        <AnimatePresence mode="wait">

          {!curation && !isLoading && !error && (
            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 lg:py-20 text-center">
              <div className="w-20 h-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-9 h-9 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200 mb-2">오늘 어디 가세요?</h2>
              <p className="text-sm text-zinc-400 mb-8">상황에 맞는 코디를 추천해드릴게요</p>
              <div className="mb-8"><OccasionPicker value={occasion} onChange={setOccasion} /></div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                내 옷장의 <span className="font-bold text-zinc-600 dark:text-zinc-300">{wardrobeCount}개 아이템</span>과 오늘 날씨를 분석해 추천해요
              </p>
              {wardrobeCount === 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-xl">
                    옷장에 아이템이 없으면 추천이 어려워요
                  </p>
                  <Link href="/add-clothes">
                    <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:opacity-80 transition flex items-center gap-2">
                      <span>👕</span> 지금 옷 등록하러 가기
                    </button>
                  </Link>
                </div>
              ) : (
                <button onClick={generateCuration} disabled={isLoading}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:opacity-80 transition flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI 코디 추천받기
                </button>
              )}
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-600 mb-2">AI 스타일리스트가 고민 중...</h3>
              <p className="text-xs text-zinc-400">옷장과 날씨를 분석해서 최적의 코디를 찾고 있어요</p>
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-sm text-red-500 font-bold mb-4">{error}</p>
              <button onClick={generateCuration} className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold tracking-widest uppercase">
                다시 시도
              </button>
            </motion.div>
          )}

          {curation && !isLoading && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-6"><OccasionPicker value={occasion} onChange={setOccasion} compact /></div>

              <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                <div className="grid grid-cols-2 gap-4 mb-8 lg:mb-0">
                  {curation.items.map((item, idx) => (
                    <CurationItemCard key={idx} item={item} index={idx} weather={weather} showWeather={idx === 0} />
                  ))}
                </div>

                <div className="flex flex-col gap-5">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 p-6 shadow-sm">
                    <h2 className="text-2xl font-black tracking-tight mb-2 dark:text-white">{curation.title}</h2>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">{curation.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <div className="px-4 py-2 border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-400">Style</span>
                        <span className="text-[10px] font-bold text-black dark:text-white">{curation.style}</span>
                      </div>
                      <div className="px-4 py-2 border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-400">Color</span>
                        <span className="text-[10px] font-bold text-black dark:text-white">{curation.colorTone}</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => saveToJournal(true)} disabled={isSaving || isWorn}
                    className={`w-full py-4 rounded-2xl font-extrabold tracking-widest text-xs uppercase transition flex items-center justify-center gap-2 ${isWorn ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-zinc-800 shadow-xl'}`}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isWorn ? <BookmarkCheck className="w-4 h-4" /> : <span>👕</span>}
                    {isWorn ? '오늘 착장 기록 완료!' : '오늘 이 코디 입었어요'}
                  </button>
                  <button onClick={() => saveToJournal(false)} disabled={isSaving || isSaved}
                    className={`w-full py-4 rounded-2xl font-extrabold tracking-widest text-xs uppercase transition flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {isSaved ? '저장 완료!' : '코디 저장하기'}
                  </button>
                  {isSaved && (
                    <Link href="/wardrobe" className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                      옷장에서 보기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button onClick={generateCuration} disabled={isLoading}
                    className="w-full py-4 bg-black text-white rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:bg-zinc-800 transition flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> 다른 코디 추천받기
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
