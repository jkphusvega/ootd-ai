'use client';
import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Sparkles, RefreshCw, ExternalLink, Shirt, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import Link from 'next/link';
import WeatherDashboard from './WeatherDashboard';
import CurationDemoSheet from './CurationDemoSheet';
import type { CurationResult, FeedbackType } from '../../hooks/useMobileCuration';
import type { WeatherData } from '../../hooks/useWeather';

const OCCASIONS = [
  { id: 'daily',   label: '일상',     emoji: '☀️' },
  { id: 'work',    label: '출근',     emoji: '💼' },
  { id: 'date',    label: '데이트',   emoji: '🌹' },
  { id: 'outdoor', label: '야외활동', emoji: '🏃' },
  { id: 'formal',  label: '격식',     emoji: '✨' },
] as const;

type OccasionId = typeof OCCASIONS[number]['id'];

interface Props {
  weather: WeatherData | null;
  wardrobeCount: number;
  feedbackCount?: number;
  curation: CurationResult | null;
  isCurating: boolean;
  curationError: string | null;
  feedback: FeedbackType;
  isSavingFeedback: boolean;
  pastSimilarOutfits?: Array<{ image_url: string; title: string; style: string }>;
  generateCuration: (occasion?: string) => void;
  submitFeedback: (type: 'like' | 'dislike' | 'worn') => void;
}

const getSearchUrls = (name: string) => {
  const q = encodeURIComponent(name);
  return {
    musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
    cm29: `https://www.29cm.co.kr/search?query=${q}`,
  };
};

export default function MobileCurationTab({
  weather, wardrobeCount, feedbackCount = 0, curation, isCurating, curationError,
  feedback, isSavingFeedback, pastSimilarOutfits,
  generateCuration, submitFeedback,
}: Props) {
  const [occasion, setOccasion] = useState<OccasionId>('daily');

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const dragOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (feedback || isSavingFeedback) return;
    if (info.offset.x > 100) {
      submitFeedback('like');
    } else if (info.offset.x < -100) {
      submitFeedback('dislike');
      setTimeout(() => generateCuration(occasion), 300);
    }
  };

  return (
    <motion.div
      key="curation-tab"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col pt-32 pb-28 px-6 overflow-y-auto [&::-webkit-scrollbar]:hidden"
    >
      {weather && <WeatherDashboard weather={weather} />}

      <CurationDemoSheet />

      {/* 옷장 비어있음 */}
      {wardrobeCount === 0 && !isCurating && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-white/80 border border-zinc-200 rounded-3xl flex items-center justify-center shadow-md">
            <Shirt className="w-7 h-7 text-zinc-300" />
          </div>
          <div>
            <p className="text-base font-extrabold text-zinc-700 mb-1">옷장이 비어 있어요</p>
            <p className="text-xs text-zinc-400 leading-relaxed">옷을 등록하면 AI가 매일 코디를 골라드려요</p>
          </div>
          <Link href="/add-clothes">
            <button className="mt-2 px-6 py-3 bg-black text-white text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-lg active:scale-95 transition">
              옷 등록하러 가기
            </button>
          </Link>
        </div>
      )}

      {/* 추천 대기 */}
      {wardrobeCount > 0 && !curation && !isCurating && !curationError && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
          <div className="w-20 h-20 bg-white/80 border border-zinc-200 rounded-3xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-9 h-9 text-zinc-300" />
          </div>

          <div>
            <p className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mb-2">오늘 뭐 입지?</p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              옷장 <span className="font-bold text-zinc-600 dark:text-zinc-300">{wardrobeCount}개</span> + 오늘 날씨로<br />AI가 최적의 코디를 골라드려요
            </p>
          </div>

          {/* Occasion 선택 */}
          <div className="flex gap-2 flex-wrap justify-center">
            {OCCASIONS.map(oc => (
              <button
                key={oc.id}
                onClick={() => setOccasion(oc.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition active:scale-95 border ${
                  occasion === oc.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <span className="text-sm leading-none">{oc.emoji}</span>
                {oc.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => generateCuration(occasion)}
            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-zinc-900 text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-xl active:scale-95 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> AI 코디 추천받기
          </button>

          {/* 취향 학습 배지 */}
          {feedbackCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                취향 학습 중 · {feedbackCount}개 데이터
              </span>
            </motion.div>
          )}

          {/* 과거 비슷한 날씨 착장 */}
          {pastSimilarOutfits && pastSimilarOutfits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="w-full mt-4 text-left"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase">과거 비슷한 날씨의 코디</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -mx-6 px-6">
                {pastSimilarOutfits.map((outfit, idx) => (
                  <div key={idx} className="shrink-0 w-32 snap-center">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-2 shadow-sm border border-black/5 dark:border-white/5 relative">
                      <img src={outfit.image_url} alt={outfit.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate px-1">{outfit.title}</p>
                    <p className="text-[9px] text-zinc-400 truncate px-1 mt-0.5">{outfit.style}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 로딩 */}
      {isCurating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full" />
          <p className="text-sm font-bold text-zinc-500">AI 스타일리스트가 고민 중...</p>
          <p className="text-[10px] text-zinc-400">
            {OCCASIONS.find(o => o.id === occasion)?.emoji} {OCCASIONS.find(o => o.id === occasion)?.label} 룩 추천 중
          </p>
        </div>
      )}

      {/* 에러 */}
      {curationError && !isCurating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-3xl flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 mb-1">코디 추천에 실패했어요</p>
            <p className="text-xs text-zinc-400 leading-relaxed">잠시 후 다시 시도해주세요</p>
          </div>
          <button
            onClick={() => generateCuration(occasion)}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-extrabold tracking-widest uppercase rounded-2xl active:scale-95 transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
          </button>
        </div>
      )}

      {/* 큐레이션 결과 */}
      {curation && !isCurating && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ x, rotate, opacity: dragOpacity }}
          drag={!feedback ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className="flex flex-col gap-4 relative touch-none"
        >
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-10 left-6 z-50 border-4 border-emerald-500 text-emerald-500 font-black text-4xl tracking-widest px-4 py-2 rounded-2xl -rotate-12 pointer-events-none"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-10 right-6 z-50 border-4 border-red-500 text-red-500 font-black text-4xl tracking-widest px-4 py-2 rounded-2xl rotate-12 pointer-events-none"
          >
            NOPE
          </motion.div>

          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-md">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">{curation.title}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{curation.description}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">{curation.style}</span>
              <span className="text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">{curation.colorTone}</span>
              {feedbackCount > 0 && (
                <span className="text-[9px] font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                  취향 반영됨
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {curation.items.map((item, idx) => (
              <motion.div key={idx}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center p-3">
                  <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain"
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
                </div>
                <div className="p-3">
                  <span className="text-[8px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-0.5">{item.category}</span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-white line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 mt-1 mb-2">{item.reason}</p>
                  <div className="flex gap-1.5">
                    <a href={getSearchUrls(item.name).musinsa} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-900 rounded-md hover:bg-zinc-700 transition active:scale-95">
                      <ExternalLink className="w-2 h-2 text-white" />
                      <span className="text-[8px] font-bold text-white">무신사</span>
                    </a>
                    <a href={getSearchUrls(item.name).cm29} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 bg-[#ff3e5c] text-white rounded-md hover:bg-[#e63550] transition active:scale-95">
                      <ExternalLink className="w-2 h-2 text-white" />
                      <span className="text-[8px] font-bold">29CM</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 피드백 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex gap-3 mt-1"
          >
            {([
              { type: 'dislike', icon: <ThumbsDown className="w-4 h-4" />, label: '별로', activeLabel: '별로에요', activeClass: 'bg-red-500 text-white shadow-lg', hoverClass: 'hover:border-red-300 hover:text-red-500' },
              { type: 'like',    icon: <ThumbsUp   className="w-4 h-4" />, label: '좋아요', activeLabel: '좋아요!', activeClass: 'bg-emerald-500 text-white shadow-lg', hoverClass: 'hover:border-emerald-300 hover:text-emerald-500' },
            ] as const).map(({ type, icon, label, activeLabel, activeClass, hoverClass }) => (
              <button key={type}
                onClick={() => submitFeedback(type)}
                disabled={!!feedback || isSavingFeedback}
                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-extrabold tracking-widest uppercase flex items-center justify-center gap-2 transition active:scale-95 ${
                  feedback === type ? activeClass
                  : feedback ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                  : `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 ${hoverClass}`
                }`}
              >
                {icon}
                {feedback === type ? activeLabel : label}
              </button>
            ))}
          </motion.div>

          {/* 착용 확정 */}
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={() => submitFeedback('worn')}
            disabled={feedback === 'worn' || isSavingFeedback}
            className={`w-full py-4 rounded-2xl text-[11px] font-extrabold tracking-widest uppercase flex items-center justify-center gap-2 transition active:scale-95 ${
              feedback === 'worn' ? 'bg-black text-white shadow-xl' : 'bg-black/90 text-white hover:bg-black shadow-xl'
            }`}
          >
            {feedback === 'worn' ? <Check className="w-4 h-4" /> : <span>👕</span>}
            {feedback === 'worn' ? '오늘의 착장 기록 완료!' : '오늘 이 코디 입었어요'}
          </motion.button>

          <button
            onClick={() => generateCuration(occasion)}
            disabled={isCurating}
            className="w-full py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-sm active:scale-95 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 다른 코디 추천받기
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
