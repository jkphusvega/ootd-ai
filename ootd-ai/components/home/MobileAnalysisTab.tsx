'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanLine, RefreshCw, Bookmark, ImagePlus, Camera, TrendingUp, TrendingDown, CloudSun, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FashionCritique } from '../../hooks/useOotdAnalysis';

interface Props {
  scanState: 'idle' | 'scanning' | 'success' | 'error';
  setScanState: (s: 'idle' | 'scanning' | 'success' | 'error') => void;
  critique: FashionCritique | null;
  partialCritique: Partial<FashionCritique> | null;
  originalImage: string;
  hasCustomImage: boolean;
  base64Image: string | null;
  isStreaming: boolean;
  isRateLimited: boolean;
  isSaving: boolean;
  wardrobeCount: number;
  retryAnalysis: () => void;
  handleSaveToFeed: () => void;
  triggerCamera: () => void;
  triggerGallery: () => void;
  onSwitchToCuration: () => void;
}

const BREAKDOWN: { key: keyof Pick<FashionCritique, 'fit' | 'color' | 'styling' | 'weather'>; label: string }[] = [
  { key: 'fit',     label: '핏·실루엣' },
  { key: 'color',   label: '컬러 조합' },
  { key: 'styling', label: '스타일링' },
  { key: 'weather', label: '날씨 적합' },
];

function barColor(v: number | undefined) {
  if (v == null) return '#d4d4d8';
  if (v >= 80) return '#22c55e';
  if (v >= 60) return '#eab308';
  return '#ef4444';
}


function Skeleton({ w = 'full' }: { w?: string }) {
  return <div className={`h-3 w-${w} bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse`} />;
}


export default function MobileAnalysisTab({
  scanState, setScanState, critique, partialCritique,
  originalImage, hasCustomImage, base64Image, isStreaming, isRateLimited, isSaving, wardrobeCount,
  retryAnalysis, handleSaveToFeed, triggerCamera, triggerGallery, onSwitchToCuration,
}: Props) {
  const router = useRouter();
  const d = critique ?? partialCritique;
  const isFirstTime = wardrobeCount < 5;

  return (
    <motion.div key="analysis-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">

      {/* Idle Prompt */}
      <AnimatePresence>
        {scanState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-x-12 top-[22%] bottom-[32%] border-[2px] border-white/60 rounded-[3rem] pointer-events-none z-10 flex flex-col items-center justify-center gap-4 drop-shadow-md px-4">
            {hasCustomImage && base64Image ? (
              <button onClick={retryAnalysis}
                className="pointer-events-auto px-6 py-3 rounded-full bg-black text-white text-[11px] font-extrabold tracking-widest uppercase flex items-center gap-2 shadow-xl active:scale-95 transition">
                <RefreshCw className="w-4 h-4" /> 다시 분석하기
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                {isFirstTime ? (
                  <>
                    <div className="px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg pointer-events-none">
                      <Camera className="w-3.5 h-3.5" /> 오늘 착장을 찍어주세요
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200 shadow-sm pointer-events-none">
                      <p className="text-[10px] font-bold text-zinc-600 text-center leading-relaxed">
                        사진 한 장이면 AI가<br />
                        <span className="text-black font-extrabold">상의·하의·아우터</span>를 자동으로<br />
                        옷장에 등록해줘요
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 text-[10px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg pointer-events-none">
                    <ScanLine className="w-4 h-4" /> 오늘 착장을 촬영하세요
                  </div>
                )}
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
                className="absolute left-0 right-0 h-[1.5px] bg-black shadow-[0_0_12px_rgba(0,0,0,0.4)]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-full border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                <Sparkles className="w-4 h-4" /> 착장 분석 중...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result — Option A: 사진 + 스코어 오버레이 */}
      <AnimatePresence>
        {scanState === 'success' && d && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-40 bg-black flex flex-col">

            {/* ── 사진 + 점수 오버레이 ── */}
            <div className="relative flex-shrink-0 h-[46vh]">
              {originalImage && (
                <img src={originalImage} alt="OOTD" className="w-full h-full object-cover" />
              )}
              {/* 하단 그라데이션 */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* 총점 배지 — 우상단 */}
              <div className="absolute top-4 right-4 bg-black/55 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2.5 flex flex-col items-center min-w-[52px]">
                {d.score != null
                  ? <span className="text-3xl font-black text-white leading-none">{d.score}</span>
                  : <span className="text-3xl font-black text-white/30 leading-none animate-pulse">…</span>}
                <span className="text-[7px] font-bold text-white/50 uppercase tracking-widest mt-0.5">총점</span>
              </div>

              {/* 헤드라인 */}
              <div className="absolute bottom-4 left-4 right-[4.5rem]">
                {d.headline
                  ? <p className="text-white font-black text-[15px] leading-snug drop-shadow-lg">"{d.headline}"</p>
                  : isStreaming && <div className="h-4 bg-white/20 rounded-full animate-pulse w-3/4" />}
              </div>
            </div>

            {/* ── 디테일 시트 ── */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 rounded-t-[2rem] -mt-6 relative z-10 px-5 pt-5 pb-40 [&::-webkit-scrollbar]:hidden">
              <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

              {/* 카테고리 점수 배지 행 */}
              <div className="flex gap-2 mb-5">
                {BREAKDOWN.map(({ key, label }) => {
                  const val = d[key] as number | undefined;
                  return (
                    <div key={key} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-1.5 py-2.5 text-center">
                      <div className="text-[7px] text-zinc-400 font-bold mb-0.5">{label}</div>
                      {val != null
                        ? <div className="text-sm font-black leading-none" style={{ color: barColor(val) }}>{val}</div>
                        : <div className="text-sm font-black leading-none text-zinc-200 dark:text-zinc-700 animate-pulse">…</div>}
                    </div>
                  );
                })}
              </div>

              {/* 잘된 점 */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">잘된 점</span>
                </div>
                {d.strengths?.length
                  ? <ul className="flex flex-col gap-2.5">
                      {d.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5 shrink-0 text-sm">✓</span>
                          <span className="text-[12px] text-emerald-900 dark:text-emerald-200 font-medium leading-snug">{s}</span>
                        </li>
                      ))}
                    </ul>
                  : <div className="flex flex-col gap-2"><Skeleton /><Skeleton w="4/5" /></div>}
              </div>

              {/* 개선점 */}
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-widest text-amber-600 uppercase">개선점</span>
                </div>
                {d.improvements?.length
                  ? <ul className="flex flex-col gap-2.5">
                      {d.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5 shrink-0 text-sm">→</span>
                          <span className="text-[12px] text-amber-900 dark:text-amber-200 font-medium leading-snug">{s}</span>
                        </li>
                      ))}
                    </ul>
                  : <div className="flex flex-col gap-2"><Skeleton /><Skeleton w="4/5" /></div>}
              </div>

              {/* 스타일링 팁 */}
              <div className="bg-zinc-900 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px] font-extrabold tracking-widest text-white uppercase">Stylist Tips</span>
                </div>
                {d.tips?.length ? (
                  <ol className="flex flex-col gap-3">
                    {d.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-[10px] font-black text-yellow-300">{i + 1}</span>
                        <span className="text-[12px] text-zinc-200 font-medium leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[0, 1].map(i => <div key={i} className="h-3 bg-zinc-700 rounded-full animate-pulse" style={{ width: `${85 - i * 10}%` }} />)}
                  </div>
                )}
              </div>

              {/* 날씨 코멘트 */}
              {(d.weatherNote || isStreaming) && (
                <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900 mb-4">
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center shrink-0 mt-0.5">
                    <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold tracking-widest text-sky-400 uppercase block mb-0.5">날씨 적합성</span>
                    {d.weatherNote
                      ? <p className="text-[12px] text-sky-800 dark:text-sky-200 font-medium leading-relaxed">{d.weatherNote}</p>
                      : <Skeleton w="full" />}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {critique && !isStreaming && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      if (!base64Image) return;
                      try {
                        // 폰 사진은 base64로 10MB+이므로 sessionStorage(5MB 한도) 저장 전 1024px로 압축
                        const img = new Image();
                        await new Promise<void>(r => { img.onload = () => r(); img.src = base64Image; });
                        const MAX = 1024;
                        let w = img.width, h = img.height;
                        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                        const compressed = canvas.toDataURL('image/jpeg', 0.85);
                        sessionStorage.setItem('ootd_transfer_image', compressed);
                        sessionStorage.setItem('ootd_auto_start', 'true');
                      } catch {
                        // 압축 실패 시에도 페이지 이동 (add-clothes에서 수동 업로드 가능)
                      }
                      router.push('/add-clothes');
                    }}
                    className="w-full py-4 bg-black text-white font-extrabold tracking-widest text-[11px] uppercase rounded-2xl active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 옷장에 자동 등록하기
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setScanState('idle')}
                      className="py-3.5 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[10px] uppercase rounded-xl active:scale-95 transition">
                      다시 분석
                    </button>
                    <button onClick={onSwitchToCuration}
                      className="py-3.5 bg-purple-50 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[10px] uppercase rounded-xl active:scale-95 transition flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> 코디 추천
                    </button>
                    <button onClick={handleSaveToFeed} disabled={isSaving}
                      className="py-3.5 bg-zinc-100 border border-zinc-200 text-zinc-700 font-extrabold tracking-tighter text-[10px] uppercase rounded-xl active:scale-95 transition flex items-center justify-center gap-0.5 disabled:opacity-50">
                      <Bookmark className="w-3 h-3" /> {isSaving ? '저장 중' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Nudge — Bottom Dock 위 */}
      <AnimatePresence>
        {scanState === 'idle' && isFirstTime && wardrobeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-[calc(6rem+72px+16px)] left-6 right-6 z-40 pointer-events-none"
          >
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">AI 코디 오픈까지</span>
                <span className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200">{wardrobeCount} / 5</span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-black dark:bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(wardrobeCount / 5) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
              <p className="text-[9px] text-zinc-400 mt-1.5 text-center">
                {5 - wardrobeCount}개 더 찍으면 코디 추천이 시작돼요 ✨
              </p>
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
                className="w-14 h-14 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-black/10 rounded-full flex items-center justify-center shadow-xl hover:bg-white transition active:scale-95 disabled:opacity-40">
                <ImagePlus className="w-6 h-6 text-zinc-700" strokeWidth={1.5} />
              </button>
              <div className={`relative flex items-center justify-center ${isRateLimited ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={!isRateLimited ? triggerCamera : undefined}>
                <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                  <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                  <motion.circle cx="48" cy="48" r="45" fill="none" stroke="#000000" strokeWidth="4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }}
                    transition={{ duration: 2.8, ease: 'linear' }} />
                </svg>
                <div className="w-[72px] h-[72px] bg-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-black/10 hover:scale-105 active:scale-95 transition-transform">
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
