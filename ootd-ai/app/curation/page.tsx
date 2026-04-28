'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, RefreshCw, Sun, Cloud, CloudRain, CloudSnow, Loader2, AlertCircle, ExternalLink, BookmarkCheck, Bookmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../../components/ToastProvider';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';
import { logEvent } from '../../lib/analytics';

interface CurationItem {
  category: string;
  name: string;
  image_url: string;
  reason: string;
}

interface CurationResult {
  title: string;
  description: string;
  style: string;
  colorTone: string;
  items: CurationItem[];
}

const OCCASIONS = [
  { id: 'daily', label: '일상', emoji: '☀️' },
  { id: 'work', label: '출근', emoji: '💼' },
  { id: 'date', label: '데이트', emoji: '🌹' },
  { id: 'outdoor', label: '야외활동', emoji: '🏃' },
  { id: 'formal', label: '격식있는 자리', emoji: '🎩' },
];

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

  // Check wardrobe count
  useEffect(() => {
    const checkWardrobe = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('clothes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('category', 'ootd_feed');
      setWardrobeCount(count || 0);
    };
    if (!authLoading) checkWardrobe();
  }, [user, authLoading]);

  const getSearchUrls = (name: string) => {
    const q = encodeURIComponent(name);
    return {
      musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
      cm29: `https://www.29cm.co.kr/search?query=${q}`,
    };
  };

  const saveCuration = async () => {
    if (!user || !curation || isSaved) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        image_url: curation.items[0]?.image_url || '',
        temperature: weather ? `${Math.round(weather.temperature)}°` : '',
        weather_condition: weather?.condition || 'Clear',
        tags: [curation.style, curation.colorTone].filter(Boolean),
        score: null,
        memo: `${curation.title}\n${curation.description}`,
      });
      if (error) throw error;
      setIsSaved(true);
      if (user) logEvent(user.id, 'curation_saved', { style: curation?.style, colorTone: curation?.colorTone });
      toast('오늘의 코디가 저널에 저장됐어요!', 'success');
    } catch {
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const wearToday = async () => {
    if (!user || !curation || isWorn) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        image_url: curation.items[0]?.image_url || '',
        temperature: weather ? `${Math.round(weather.temperature)}°` : '',
        weather_condition: weather?.condition || 'Clear',
        tags: [curation.style, curation.colorTone, '착용확정'].filter(Boolean),
        score: null,
        memo: `✅ 오늘 착용\n${curation.title}\n${curation.description}`,
      });
      if (error) throw error;
      setIsWorn(true);
      setIsSaved(true);
      if (user) logEvent(user.id, 'curation_worn', { style: curation?.style, colorTone: curation?.colorTone, items_count: curation?.items?.length });
      toast('오늘 착장으로 저널에 기록됐어요! 🎉', 'success');
    } catch {
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const generateCuration = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    setIsSaved(false);
    setIsWorn(false);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const res = await fetch('/api/curate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: profile || null,
          occasion,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCuration(data);
        if (user) logEvent(user.id, 'curation_generated', { style: data.style, colorTone: data.colorTone, items_count: data.items?.length });
      } else {
        setError(data.error || 'AI 큐레이션 오류');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const WeatherIcon = () => {
    if (!weather) return null;
    if (weather.condition === 'Rain') return <CloudRain className="w-4 h-4" />;
    if (weather.condition === 'Snow') return <CloudSnow className="w-4 h-4" />;
    if (weather.condition === 'Cloudy') return <Cloud className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0c0f] text-zinc-900 dark:text-white font-sans selection:bg-zinc-200 flex flex-col pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8f9fa] to-zinc-100 z-0 pointer-events-none dark:hidden" />

      {/* Header */}
      <header className="relative z-10 pt-12 lg:pt-8 pb-6 px-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">Seoul</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white mb-1">
              Today's<br className="lg:hidden" /> AI Curation
            </h1>
            {weather && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-xl rounded-full border border-black/5 mt-2 shadow-sm">
                <WeatherIcon />
                <span className="text-[10px] font-bold tracking-widest text-zinc-500">{weather.temperature}°C {weather.condition.toUpperCase()}</span>
              </div>
            )}
          </div>
          <button
            onClick={generateCuration}
            disabled={isLoading}
            className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-8 max-w-6xl mx-auto w-full" ref={containerRef}>
        <AnimatePresence mode="wait">
          
          {/* Initial State: No curation yet */}
          {!curation && !isLoading && !error && (
            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 lg:py-20 text-center">
              <div className="w-20 h-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-9 h-9 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200 mb-2">오늘 어디 가세요?</h2>
              <p className="text-sm text-zinc-400 mb-8">상황에 맞는 코디를 추천해드릴게요</p>

              {/* Occasion chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {OCCASIONS.map(o => (
                  <button key={o.id} onClick={() => setOccasion(o.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                      occasion === o.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                    }`}>
                    <span>{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>

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
                <button
                  onClick={generateCuration}
                  disabled={isLoading}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:opacity-80 transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> AI 코디 추천받기
                </button>
              )}
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-600 mb-2">AI 스타일리스트가 고민 중...</h3>
              <p className="text-xs text-zinc-400">옷장과 날씨를 분석해서 최적의 코디를 찾고 있어요</p>
            </motion.div>
          )}

          {/* Error */}
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

          {/* Result */}
          {curation && !isLoading && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>

              {/* Occasion chips (compact, re-selectable) */}
              <div className="flex flex-wrap gap-2 mb-6">
                {OCCASIONS.map(o => (
                  <button key={o.id} onClick={() => setOccasion(o.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      occasion === o.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>

              {/* ── Desktop: Side by Side ── */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                
                {/* Items Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8 lg:mb-0">
                  {curation.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center p-3">
                        <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110" draggable={false}
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
                      </div>
                      <div className="p-4">
                        <span className="text-[9px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-1">{item.category}</span>
                        <p className="text-sm font-bold text-zinc-800 mb-2 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">{item.reason}</p>
                        <div className="flex gap-2">
                          <a href={getSearchUrls(item.name).musinsa} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 rounded-lg hover:bg-zinc-700 transition">
                            <ExternalLink className="w-2.5 h-2.5 text-white" />
                            <span className="text-[9px] font-bold text-white">무신사</span>
                          </a>
                          <a href={getSearchUrls(item.name).cm29} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition">
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                            <span className="text-[9px] font-bold text-zinc-700">29CM</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Info Panel */}
                <div className="flex flex-col gap-5">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <h2 className="text-2xl font-black tracking-tight mb-3">{curation.title}</h2>
                    <p className="text-sm text-zinc-600 leading-relaxed mb-5">{curation.description}</p>
                    <div className="flex gap-3 flex-wrap">
                      <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500">Style</span>
                        <span className="text-[10px] font-bold text-black dark:text-white">{curation.style}</span>
                      </div>
                      <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500">Color</span>
                        <span className="text-[10px] font-bold text-black dark:text-white">{curation.colorTone}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={wearToday}
                    disabled={isSaving || isWorn}
                    className={`w-full py-4 rounded-2xl font-extrabold tracking-widest text-xs uppercase transition flex items-center justify-center gap-2 ${
                      isWorn
                        ? 'bg-emerald-500 text-white'
                        : 'bg-black text-white hover:bg-zinc-800 shadow-xl'
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isWorn ? <BookmarkCheck className="w-4 h-4" /> : <span>👕</span>}
                    {isWorn ? '오늘 착장 기록 완료!' : '오늘 이 코디 입었어요'}
                  </button>
                  <button
                    onClick={saveCuration}
                    disabled={isSaving || isSaved}
                    className={`w-full py-4 rounded-2xl font-extrabold tracking-widest text-xs uppercase transition flex items-center justify-center gap-2 ${
                      isSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {isSaved ? '저장 완료!' : '저널에 저장하기'}
                  </button>
                  {isSaved && (
                    <Link href="/journal" className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                      저널에서 보기 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={generateCuration}
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:bg-zinc-800 transition flex items-center justify-center gap-2"
                  >
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
