'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Ruler, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const MOODS = [
  { id: 'minimal', label: '미니멀', emoji: '깔끔한' },
  { id: 'street', label: '스트릿', emoji: '힙한' },
  { id: 'casual', label: '캐주얼', emoji: '편안한' },
  { id: 'gorpcore', label: '고프코어', emoji: '트렌디' },
  { id: 'cityboy', label: '시티보이', emoji: '오버핏' },
  { id: 'vintage', label: '빈티지', emoji: '레트로' },
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [fit, setFit] = useState('regular');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 이미 온보딩을 완료한 사용자인지 확인
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        // 이미 프로필이 있으면 홈으로
        router.push('/');
      }
      setIsChecking(false);
    };
    if (!authLoading) checkProfile();
  }, [user, authLoading, router]);
  
  const toggleMood = (id: string) => {
    setSelectedMoods(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : 
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const nextStep = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      // 온보딩 완료: Supabase에 저장
      setIsSaving(true);
      try {
        if (!user) return;
        
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            height,
            weight,
            fit_preference: fit,
            style_moods: selectedMoods,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) throw error;

        // 온보딩 완료 표시
        localStorage.setItem('ootd_onboarded', 'true');
        router.push('/');
      } catch (err) {
        console.error('프로필 저장 실패:', err);
        alert('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // 로딩 중
  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans overflow-hidden flex flex-col justify-between selection:bg-zinc-200">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_50%)] pointer-events-none" />

      {/* Progress */}
      <div className="px-6 pt-16 relative z-10 flex gap-2 max-w-lg mx-auto w-full">
        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.1)]' : 'bg-zinc-200'}`} />
        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.1)]' : 'bg-zinc-200'}`} />
      </div>

      <main className="px-8 flex-1 flex flex-col justify-center relative z-10 mt-10 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Body Profile */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-10"
            >
              <div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Ruler className="w-6 h-6 text-black" />
                </motion.div>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">나의 체형 정보</h1>
                <p className="text-zinc-500 text-sm leading-relaxed">보다 정확한 핏과 코디 추천을 위해<br/>딱 3가지만 알려주세요.</p>
              </div>

              <div className="space-y-10">
                {/* Height */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">키 (Height)</span>
                    <span className="text-3xl font-black font-serif tracking-tighter text-black">{height}<span className="text-sm font-sans text-zinc-400 italic ml-1">cm</span></span>
                  </div>
                  <input 
                    type="range" min="150" max="200" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">몸무게 (Weight)</span>
                    <span className="text-3xl font-black font-serif tracking-tighter text-black">{weight}<span className="text-sm font-sans text-zinc-400 italic ml-1">kg</span></span>
                  </div>
                  <input 
                    type="range" min="40" max="120" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>

                {/* Preferred Fit */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 block">원하는 옷장 핏감</span>
                  <div className="flex gap-3">
                    {['Slim', 'Regular', 'Oversized'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFit(f.toLowerCase())}
                        className={`flex-1 py-4.5 rounded-2xl text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm ${fit === f.toLowerCase() ? 'bg-black text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 border-b-2 border-b-zinc-300'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Style Mood */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-10"
            >
              <div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="w-6 h-6 text-black" />
                </motion.div>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">스타일 DNA</h1>
                <p className="text-zinc-500 text-sm leading-relaxed">추구하는 무드를 최대 3개 선택해주세요.<br/>AI 스타일리스트가 큐레이션에 반영합니다.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {MOODS.map(mood => {
                  const isSelected = selectedMoods.includes(mood.id);
                  return (
                    <button
                      key={mood.id}
                      onClick={() => toggleMood(mood.id)}
                      className={`relative p-5 rounded-[2rem] text-left transition-all overflow-hidden ${isSelected ? 'bg-black border-2 border-black shadow-[0_10px_25px_rgba(0,0,0,0.2)]' : 'bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 border-b-4 border-b-zinc-200'}`}
                    >
                      {isSelected && <div className="absolute top-4 right-4 text-white"><Check className="w-5 h-5 stroke-[3]" /></div>}
                      <span className={`block text-[10px] tracking-widest uppercase mb-1 font-bold ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>{mood.emoji}</span>
                      <span className={`block font-extrabold text-xl ${isSelected ? 'text-white' : 'text-zinc-800'}`}>{mood.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[11px] font-bold text-zinc-500 tracking-widest uppercase mt-4">
                {selectedMoods.length} / 3 Selected
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <div className="px-6 pb-12 pt-8 relative z-10 bg-gradient-to-t from-white via-white/90 to-transparent max-w-lg mx-auto w-full">
        <button 
          onClick={nextStep}
          disabled={(step === 2 && selectedMoods.length === 0) || isSaving}
          className="w-full flex items-center justify-center gap-2 py-5 bg-black text-white font-extrabold tracking-[0.2em] text-[11px] uppercase rounded-[1.5rem] disabled:opacity-40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
          ) : (
            <>{step === 1 ? '다음 단계로' : '완료하고 시작하기'} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
