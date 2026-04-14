'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sun, Calendar, Image as ImageIcon, Camera, X, Check, Cloud, CloudRain, CloudSnow, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useWeather } from '../../hooks/useWeather';
import { useToast } from '../../components/ToastProvider';

interface JournalEntry {
  id: string;
  image_url: string;
  temperature: string;
  weather_condition: string;
  tags: string[];
  score: number | null;
  memo: string;
  created_at: string;
}

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const weather = useWeather();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 비로그인 유저 접근 차단
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  // Fetch journal entries from Supabase
  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data && !error) setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => { 
    if (!authLoading) {
      fetchEntries(); 
    }
  }, [user, authLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState('analyzing');

    try {
      // Upload image to Supabase Storage
      const fileName = `journal_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);

      const temp = weather ? `${Math.round(weather.temperature)}°` : '20°';
      const condition = weather?.condition ?? 'Clear';

      // Save to journal_entries table
      const { error: dbError } = await supabase.from('journal_entries').insert({
        user_id: user!.id,
        image_url: publicUrl,
        temperature: temp,
        weather_condition: condition,
        tags: [],
        score: null,
        memo: '',
      });
      if (dbError) throw dbError;

      setUploadState('done');
      fetchEntries();
    } catch (err) {
      console.error('Journal upload error:', err);
      toast('저널 업로드 중 오류가 발생했습니다.', 'error');
      setUploadState('idle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 저널 기록을 삭제하시겠습니까?')) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('journal_entries').delete().eq('id', id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setUploadState('idle'), 300);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      year: d.getFullYear(),
    };
  };

  const WeatherIcon = ({ condition }: { condition: string }) => {
    if (condition === 'Rain') return <CloudRain className="w-3.5 h-3.5" />;
    if (condition === 'Snow') return <CloudSnow className="w-3.5 h-3.5" />;
    if (condition === 'Cloudy') return <Cloud className="w-3.5 h-3.5" />;
    return <Sun className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] dark:bg-[#0c0c0f] text-zinc-900 dark:text-white font-sans selection:bg-zinc-200 pb-28 lg:pb-8">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />

      {/* Header */}
      <header className="px-6 pt-14 lg:pt-8 pb-4 sticky top-0 bg-[#FDFDFC]/90 dark:bg-[#0c0c0f]/90 backdrop-blur-xl z-30 border-b border-transparent dark:border-zinc-800/50">
        <div className="max-w-5xl mx-auto flex justify-between items-end mb-2">
          <div>
            <h1 className="text-3xl font-serif italic text-zinc-800 dark:text-white tracking-tight">OOTD Journal</h1>
            <p className="text-[10px] text-zinc-400 tracking-[0.2em] uppercase mt-2 font-medium">
              {entries.length > 0 ? `${entries.length} ENTRIES` : 'Start Logging'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg hover:bg-zinc-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </header>

      {/* Main Feed */}
      <main className="px-6 mt-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center mb-5">
              <Calendar className="w-7 h-7 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-400 mb-2">아직 기록이 없어요</h3>
            <p className="text-sm text-zinc-300 mb-6">오늘의 OOTD를 기록해보세요!</p>
            <button onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg hover:bg-zinc-800 transition">
              첫 번째 기록 남기기
            </button>
          </div>
        ) : (
          /* ── Responsive Grid: 1col mobile, 2col tablet, 3col desktop ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {entries.map((entry, idx) => {
              const dt = formatDate(entry.created_at);
              return (
                <motion.article
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="flex flex-col gap-3"
                >
                  {/* Date line */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{dt.day}</span>
                      <span className="block text-xl font-serif text-zinc-800">{dt.date}</span>
                    </div>
                    <div className="flex-1 h-[1px] bg-zinc-100" />
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <WeatherIcon condition={entry.weather_condition || 'Clear'} />
                      <span className="text-[10px] font-medium">{entry.temperature || ''}</span>
                    </div>
                  </div>

                  {/* Photo Card */}
                  <div className="relative aspect-[3/4] w-full rounded-[1.5rem] overflow-hidden bg-zinc-50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group cursor-pointer border border-zinc-100">
                    <img src={entry.image_url} alt="OOTD" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                    
                    {/* Delete button */}
                    <button onClick={() => handleDelete(entry.id)}
                      className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-black/70">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Score badge */}
                    {entry.score && (
                      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/50">
                        <span className="text-[10px] font-black text-zinc-800">{entry.score}점</span>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-80 pointer-events-none" />
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                        {entry.tags.map(tag => (
                          <span key={tag} className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] tracking-wider font-semibold border border-white/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}

            {/* Add New Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsModalOpen(true)}
              className="aspect-[3/4] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
            >
              <Calendar className="w-8 h-8 opacity-50" strokeWidth={1.5} />
              <p className="text-xs font-semibold tracking-widest uppercase">Add Today's Outfit</p>
            </motion.div>
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl z-40 transition-colors hover:bg-zinc-800"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={uploadState !== 'analyzing' ? closeModal : undefined} />
            
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-zinc-900 rounded-t-[2.5rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] border-t border-zinc-100 dark:border-zinc-800 flex flex-col items-center min-h-[35vh] lg:max-w-lg lg:left-1/2 lg:-translate-x-1/2 lg:rounded-2xl lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
            >
              <div className="w-12 h-1 bg-zinc-200 rounded-full mb-8 lg:hidden" />

              {uploadState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-serif italic text-zinc-900">Log Today's Outfit</h2>
                      <p className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-widest font-semibold">사진 한 장으로 오늘의 OOTD 기록</p>
                    </div>
                    <button onClick={closeModal} className="p-2.5 bg-zinc-50 rounded-full text-zinc-500 hover:bg-zinc-100 transition border border-zinc-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => cameraInputRef.current?.click()} className="group flex flex-col items-center justify-center gap-4 bg-white border border-zinc-200 aspect-square rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                      <div className="p-5 bg-zinc-50 rounded-full group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7 text-zinc-700" strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-zinc-600 text-xs tracking-widest uppercase">Camera</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center gap-4 bg-white border border-zinc-200 aspect-square rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                      <div className="p-5 bg-zinc-50 rounded-full group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-7 h-7 text-zinc-700" strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-zinc-600 text-xs tracking-widest uppercase">Library</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {uploadState === 'analyzing' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-10 w-full">
                  <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-6" />
                  <h3 className="text-xl font-serif italic text-zinc-800 mb-2">업로드 중...</h3>
                  <p className="text-[10px] text-zinc-400 tracking-widest uppercase font-semibold">Saving to Journal</p>
                </motion.div>
              )}

              {uploadState === 'done' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-6 w-full">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                    <Check className="w-8 h-8" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-serif italic text-zinc-800 mb-3">기록 완료!</h3>
                  <p className="text-xs text-zinc-500 mb-8 text-center">오늘의 OOTD가 저널에 저장되었습니다.</p>
                  <button onClick={closeModal} className="w-full bg-zinc-900 text-white text-sm tracking-widest uppercase font-bold py-4 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all">
                    확인
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
