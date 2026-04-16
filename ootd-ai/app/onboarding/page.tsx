'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const CONTEXTS = [
  { id: 'ctx_daily', label: '일상 외출', desc: '편하게 돌아다닐 때' },
  { id: 'ctx_work', label: '출근·학교', desc: '깔끔하고 단정하게' },
  { id: 'ctx_date', label: '데이트', desc: '조금 더 신경 쓰고 싶을 때' },
  { id: 'ctx_sport', label: '운동·액티비티', desc: '활동적이고 편한' },
  { id: 'ctx_formal', label: '격식·행사', desc: '세미포멀 이상' },
  { id: 'ctx_home', label: '홈웨어', desc: '집에서 편하게' },
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
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

  const toggleContext = (id: string) => {
    setSelectedContexts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleNext = () => {
    if (selectedMoods.length === 0) {
      toast('스타일을 최소 1개 선택해주세요!', 'info');
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    if (selectedContexts.length === 0) {
      toast('착장 상황을 최소 1개 선택해주세요!', 'info');
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
        style_moods: [...selectedMoods, ...selectedContexts],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      localStorage.setItem('ootd_onboarded', 'true');
      router.push('/add-clothes');
    } catch {
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

      {/* Progress bar */}
      <div className="relative z-10 pt-14 px-8 max-w-lg mx-auto w-full">
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: 스타일 무드 */}
        {step === 1 && (
          <motion.main key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center px-8 pb-8 max-w-lg mx-auto w-full relative z-10">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Sparkles className="w-6 h-6 text-black dark:text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
              어떤 스타일을<br />추구하나요?
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
              최대 3개 선택 — AI가 내 취향에 맞는 코디를 골라드려요.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {MOODS.map((mood, idx) => {
                const isSelected = selectedMoods.includes(mood.id);
                return (
                  <motion.button
                    key={mood.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.4 }}
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
                    <span className="block text-[10px] tracking-widest uppercase mb-1.5 font-bold text-zinc-400">
                      {mood.desc}
                    </span>
                    <span className={`block font-extrabold text-xl ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-white'}`}>
                      {mood.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[11px] font-bold text-zinc-400 tracking-widest uppercase mt-5 mb-6">
              {selectedMoods.length} / 3 선택됨
            </p>

            <button
              onClick={handleNext}
              disabled={selectedMoods.length === 0}
              className="w-full flex items-center justify-center gap-2 py-5 bg-black text-white font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-40 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          </motion.main>
        )}

        {/* Step 2: 착장 상황 */}
        {step === 2 && (
          <motion.main key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center px-8 pb-8 max-w-lg mx-auto w-full relative z-10">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-xl">👕</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
              주로 언제<br />옷을 입나요?
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
              최대 3개 선택 — AI가 상황에 맞게 코디를 추천해요.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {CONTEXTS.map((ctx, idx) => {
                const isSelected = selectedContexts.includes(ctx.id);
                return (
                  <motion.button
                    key={ctx.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.4 }}
                    onClick={() => toggleContext(ctx.id)}
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
                    <span className="block text-[10px] tracking-widest uppercase mb-1.5 font-bold text-zinc-400">
                      {ctx.desc}
                    </span>
                    <span className={`block font-extrabold text-xl ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-white'}`}>
                      {ctx.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[11px] font-bold text-zinc-400 tracking-widest uppercase mt-5 mb-6">
              {selectedContexts.length} / 3 선택됨
            </p>

            <button
              onClick={handleFinish}
              disabled={selectedContexts.length === 0 || isSaving}
              className="w-full flex items-center justify-center gap-2 py-5 bg-black text-white font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-40 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
              ) : (
                <>시작하기 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <p className="text-center text-[10px] text-zinc-300 mt-4">
              키·몸무게·핏은 나중에 설정에서 수정할 수 있어요
            </p>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
