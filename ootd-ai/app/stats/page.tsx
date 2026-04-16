'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Shirt, TrendingUp, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface ClothItem {
  id: string;
  category: string;
  name: string;
  image_url: string;
}

interface JournalEntry {
  id: string;
  score: number | null;
  weather_condition: string;
  created_at: string;
}

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [clothes, setClothes] = useState<ClothItem[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);

      const [clothesRes, entriesRes] = await Promise.all([
        supabase.from('clothes').select('*').eq('user_id', user.id).neq('category', 'ootd_feed'),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setClothes(clothesRes.data || []);
      setEntries(entriesRes.data || []);
      setIsLoading(false);
    };
    if (!authLoading && user) fetchData();
  }, [user, authLoading]);

  // 카테고리별 아이템 수
  const categoryStats = ['outer', 'top', 'bottom', 'shoes', 'bag', 'accessory'].map(cat => ({
    category: cat,
    count: clothes.filter(c => c.category === cat).length,
    label: cat === 'outer' ? '아우터' : cat === 'top' ? '상의' : cat === 'bottom' ? '하의' : cat === 'shoes' ? '신발' : cat === 'bag' ? '가방' : '액세서리',
  }));
  const maxCount = Math.max(...categoryStats.map(c => c.count), 1);

  // 총 아이템 수
  const totalItems = clothes.length;

  // 저널 통계
  const totalEntries = entries.length;
  const scoredEntries = entries.filter(e => e.score !== null);
  const avgScore = scoredEntries.length > 0
    ? Math.round(scoredEntries.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredEntries.length)
    : null;
  const bestScore = scoredEntries.length > 0
    ? Math.max(...scoredEntries.map(e => e.score ?? 0))
    : null;

  // 이번 달 착장 횟수
  const now = new Date();
  const thisMonthEntries = entries.filter(e => {
    const d = new Date(e.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // 날씨별 기록 수
  const weatherStats = ['Clear', 'Cloudy', 'Rain', 'Snow'].map(w => ({
    condition: w,
    count: entries.filter(e => e.weather_condition === w).length,
    label: w === 'Clear' ? '☀️ 맑음' : w === 'Cloudy' ? '☁️ 흐림' : w === 'Rain' ? '🌧️ 비' : '❄️ 눈',
  }));

  // 주간 착장 빈도 (최근 12주)
  const weeklyData: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const count = entries.filter(e => {
      const d = new Date(e.created_at);
      return d >= weekStart && d <= weekEnd;
    }).length;
    weeklyData.push(count);
  }
  const maxWeekly = Math.max(...weeklyData, 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] font-sans pb-28 lg:pb-8">
        <div className="max-w-2xl mx-auto px-5 pt-14 lg:pt-8">
          <div className="mb-8">
            <div className="w-32 h-7 bg-zinc-200 rounded-lg animate-pulse" />
            <div className="w-20 h-3 bg-zinc-100 rounded-full animate-pulse mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                <div className="w-8 h-8 bg-zinc-100 rounded-xl animate-pulse mb-3" />
                <div className="w-16 h-7 bg-zinc-200 rounded-lg animate-pulse" />
                <div className="w-24 h-3 bg-zinc-100 rounded-full animate-pulse mt-2" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
            <div className="w-32 h-3 bg-zinc-100 rounded-full animate-pulse mb-5" />
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 mb-4">
                <div className="w-16 h-4 bg-zinc-100 rounded-full animate-pulse" />
                <div className="flex-1 h-6 bg-zinc-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
            <div className="w-40 h-3 bg-zinc-100 rounded-full animate-pulse mb-5" />
            <div className="flex items-end gap-1.5 h-32">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="flex-1 bg-zinc-100 rounded-md animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0c0c0f] font-sans pb-28 lg:pb-8">
      <div className="max-w-2xl mx-auto px-5 pt-14 lg:pt-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">스타일 통계</h1>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 tracking-widest uppercase mt-1">Style Analytics</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: '총 옷장 아이템', value: `${totalItems}벌`, icon: Shirt, color: 'bg-zinc-900' },
            { label: '총 착장 기록', value: `${totalEntries}회`, icon: BarChart3, color: 'bg-zinc-700' },
            { label: '이번 달 기록', value: `${thisMonthEntries.length}회`, icon: TrendingUp, color: 'bg-zinc-600' },
            { label: avgScore ? '평균 OOTD 점수' : '최고 점수', value: avgScore ? `${avgScore}점` : bestScore ? `${bestScore}점` : '-', icon: Palette, color: 'bg-zinc-500' },
          ].map((card, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
              <div className={`w-8 h-8 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-black text-black tracking-tight">{card.value}</p>
              <p className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Category Breakdown */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-5">카테고리별 아이템 수</h2>
          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 w-16 shrink-0">{cat.label}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-black rounded-full flex items-center justify-end px-2 min-w-[24px]"
                  >
                    <span className="text-[10px] font-black text-white">{cat.count}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Weekly Activity */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-5">주간 착장 빈도 (최근 12주)</h2>
          <div className="flex items-end gap-1.5 h-32">
            {weeklyData.map((count, idx) => (
              <motion.div key={idx} className="flex-1 flex flex-col items-center gap-1"
                initial={{ height: 0 }} animate={{ height: 'auto' }} transition={{ delay: idx * 0.03 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((count / maxWeekly) * 100, 4)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.03 }}
                  className={`w-full rounded-md ${count > 0 ? 'bg-black' : 'bg-zinc-200'}`}
                  style={{ minHeight: 4 }}
                />
                {idx === weeklyData.length - 1 && (
                  <span className="text-[8px] font-bold text-zinc-400">이번주</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Weather Distribution */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-5">날씨별 착장 기록</h2>
          <div className="grid grid-cols-4 gap-3">
            {weatherStats.map((w) => (
              <div key={w.condition} className="text-center">
                <p className="text-2xl mb-1">{w.label.split(' ')[0]}</p>
                <p className="text-lg font-black text-black">{w.count}</p>
                <p className="text-[9px] font-bold text-zinc-400">{w.label.split(' ')[1]}</p>
              </div>
            ))}
          </div>
        </motion.section>

      </div>
    </div>
  );
}
