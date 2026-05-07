'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ImagePlus, RefreshCw, Star, Bookmark, ChevronRight, Sun, Cloud, CloudRain, CloudSnow, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FashionCritique } from '../../hooks/useOotdAnalysis';

interface WeatherInfo { temperature: number; condition: string; }
interface UserProfile { nickname?: string; [key: string]: unknown; }

interface Props {
  weather: WeatherInfo | null;
  userProfile: UserProfile | null;
  greeting: string;
  scanState: 'idle' | 'scanning' | 'success' | 'error';
  critique: FashionCritique | null;
  partialCritique: Partial<FashionCritique> | null;
  originalImage: string;
  hasCustomImage: boolean;
  base64Image: string | null;
  isStreaming: boolean;
  isRateLimited: boolean;
  isDragging: boolean;
  wardrobeCount: number;
  setScanState: (s: 'idle' | 'scanning' | 'success' | 'error') => void;
  retryAnalysis: () => void;
  handleSaveToFeed: () => void;
  resetAnalysis: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  triggerDesktopUpload: () => void;
  onLogout: () => void;
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === 'Rain') return <CloudRain className="w-5 h-5" />;
  if (condition === 'Snow') return <CloudSnow className="w-5 h-5" />;
  if (condition === 'Cloudy') return <Cloud className="w-5 h-5" />;
  return <Sun className="w-5 h-5" />;
}

export default function DesktopLayout({
  weather, userProfile, greeting, scanState, critique, partialCritique,
  originalImage, hasCustomImage, base64Image, isStreaming, isRateLimited, isDragging,
  wardrobeCount, setScanState, retryAnalysis, handleSaveToFeed, resetAnalysis,
  handleDragOver, handleDragLeave, handleDrop, triggerDesktopUpload, onLogout,
}: Props) {
  const router = useRouter();
  const d = critique ?? partialCritique;

  const Sk = ({ w = 'full' }: { w?: string }) => (
    <div className={`h-3 w-${w} bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse`} />
  );

  return (
    <div className="hidden lg:block">
      <div className="max-w-6xl mx-auto px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{greeting}</h1>
              <button onClick={onLogout} className="text-xs px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full font-bold transition flex items-center gap-1">
                <LogOut className="w-3 h-3" /> 로그아웃
              </button>
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">오늘의 OOTD를 업로드하고 AI 스타일리스트의 리뷰를 받아보세요</p>
          </div>
          {weather && (
            <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <WeatherIcon condition={weather.condition} />
              <div>
                <span className="text-xl font-extrabold text-zinc-900 dark:text-white">{weather.temperature}°C</span>
                <span className="text-xs text-zinc-400 ml-2 font-semibold">{weather.condition}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 items-start">
          {/* Upload Area */}
          <div className="flex flex-col gap-5">
            <div
              onDragOver={!isRateLimited ? handleDragOver : undefined}
              onDragLeave={!isRateLimited ? handleDragLeave : undefined}
              onDrop={!isRateLimited ? handleDrop : undefined}
              onClick={!isRateLimited ? triggerDesktopUpload : undefined}
              className={`relative aspect-[3/4] w-full rounded-3xl overflow-hidden transition-all duration-300 border-2 ${isRateLimited ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'} ${
                isDragging ? 'border-zinc-900 bg-zinc-50 scale-[1.01] shadow-[0_0_40px_rgba(0,0,0,0.08)]'
                : hasCustomImage ? 'border-zinc-200 shadow-xl'
                : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-400 hover:bg-zinc-100/50'
              }`}
            >
              {hasCustomImage ? (
                <>
                  <img src={originalImage} alt="Uploaded OOTD" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-center text-xs font-bold text-zinc-700 shadow">
                      클릭하여 새 사진 업로드
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isDragging ? 'bg-zinc-900 scale-110' : 'bg-zinc-200 group-hover:bg-zinc-300'}`}>
                    <ImagePlus className={`w-9 h-9 transition-colors ${isDragging ? 'text-white' : 'text-zinc-500'}`} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-600 mb-1">{isDragging ? '여기에 놓으세요!' : '사진을 드래그하거나 클릭하세요'}</p>
                    <p className="text-xs text-zinc-400">오늘의 OOTD 전신 사진을 올려주세요</p>
                    <p className="text-[10px] text-zinc-300 mt-1">사진은 AI 분석에만 사용되며 서버에 저장되지 않습니다</p>
                  </div>
                </div>
              )}
              {scanState === 'scanning' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                    <Sparkles className="w-4 h-4 animate-pulse" /> AI 스타일리스트 분석 중...
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-5">
            <AnimatePresence mode="wait">
              {scanState === 'idle' && !critique && (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-5">
                    <Sparkles className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  {isRateLimited ? (
                    <>
                      <h3 className="text-lg font-bold text-red-400 mb-2">오늘 분석 한도를 채웠어요</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">내일 다시 이용할 수 있어요</p>
                    </>
                  ) : hasCustomImage && base64Image ? (
                    <>
                      <h3 className="text-lg font-bold text-zinc-400 mb-2">분석 준비 완료</h3>
                      <p className="text-sm text-zinc-300 dark:text-zinc-600 leading-relaxed mb-6">이미지가 업로드됐어요<br />아래에서 다시 분석하거나 새 사진을 올릴 수 있어요</p>
                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <button onClick={retryAnalysis} className="px-5 py-3 bg-black text-white text-[11px] font-extrabold tracking-widest uppercase rounded-xl hover:bg-zinc-800 transition active:scale-95 flex items-center justify-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5" /> 다시 분석하기
                        </button>
                        <button onClick={resetAnalysis} className="px-5 py-2 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded-xl hover:bg-zinc-200 transition active:scale-95">
                          새 사진 올리기
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-zinc-400 mb-2">AI 리뷰 대기 중</h3>
                      <p className="text-sm text-zinc-300 dark:text-zinc-600 leading-relaxed mb-6">왼쪽에 OOTD 사진을 업로드하면<br />AI 스타일리스트가 분석을 시작합니다</p>
                    </>
                  )}
                  {wardrobeCount === 0 && !isRateLimited && (
                    <div className="mt-2 px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3">옷장이 비어 있어요<br />AI 코디 추천을 받으려면 먼저 옷을 등록해야 해요</p>
                      <Link href="/add-clothes">
                        <button className="px-5 py-2 bg-black text-white text-[10px] font-extrabold tracking-widest uppercase rounded-xl hover:bg-zinc-800 transition active:scale-95">
                          옷 등록하러 가기
                        </button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {scanState === 'scanning' && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full mb-5" />
                  <p className="text-sm font-bold text-zinc-500 tracking-wide">Gemini AI가 분석하고 있어요...</p>
                </motion.div>
              )}

              {d && (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }} className="flex flex-col gap-4">
                  <div className="flex items-start gap-6 p-7 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-3xl border border-zinc-100 dark:border-zinc-800/60 backdrop-blur-sm">
                    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
                        <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-100 dark:text-zinc-800" />
                        <motion.circle cx="56" cy="56" r="48" fill="none"
                          stroke={d.score != null ? (d.score >= 80 ? '#22c55e' : d.score >= 60 ? '#eab308' : '#ef4444') : '#18181b'}
                          strokeWidth="5" strokeLinecap="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: (d.score ?? 0) / 100 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }} />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-black leading-none tracking-tight">{d.score ?? '—'}</span>
                        <span className="text-[8px] font-bold text-zinc-400/70 tracking-[0.2em] uppercase mt-0.5">SCORE</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400/60 uppercase block mb-2">AI Stylist Verdict</span>
                      {d.headline
                        ? <h2 className="text-2xl font-black tracking-tight text-black dark:text-white leading-snug break-keep">"{d.headline}"</h2>
                        : <div className="flex flex-col gap-2"><Sk /><Sk w="3/4" /></div>}
                    </div>
                  </div>

                  <div className="p-5 bg-black rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Tips</span>
                    </div>
                    {d.tips?.length ? (
                      <ol className="flex flex-col gap-2.5">
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
                    <div className="flex flex-col gap-2.5 mt-1">
                      <button onClick={handleSaveToFeed} className="w-full py-3.5 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[11px] uppercase rounded-2xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-stone-800">
                        <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                      </button>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { setScanState('idle'); resetAnalysis(); }}
                          className="py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-zinc-50">
                          다시 분석
                        </button>
                        <Link href="/curation" className="block">
                          <button className="w-full h-full py-3 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-purple-200 flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                          </button>
                        </Link>
                        <button onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); router.push('/add-clothes'); } }}
                          className="py-3 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5 hover:bg-zinc-800">
                          AI 추출 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
