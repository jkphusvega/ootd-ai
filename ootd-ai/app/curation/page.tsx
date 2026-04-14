'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, RefreshCw, Sun, Cloud, CloudRain, CloudSnow, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';

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

export default function CurationPage() {
  const { user, loading: authLoading } = useAuth();
  const weather = useWeather();
  const [curation, setCuration] = useState<CurationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);
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

  const generateCuration = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
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
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCuration(data);
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
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8f9fa] to-zinc-100 z-0 pointer-events-none dark:hidden" />

      {/* Header */}
      <header className="relative z-10 pt-12 lg:pt-8 pb-6 px-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">Seoul</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black mb-1">
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
              className="flex flex-col items-center justify-center py-16 lg:py-24 text-center">
              <div className="w-20 h-20 bg-white border border-zinc-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-9 h-9 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-500 mb-3">AI 코디 추천 받기</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-2">
                내 옷장에 등록된 <span className="font-bold text-zinc-600">{wardrobeCount}개의 아이템</span>과<br />
                오늘의 날씨를 고려해서 AI가 코디를 추천합니다
              </p>
              {wardrobeCount === 0 && (
                <p className="text-xs text-amber-500 font-bold mt-2">⚠️ 먼저 옷장에 아이템을 등록해주세요</p>
              )}
              <button
                onClick={generateCuration}
                disabled={isLoading || wardrobeCount === 0}
                className="mt-8 px-8 py-4 bg-black text-white rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:bg-zinc-800 transition disabled:opacity-40 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> AI 큐레이션 시작
              </button>
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
                      className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-zinc-50 flex items-center justify-center p-3">
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
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <h2 className="text-2xl font-black tracking-tight mb-3">{curation.title}</h2>
                    <p className="text-sm text-zinc-600 leading-relaxed mb-5">{curation.description}</p>
                    <div className="flex gap-3 flex-wrap">
                      <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500">Style</span>
                        <span className="text-[10px] font-bold text-black">{curation.style}</span>
                      </div>
                      <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-500">Color</span>
                        <span className="text-[10px] font-bold text-black">{curation.colorTone}</span>
                      </div>
                    </div>
                  </div>

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
