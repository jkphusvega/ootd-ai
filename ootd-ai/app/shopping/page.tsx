'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, RefreshCw, Loader2, Tag, MapPin, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';
import { useToast } from '../../components/ToastProvider';
import StyleSubNav from '../../components/StyleSubNav';

interface ShoppingSuggestion {
  name: string;
  category: string;
  reason: string;
  priceRange: string;
  brandTip: string;
}

interface ShoppingResult {
  analysis: string;
  suggestions: ShoppingSuggestion[];
}

export default function ShoppingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [result, setResult] = useState<ShoppingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const weather = useWeather();
  const { toast } = useToast();
  const [wardrobeCount, setWardrobeCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

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
    if (!authLoading && user) checkWardrobe();
  }, [user, authLoading]);

  const generateRecommendations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: profile || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        toast(data.error || 'AI 추천 오류', 'error');
      }
    } catch {
      toast('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryEmoji = (cat: string) => {
    if (cat.includes('outer')) return '🧥';
    if (cat.includes('top')) return '👕';
    if (cat.includes('bottom')) return '👖';
    if (cat.includes('shoe')) return '👟';
    return '🧦';
  };

  const getSearchUrls = (name: string) => {
    const q = encodeURIComponent(name);
    return {
      musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
      cm29: `https://www.29cm.co.kr/search?query=${q}`,
    };
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0c0c0f] font-sans pb-28 lg:pb-8">
      <div className="max-w-2xl mx-auto px-5 pt-14 lg:pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">AI 쇼핑 추천</h1>
            <p className="text-[10px] text-zinc-400 tracking-widest uppercase mt-1">Smart Shopping Advisor</p>
          </div>
          {result && (
            <button onClick={generateRecommendations} disabled={isLoading}
              className="w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <StyleSubNav />

        <AnimatePresence mode="wait">
          {/* Initial State */}
          {!result && !isLoading && (
            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-white border border-zinc-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <ShoppingBag className="w-9 h-9 text-zinc-300" />
              </div>
              <h2 className="text-xl font-bold text-zinc-500 mb-3">쇼핑 어드바이저</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-2">
                내 옷장의 <span className="font-bold text-zinc-600">{wardrobeCount}개 아이템</span>을 분석해서<br />
                부족한 아이템을 AI가 추천합니다
              </p>
              {wardrobeCount === 0 && (
                <p className="text-xs text-amber-500 font-bold mt-2">⚠️ 먼저 옷장에 아이템을 등록해주세요</p>
              )}
              <button onClick={generateRecommendations} disabled={isLoading || wardrobeCount === 0}
                className="mt-8 px-8 py-4 bg-black text-white rounded-2xl font-extrabold tracking-widest text-xs uppercase shadow-xl hover:bg-zinc-800 transition disabled:opacity-40 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI 쇼핑 추천 받기
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-6" />
              <h3 className="text-lg font-bold text-zinc-600 mb-2">옷장을 분석하고 있어요...</h3>
              <p className="text-xs text-zinc-400">어떤 아이템이 부족한지 AI가 찾고 있습니다</p>
            </motion.div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Analysis Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-black rounded-3xl p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/60">AI 분석 결과</span>
                </div>
                <p className="text-[14px] text-white leading-relaxed font-medium">{result.analysis}</p>
              </motion.div>

              {/* Suggestion Cards */}
              <div className="space-y-4">
                {result.suggestions.map((item, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-black dark:text-white mb-2 break-keep">{item.name}</h3>
                        <p className="text-[12px] text-zinc-500 leading-relaxed mb-3">{item.reason}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700">{item.priceRange}</span>
                          </div>
                          <a href={getSearchUrls(item.name).musinsa} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 rounded-lg hover:bg-zinc-700 transition">
                            <ExternalLink className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-bold text-white">무신사</span>
                          </a>
                          <a href={getSearchUrls(item.name).cm29} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#ff3e5c] rounded-lg hover:bg-[#e63550] transition">
                            <ExternalLink className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-bold text-white">29CM</span>
                          </a>
                        </div>

                        <div className="flex items-start gap-1.5 mt-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <MapPin className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-zinc-500 leading-relaxed">{item.brandTip}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
