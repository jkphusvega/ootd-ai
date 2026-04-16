

'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';

const MOODS = [
  { id: 'minimal', label: '미니멀', desc: '깔끔하고 군더더기 없는' },
  { id: 'street', label: '스트릿', desc: '힙하고 개성 있는' },
  { id: 'casual', label: '캐주얼', desc: '편안하고 자연스러운' },
  { id: 'gorpcore', label: '고프코어', desc: '트렌디한 아웃도어 감성' },
  { id: 'cityboy', label: '시티보이', desc: '오버핏 도시 감성' },
  { id: 'vintage', label: '빈티지', desc: '레트로하고 유니크한' },
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (authLoading) return;
      if (!user) { setIsChecking(false); router.push('/login'); return; }
      try {
        const { data } = await supabase.from('user_profiles').select('user_id').eq('user_id', user.id).single();
        if (data) { router.push('/'); return; }
      } catch {}
      setIsChecking(false);
    };
    checkProfile();
  }, [user, authLoading, router, supabase]);

  const toggleMood = (id: string) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleFinish = async () => {
    if (selectedMoods.length === 0) {
      toast('스타일을 최소 1개 선택해주세요!', 'info');
      return;
    }
    setIsSaving(true);
    try {
      if (!user) return;
      const nickname =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        'OOTD User';

      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        nickname,
        height: 170,
        weight: 65,
        fit_preference: 'regular',
        style_moods: selectedMoods,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      localStorage.setItem('ootd_onboarded', 'true');
      router.push('/add-clothes');
    } catch (err) {
      console.error('프로필 저장 실패:', err);
      toast('저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0c0c0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-white font-sans flex flex-col selection:bg-zinc-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_50%)] pointer-events-none" />

      <main className="flex-1 flex flex-col justify-center px-8 pt-20 pb-8 max-w-lg mx-auto w-full relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            어떤 스타일을<br />추구하나요?
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-10">
            최대 3개 선택 — AI가 날씨와 옷장에 맞춰<br />
            매일 딱 맞는 코디를 추천해 드려요.
          </p>
        </motion.div>

        {/* Mood Grid */}
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((mood, idx) => {
            const isSelected = selectedMoods.includes(mood.id);
            return (
              <motion.button
                key={mood.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.4 }}
                onClick={() => toggleMood(mood.id)}
                className={`relative p-5 rounded-[1.75rem] text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-black border-2 border-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-white">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
                <span className={`block text-[10px] tracking-widest uppercase mb-1.5 font-bold ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  {mood.desc}
                </span>
                <span className={`block font-extrabold text-xl ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-white'}`}>
                  {mood.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-[11px] font-bold text-zinc-400 tracking-widest uppercase mt-6">
          {selectedMoods.length} / 3 선택됨
        </p>
      </main>

      {/* CTA */}
      <div className="px-8 pb-12 pt-4 max-w-lg mx-auto w-full relative z-10">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleFinish}
          disabled={selectedMoods.length === 0 || isSaving}
          className="w-full flex items-center justify-center gap-2 py-5 bg-black text-white font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-40 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
          ) : (
            <>시작하기 <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <p className="text-center text-[10px] text-zinc-300 mt-4">
          키·몸무게·핏은 나중에 설정에서 수정할 수 있어요
        </p>
      </div>
    </div>
  );
}
