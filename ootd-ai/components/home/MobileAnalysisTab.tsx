'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanLine, RefreshCw, Bookmark, Star, ChevronRight, ImagePlus, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FashionCritique } from '../../hooks/useOotdAnalysis';

interface Props {
  scanState: 'idle' | 'scanning' | 'success' | 'error';
  setScanState: (s: 'idle' | 'scanning' | 'success' | 'error') => void;
  critique: FashionCritique | null;
  partialCritique: Partial<FashionCritique> | null;
  hasCustomImage: boolean;
  base64Image: string | null;
  isStreaming: boolean;
  isRateLimited: boolean;
  retryAnalysis: () => void;
  handleSaveToFeed: () => void;
  triggerCamera: () => void;
  triggerGallery: () => void;
  onSwitchToCuration: () => void;
}

export default function MobileAnalysisTab({
  scanState, setScanState, critique, partialCritique,
  hasCustomImage, base64Image, isStreaming, isRateLimited,
  retryAnalysis, handleSaveToFeed, triggerCamera, triggerGallery, onSwitchToCuration,
}: Props) {
  const router = useRouter();
  const d = critique ?? partialCritique;

  return (
    <motion.div key="analysis-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">

      {/* Idle Prompt */}
      <AnimatePresence>
        {scanState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-x-12 top-[25%] bottom-[30%] border-[2px] border-white/60 rounded-[3rem] pointer-events-none z-10 flex flex-col items-center justify-center gap-3 drop-shadow-md">
            {hasCustomImage && base64Image ? (
              <button onClick={retryAnalysis}
                className="pointer-events-auto px-6 py-3 rounded-full bg-black text-white text-[11px] font-extrabold tracking-widest uppercase flex items-center gap-2 shadow-xl active:scale-95 transition">
                <RefreshCw className="w-4 h-4" /> 다시 분석하기
              </button>
            ) : (
              <div className="px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 text-[10px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg">
                <ScanLine className="w-4 h-4" /> 카메라 버튼을 눌러 OOTD를 촬영하세요
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {scanState === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none">
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute inset-0 bg-white" />
            <div className="absolute left-6 right-6 top-[15%] bottom-[15%] overflow-hidden">
              <motion.div
                initial={{ y: 0 }} animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ willChange: 'transform' }}
                className="absolute left-0 right-0 h-[1.5px] bg-black shadow-[0_0_12px_rgba(0,0,0,0.4)]"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-8 bg-black/8 blur-[12px] rounded-full" />
              </motion.div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-full border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                <Sparkles className="w-4 h-4" /> 에디터 모델 분석 중...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Bottom Sheet */}
      <AnimatePresence>
        {scanState === 'success' && d && (
          <motion.div key="success" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col h-[68vh]">
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 shrink-0" />
            <div className="flex-1 overflow-y-auto px-6 pt-5 pb-24 [&::-webkit-scrollbar]:hidden">

              <div className="flex items-start gap-5 mb-6">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-100 dark:text-zinc-800" />
                    <motion.circle cx="48" cy="48" r="42" fill="none"
                      stroke={d.score != null ? (d.score >= 80 ? '#22c55e' : d.score >= 60 ? '#eab308' : '#ef4444') : '#18181b'}
                      strokeWidth="5" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: (d.score ?? 0) / 100 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }} />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black leading-none tracking-tight">{d.score ?? '—'}</span>
                    <span className="text-[7px] font-bold text-zinc-400/70 tracking-[0.2em] uppercase mt-0.5">SCORE</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400/60 uppercase block mb-1.5">AI Stylist Verdict</span>
                  {d.headline
                    ? <h2 className="text-xl font-black tracking-tight text-black dark:text-white leading-snug break-keep">"{d.headline}"</h2>
                    : <div className="flex flex-col gap-2">
                        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                        <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                      </div>
                  }
                </div>
              </div>

              <div className="p-5 bg-black rounded-2xl flex flex-col gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Tips</span>
                </div>
                {d.tips?.length ? (
                  <ol className="flex flex-col gap-3">
                    {d.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60">{i + 1}</span>
                        <span className="text-[13px] text-white/90 font-medium leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map(i => <div key={i} className="h-3 bg-zinc-700 rounded-full animate-pulse" style={{ width: `${85 - i * 10}%` }} />)}
                  </div>
                )}
              </div>

              {critique && !isStreaming && (
                <div className="flex flex-col gap-2">
                  <button onClick={handleSaveToFeed}
                    className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[11px] uppercase rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setScanState('idle')}
                      className="py-3.5 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[10px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">
                      다시 분석
                    </button>
                    <button onClick={onSwitchToCuration}
                      className="py-3.5 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[10px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> 코디 추천
                    </button>
                    <button onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); router.push('/add-clothes'); } }}
                      className="py-3.5 bg-black text-white font-extrabold tracking-tighter text-[10px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5">
                      AI 추출 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Dock */}
      <AnimatePresence>
        {scanState !== 'success' && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#F9F9F9] dark:from-[#0c0c0f] via-[#F9F9F9]/80 dark:via-[#0c0c0f]/80 to-transparent z-30 pointer-events-none" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-0 right-0 px-10 flex items-center justify-center gap-6 z-40">
              <button onClick={!isRateLimited ? triggerGallery : undefined} disabled={isRateLimited}
                className="w-14 h-14 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full flex items-center justify-center shadow-xl hover:bg-white dark:hover:bg-zinc-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                <ImagePlus className="w-6 h-6 text-zinc-700" strokeWidth={1.5} />
              </button>
              <div className={`relative flex items-center justify-center ${isRateLimited ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={!isRateLimited ? triggerCamera : undefined}>
                <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                  <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                  <motion.circle cx="48" cy="48" r="45" fill="none" stroke="#000000" strokeWidth="4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }}
                    transition={{ duration: 2.8, ease: 'linear' }} strokeDasharray="283" />
                </svg>
                <div className="w-[72px] h-[72px] bg-black rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-black/10 transition-all hover:scale-105 active:scale-95">
                  <Camera className="w-8 h-8 text-white opacity-90" strokeWidth={1.5} />
                </div>
              </div>
              <div className="w-14 h-14" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
