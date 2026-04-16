'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sun, Cloud, CloudRain, CloudSnow, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface JournalEntry {
  id: string;
  image_url: string;
  temperature: string;
  weather_condition: string;
  score: number | null;
  memo: string;
  created_at: string;
}

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      setIsLoading(true);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: true });

      setEntries(data || []);
      setIsLoading(false);
    };
    if (!authLoading && user) fetchEntries();
  }, [user, authLoading, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getEntryForDay = (day: number): JournalEntry | undefined => {
    return entries.find(e => {
      const d = new Date(e.created_at);
      return d.getDate() === day;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const WeatherIcon = ({ condition }: { condition: string }) => {
    const cls = "w-3 h-3";
    if (condition === 'Rain') return <CloudRain className={cls} />;
    if (condition === 'Snow') return <CloudSnow className={cls} />;
    if (condition === 'Cloudy') return <Cloud className={cls} />;
    return <Sun className={cls} />;
  };

  // 달력 셀 배열 생성
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const totalEntries = entries.length;
  const avgScore = entries.filter(e => e.score).length > 0
    ? Math.round(entries.filter(e => e.score).reduce((sum, e) => sum + (e.score || 0), 0) / entries.filter(e => e.score).length)
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0c0c0f] font-sans pb-28 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-14 lg:pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">착장 캘린더</h1>
            <p className="text-[10px] text-zinc-400 tracking-widest uppercase mt-1">OOTD Calendar</p>
          </div>
          <button onClick={goToday}
            className="px-4 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md hover:bg-zinc-800 transition active:scale-95">
            오늘
          </button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4 shadow-sm">
          <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition active:scale-95">
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <div className="text-center">
            <span className="text-xl font-black tracking-tight text-black dark:text-white">{year}년 {MONTHS_KR[month]}</span>
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="text-[10px] font-bold text-zinc-400 tracking-widest">{totalEntries}일 기록</span>
              {avgScore && (
                <span className="text-[10px] font-bold text-zinc-400 tracking-widest">평균 {avgScore}점</span>
              )}
            </div>
          </div>
          <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition active:scale-95">
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_KR.map((day, i) => (
              <div key={day} className={`text-center text-[10px] font-bold tracking-wider py-2 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-400'
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Date Cells */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }
                const entry = getEntryForDay(day);
                const todayMark = isToday(day);
                const dayOfWeek = (firstDayOfMonth + day - 1) % 7;

                return (
                  <motion.button
                    key={day}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => entry && setSelectedEntry(entry)}
                    className={`aspect-square rounded-xl relative overflow-hidden transition-all ${
                      entry
                        ? 'shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                        : 'cursor-default'
                    } ${todayMark && !entry ? 'ring-2 ring-black ring-offset-1' : ''}`}
                  >
                    {entry ? (
                      <>
                        <img src={entry.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-1 left-1.5 text-[10px] font-black text-white drop-shadow">{day}</span>
                        {entry.score && (
                          <span className="absolute top-1 right-1 bg-white/90 text-[8px] font-black text-black px-1 rounded shadow-sm">
                            {entry.score}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        todayMark ? 'bg-black' : 'bg-zinc-50 dark:bg-zinc-800'
                      }`}>
                        <span className={`text-sm font-bold ${
                          todayMark ? 'text-white' :
                          dayOfWeek === 0 ? 'text-red-300' :
                          dayOfWeek === 6 ? 'text-blue-300' :
                          'text-zinc-300'
                        }`}>
                          {day}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black rounded-sm" />
            <span className="text-[10px] font-bold text-zinc-400">오늘</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-zinc-300 rounded-sm border border-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400">사진 있음</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed z-50 inset-4 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[420px] lg:max-h-[80vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] max-h-[50vh] overflow-hidden shrink-0">
                <img src={selectedEntry.image_url} alt="OOTD" className="w-full h-full object-cover" />
                <button onClick={() => setSelectedEntry(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                  <p className="text-white font-black text-lg">
                    {new Date(selectedEntry.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3 overflow-y-auto">
                <div className="flex items-center gap-3">
                  {selectedEntry.weather_condition && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full">
                      <WeatherIcon condition={selectedEntry.weather_condition} />
                      <span className="text-[10px] font-bold text-zinc-600">{selectedEntry.temperature} {selectedEntry.weather_condition}</span>
                    </div>
                  )}
                  {selectedEntry.score && (
                    <div className="px-3 py-1.5 bg-black rounded-full">
                      <span className="text-[10px] font-bold text-white">{selectedEntry.score}점</span>
                    </div>
                  )}
                </div>
                {selectedEntry.memo && (
                  <p className="text-sm text-zinc-600 leading-relaxed">{selectedEntry.memo}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
