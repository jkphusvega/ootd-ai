'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';

// ── 스타일 포토 데이터 ──
// 각 사진에 스타일 메타데이터 태그를 부여 → 선택 후 집계하여 style_embedding 생성
const STYLE_PHOTOS = [
  {
    id: 'minimal-1',
    url: 'https://images.unsplash.com/photo-1613728455120-d00493b5e77e?w=400&h=600&fit=crop&q=80',
    style: 'minimal', styleLabel: '미니멀',
    tags: { colors: ['black', 'white', 'neutral'], fit: 'slim', formality: 'smart-casual', vibe: ['clean', 'modern', 'quiet'] },
  },
  {
    id: 'minimal-2',
    url: 'https://images.unsplash.com/photo-1629922948950-08e61289569b?w=400&h=600&fit=crop&q=80',
    style: 'minimal', styleLabel: '미니멀',
    tags: { colors: ['black', 'white'], fit: 'slim', formality: 'smart-casual', vibe: ['clean', 'polished', 'modern'] },
  },
  {
    id: 'street-1',
    url: 'https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?w=400&h=600&fit=crop&q=80',
    style: 'street', styleLabel: '스트리트',
    tags: { colors: ['black', 'grey', 'bold'], fit: 'oversized', formality: 'casual', vibe: ['hype', 'urban', 'edgy'] },
  },
  {
    id: 'street-2',
    url: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&h=600&fit=crop&q=80',
    style: 'street', styleLabel: '스트리트',
    tags: { colors: ['black', 'grey'], fit: 'oversized', formality: 'casual', vibe: ['hype', 'urban'] },
  },
  {
    id: 'oldmoney-1',
    url: 'https://images.unsplash.com/photo-1691154928997-5d839847e4e7?w=400&h=600&fit=crop&q=80',
    style: 'oldmoney', styleLabel: '올드머니',
    tags: { colors: ['white', 'beige', 'cream'], fit: 'tailored', formality: 'business-casual', vibe: ['classic', 'elegant', 'quiet-luxury'] },
  },
  {
    id: 'oldmoney-2',
    url: 'https://images.unsplash.com/photo-1692191798521-f146083a283d?w=400&h=600&fit=crop&q=80',
    style: 'oldmoney', styleLabel: '올드머니',
    tags: { colors: ['neutral', 'beige', 'earth'], fit: 'tailored', formality: 'business-casual', vibe: ['classic', 'refined', 'quiet-luxury'] },
  },
  {
    id: 'gorpcore-1',
    url: 'https://images.unsplash.com/photo-1603920351464-8f79cb4e5dcc?w=400&h=600&fit=crop&q=80',
    style: 'gorpcore', styleLabel: '고프코어',
    tags: { colors: ['olive', 'brown', 'earth'], fit: 'regular', formality: 'casual', vibe: ['outdoor', 'functional', 'rugged'] },
  },
  {
    id: 'gorpcore-2',
    url: 'https://images.unsplash.com/photo-1598721172588-6a690043bc3f?w=400&h=600&fit=crop&q=80',
    style: 'gorpcore', styleLabel: '고프코어',
    tags: { colors: ['olive', 'black', 'grey'], fit: 'regular', formality: 'casual', vibe: ['outdoor', 'adventure', 'layered'] },
  },
  {
    id: 'amekaji-1',
    url: 'https://images.unsplash.com/photo-1582234248658-1c965dbbec6c?w=400&h=600&fit=crop&q=80',
    style: 'amekaji', styleLabel: '아메카지',
    tags: { colors: ['denim', 'indigo', 'white'], fit: 'regular', formality: 'casual', vibe: ['workwear', 'vintage', 'rugged'] },
  },
  {
    id: 'amekaji-2',
    url: 'https://images.unsplash.com/photo-1634133118577-d70216e68eae?w=400&h=600&fit=crop&q=80',
    style: 'amekaji', styleLabel: '아메카지',
    tags: { colors: ['denim', 'white', 'neutral'], fit: 'regular', formality: 'casual', vibe: ['classic', 'workwear', 'americana'] },
  },
  {
    id: 'y2k-1',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop&q=80',
    style: 'y2k', styleLabel: 'Y2K',
    tags: { colors: ['yellow', 'bright', 'bold'], fit: 'regular', formality: 'casual', vibe: ['retro', 'playful', 'bold'] },
  },
  {
    id: 'y2k-2',
    url: 'https://images.unsplash.com/photo-1761979680036-38a7f85b2f0b?w=400&h=600&fit=crop&q=80',
    style: 'y2k', styleLabel: 'Y2K',
    tags: { colors: ['blue', 'plaid', 'mixed'], fit: 'regular', formality: 'casual', vibe: ['retro', 'fun', 'trendy'] },
  },
];

// 선택된 사진들의 태그를 집계하여 스타일 프로필(임베딩) 생성
function deriveStyleEmbedding(selectedIds: string[]) {
  const selected = STYLE_PHOTOS.filter(p => selectedIds.includes(p.id));
  if (selected.length === 0) return null;

  const freq = <T extends string>(arr: T[]) =>
    arr.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {} as Record<string, number>);

  const topN = (obj: Record<string, number>, n: number) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  const allColors = selected.flatMap(p => p.tags.colors);
  const allVibes  = selected.flatMap(p => p.tags.vibe);
  const allFits   = selected.map(p => p.tags.fit);
  const allStyles = selected.map(p => p.style);

  const fitFreq   = freq(allFits);
  const dominantFit = Object.entries(fitFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'regular';

  return {
    dominant_styles:  [...new Set(allStyles)],
    dominant_colors:  topN(freq(allColors), 3),
    dominant_vibes:   topN(freq(allVibes), 4),
    fit_tendency:     dominantFit,
    photo_ids:        selectedIds,
  };
}

const CONTEXTS = [
  { id: 'ctx_daily',  label: '일상 외출', desc: '편하게 돌아다닐 때' },
  { id: 'ctx_work',   label: '출근·학교', desc: '깔끔하고 단정하게' },
  { id: 'ctx_date',   label: '데이트',    desc: '조금 더 신경 쓰고 싶을 때' },
  { id: 'ctx_sport',  label: '운동·액티비티', desc: '활동적이고 편한' },
  { id: 'ctx_formal', label: '격식·행사', desc: '세미포멀 이상' },
];

const BODY_SHAPES = [
  { id: 'pear',       label: '서양배형', desc: '하체가 발달한 체형',     emoji: '🍐' },
  { id: 'strawberry', label: '딸기형',   desc: '상체/어깨가 발달한 체형', emoji: '🍓' },
  { id: 'banana',     label: '바나나형', desc: '슬림하고 곧은 체형',     emoji: '🍌' },
  { id: 'apple',      label: '사과형',   desc: '복부가 발달한 체형',     emoji: '🍎' },
];

const BODY_GOALS = [
  { id: 'taller',     label: '비율 깡패', desc: '다리가 길어 보이게',    emoji: '📏' },
  { id: 'broader',    label: '어깨 깡패', desc: '어깨가 넓어 보이게',    emoji: '🏋️' },
  { id: 'slimmer',    label: '슬림 핏',   desc: '전체적으로 갸름해 보이게', emoji: '🕴️' },
  { id: 'cover_legs', label: '하체 커버', desc: '다리 라인을 가리게',    emoji: '👖' },
];

const TOTAL_STEPS = 3;
const COMPLETION_PCT = [33, 66, 100];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [fitPreference, setFitPreference] = useState<'slim' | 'regular' | 'oversized'>('regular');
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // [PREVIEW MODE] 즉시 표시
    setIsChecking(false);
  }, []);

  const togglePhoto = (id: string) => {
    setSelectedPhotos(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) :
      prev.length < 6 ? [...prev, id] : prev
    );
  };

  const toggleContext = (id: string) => {
    setSelectedContexts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedPhotos.length < 2) { toast('마음에 드는 스타일을 2개 이상 골라주세요!', 'info'); return; }
      setStep(2);
    } else if (step === 2) {
      if (selectedContexts.length === 0) { toast('착장 상황을 최소 1개 선택해주세요!', 'info'); return; }
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!selectedShape || !selectedGoal) {
      toast('체형과 보완 목표를 모두 선택해주세요!', 'info');
      return;
    }
    setIsSaving(true);
    try {
      if (!user) return;
      const nickname =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] || 'OOTD User';

      const styleEmbedding = deriveStyleEmbedding(selectedPhotos);

      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        nickname,
        height,
        weight,
        fit_preference: fitPreference,
        style_moods: styleEmbedding?.dominant_styles || [],
        body_shape: selectedShape,
        body_goal: selectedGoal,
        style_embedding: styleEmbedding,
        style_contexts: selectedContexts,
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  const completionPct = COMPLETION_PCT[step - 1];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans flex flex-col">

      {/* Progress */}
      <div className="pt-14 px-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 w-8 rounded-full transition-all duration-500 ${i < step ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            ))}
          </div>
          <span className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase">
            스타일 프로필 {completionPct}% 완료
          </span>
        </div>
        <div className="h-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-0">
          <motion.div
            className="h-full bg-zinc-900 dark:bg-white rounded-full"
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: 스타일 포토 픽커 ── */}
        {step === 1 && (
          <motion.main key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pb-8 max-w-2xl mx-auto w-full">

            <div className="pt-8 pb-6">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Sparkles className="w-6 h-6 text-black dark:text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                마음에 드는 룩을<br />골라주세요
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                AI가 취향을 분석해 코디를 추천해요 · 최대 6개 선택
              </p>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {STYLE_PHOTOS.map((photo, idx) => {
                const isSelected = selectedPhotos.includes(photo.id);
                return (
                  <motion.button
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'ring-[3px] ring-black dark:ring-white scale-[0.97]'
                        : 'opacity-90 hover:opacity-100 active:scale-[0.97]'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.styleLabel}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Style label */}
                    <span className="absolute bottom-2 left-2 text-[9px] font-extrabold tracking-widest text-white/80 uppercase">
                      {photo.styleLabel}
                    </span>

                    {/* Check badge */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-4 h-4 text-white dark:text-black" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-auto">
              <p className="text-center text-[11px] font-bold text-zinc-400 tracking-widest uppercase mb-4">
                {selectedPhotos.length}개 선택됨 {selectedPhotos.length >= 2 ? '✓' : '· 최소 2개'}
              </p>
              <button
                onClick={handleNext}
                disabled={selectedPhotos.length < 2}
                className="w-full flex items-center justify-center gap-2 py-5 bg-black dark:bg-white text-white dark:text-zinc-900 font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98]"
              >
                다음 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.main>
        )}

        {/* ── STEP 2: 착장 상황 ── */}
        {step === 2 && (
          <motion.main key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center px-8 pb-8 max-w-lg mx-auto w-full">

            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-xl">👕</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              주로 언제<br />옷을 입나요?
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
              최대 3개 선택 — 상황에 딱 맞는 코디를 추천해요.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {CONTEXTS.map((ctx, idx) => {
                const isSelected = selectedContexts.includes(ctx.id);
                return (
                  <motion.button
                    key={ctx.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.4 }}
                    onClick={() => toggleContext(ctx.id)}
                    className={`relative p-5 rounded-[1.75rem] text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-black dark:bg-white border-2 border-black dark:border-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-white dark:text-black">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                    )}
                    <span className="block text-[10px] tracking-widest uppercase mb-1.5 font-bold text-zinc-400">
                      {ctx.desc}
                    </span>
                    <span className={`block font-extrabold text-xl ${isSelected ? 'text-white dark:text-black' : 'text-zinc-800 dark:text-white'}`}>
                      {ctx.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[11px] font-bold text-zinc-400 tracking-widest uppercase mb-6">
              {selectedContexts.length} / 3 선택됨
            </p>
            <button
              onClick={handleNext}
              disabled={selectedContexts.length === 0}
              className="w-full flex items-center justify-center gap-2 py-5 bg-black dark:bg-white text-white dark:text-zinc-900 font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98]"
            >
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          </motion.main>
        )}

        {/* ── STEP 3: 체형 & 목표 ── */}
        {step === 3 && (
          <motion.main key="step3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center px-8 pb-8 max-w-lg mx-auto w-full">

            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-xl">📏</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              나의 체형과<br />보완 목표는?
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
              체형에 맞는 핏과 스타일링 팁을 AI가 조언해 드립니다.
            </p>

            <div className="space-y-5 mb-6">
              {/* 키 / 몸무게 */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: '키', unit: 'cm', value: height, setValue: setHeight, min: 140, max: 210 },
                  { label: '몸무게', unit: 'kg', value: weight, setValue: setWeight, min: 35, max: 130 },
                ] as const).map(({ label, unit, value, setValue, min, max }) => (
                  <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">{label}</span>
                    <span className="text-2xl font-black">{value}<span className="text-sm font-bold text-zinc-400 ml-0.5">{unit}</span></span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setValue(v => Math.max(min, v - 1))}
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold hover:bg-zinc-200 active:scale-90 transition">−</button>
                      <button onClick={() => setValue(v => Math.min(max, v + 1))}
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold hover:bg-zinc-200 active:scale-90 transition">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 핏 선호도 */}
              <div>
                <p className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase mb-3">선호하는 핏</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'slim', label: '슬림', desc: '몸에 딱 맞게' },
                    { id: 'regular', label: '레귤러', desc: '적당히 편하게' },
                    { id: 'oversized', label: '오버핏', desc: '여유 있게' },
                  ] as const).map(fit => (
                    <button key={fit.id} onClick={() => setFitPreference(fit.id)}
                      className={`p-3 rounded-2xl text-center transition-all border ${
                        fitPreference === fit.id
                          ? 'bg-black dark:bg-white text-white dark:text-zinc-900 border-black dark:border-white shadow-md'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                      }`}>
                      <span className={`block font-bold text-sm ${fitPreference === fit.id ? '' : 'text-zinc-800 dark:text-zinc-200'}`}>{fit.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${fitPreference === fit.id ? 'opacity-60' : 'text-zinc-400'}`}>{fit.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 체형 */}
              <div>
                <p className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase mb-3">내 체형 타입</p>
                <div className="grid grid-cols-2 gap-2">
                  {BODY_SHAPES.map(shape => (
                    <button key={shape.id} onClick={() => setSelectedShape(shape.id)}
                      className={`p-4 rounded-2xl text-left transition-all border flex gap-3 items-center ${
                        selectedShape === shape.id
                          ? 'bg-black dark:bg-white border-black dark:border-white shadow-md'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                      }`}>
                      <span className="text-2xl shrink-0">{shape.emoji}</span>
                      <div>
                        <span className={`block font-bold text-sm ${selectedShape === shape.id ? 'text-white dark:text-zinc-900' : 'text-zinc-800 dark:text-zinc-200'}`}>{shape.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedShape === shape.id ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>{shape.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 보완 목표 */}
              <div>
                <p className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase mb-3">옷을 입을 때 바라는 점</p>
                <div className="grid grid-cols-2 gap-2">
                  {BODY_GOALS.map(goal => (
                    <button key={goal.id} onClick={() => setSelectedGoal(goal.id)}
                      className={`p-4 rounded-2xl text-left transition-all border flex gap-3 items-center ${
                        selectedGoal === goal.id
                          ? 'bg-black dark:bg-white border-black dark:border-white shadow-md'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                      }`}>
                      <span className="text-2xl shrink-0">{goal.emoji}</span>
                      <div>
                        <span className={`block font-bold text-sm ${selectedGoal === goal.id ? 'text-white dark:text-zinc-900' : 'text-zinc-800 dark:text-zinc-200'}`}>{goal.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedGoal === goal.id ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>{goal.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={!selectedShape || !selectedGoal || isSaving}
              className="w-full flex items-center justify-center gap-2 py-5 bg-black dark:bg-white text-white dark:text-zinc-900 font-extrabold tracking-[0.15em] text-[12px] uppercase rounded-[1.5rem] disabled:opacity-30 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
              ) : (
                <>시작하기 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
