'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ImagePlus, RefreshCw, Bookmark, ChevronRight, Sun, Cloud, CloudRain, CloudSnow, LogOut, TrendingUp, TrendingDown, CloudSun, Star, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FashionCritique } from '../../hooks/useOotdAnalysis';
import type { WeatherData } from '../../hooks/useWeather';
import DesktopWeatherDashboard from './DesktopWeatherDashboard';
interface UserProfile { nickname?: string; [key: string]: unknown; }

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export interface AnalysisState {
  scanState: ScanState;
  critique: FashionCritique | null;
  partialCritique: Partial<FashionCritique> | null;
  originalImage: string;
  hasCustomImage: boolean;
  base64Image: string | null;
  isStreaming: boolean;
  isRateLimited: boolean;
  isDragging: boolean;
  setScanState: (s: ScanState) => void;
  retryAnalysis: () => void;
  handleSaveToFeed: () => void;
  resetAnalysis: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  triggerDesktopUpload: () => void;
}

interface Props {
  weather: WeatherData | null;
  userProfile: UserProfile | null;
  greeting: string;
  wardrobeCount: number;
  analysis: AnalysisState;
  onLogout: () => void;
  showNudge: boolean;
  onCloseNudge: () => void;
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === 'Rain') return <CloudRain className="w-5 h-5" />;
  if (condition === 'Snow') return <CloudSnow className="w-5 h-5" />;
  if (condition === 'Cloudy') return <Cloud className="w-5 h-5" />;
  return <Sun className="w-5 h-5" />;
}

export default function DesktopLayout({
  weather, userProfile, greeting, wardrobeCount, analysis, onLogout,
  showNudge, onCloseNudge,
}: Props) {
  const router = useRouter();
  const {
    scanState, critique, partialCritique, originalImage, hasCustomImage,
    base64Image, isStreaming, isRateLimited, isDragging,
    setScanState, retryAnalysis, handleSaveToFeed, resetAnalysis,
    handleDragOver, handleDragLeave, handleDrop, triggerDesktopUpload,
  } = analysis;
  const d = critique ?? partialCritique;

  const Sk = ({ w = 'full' }: { w?: string }) => (
    <div className={`h-3 w-${w} bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse`} />
  );

  return (
    <div className="hidden lg:block min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-12 pb-24">

        {/* 상단바 (Header Top Bar) */}
        <header className="flex items-center justify-between p-6 mb-10 bg-zinc-50/40 dark:bg-zinc-950/20 backdrop-blur-md rounded-3xl border border-zinc-200/50 dark:border-zinc-800/40">
          <div>
            <div className="flex items-center gap-3.5 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                {greeting}
              </h1>
              <button 
                onClick={onLogout} 
                className="p-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full transition-all border border-zinc-200/60 dark:border-zinc-800/60 active:scale-95 shadow-sm" 
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold">
              {wardrobeCount < 5
                ? '오늘 입은 착장을 찍으면 AI가 옷장을 자동으로 만들어드려요'
                : '오늘의 착장을 찍거나, AI 코디 추천을 받아보세요'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {weather && 'hourly' in weather ? (
              <DesktopWeatherDashboard weather={weather} />
            ) : weather ? (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm">
                <WeatherIcon condition={(weather as any).condition} />
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">{(weather as any).temperature}°C</span>
              </div>
            ) : null}
          </div>
        </header>

        {/* 데스크탑 넛지 배너 */}
        <AnimatePresence>
          {showNudge && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 rounded-3xl shadow-md flex items-center justify-between gap-4 text-xs font-bold border border-white/5 dark:border-black/5"
            >
              <Link href="/settings" className="flex items-center gap-2.5">
                <span className="text-base">📏</span>
                <span>체형과 스타일 목표를 입력하면 AI 스타일리스트가 내 신체 조건에 최적화된 핏과 코디를 추천해 줍니다.</span>
              </Link>
              <button 
                onClick={onCloseNudge}
                className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors text-zinc-400 dark:text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <p className="text-xs text-zinc-400">
                      {wardrobeCount < 5 ? 'AI가 상의·하의·아우터를 자동으로 옷장에 등록해줘요' : '오늘의 착장 전신 사진을 올려주세요'}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg inline-block">
                      🔒 사진은 AI 분석에만 사용되며 서버에 저장되지 않습니다
                    </p>
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
                    wardrobeCount < 5 ? (
                      /* 신규 유저: 옷장 구축 안내가 메인 */
                      <div className="flex flex-col items-center gap-5">
                        <div className="w-full max-w-[340px] p-6 bg-black rounded-3xl text-white text-center">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-base font-extrabold mb-2 tracking-tight">착장 사진 → 옷장 자동 완성</h3>
                          <p className="text-xs text-white/60 leading-relaxed mb-4">
                            오늘 입은 착장을 찍으면<br />
                            AI가 상의·하의·아우터를 분류해<br />
                            옷장에 자동으로 등록해줘요
                          </p>
                          <p className="text-[11px] font-bold text-white/40">← 왼쪽에 사진을 올려주세요</p>
                        </div>
                        <div className="w-full max-w-[340px] p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-xl flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                              <p className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 mb-0.5">AI 코디 추천까지</p>
                              <p className="text-[11px] text-zinc-400">
                                {wardrobeCount > 0
                                  ? `${5 - wardrobeCount}개 더 찍으면 코디 추천이 시작돼요 ✨`
                                  : '아이템 5개 이상부터 날씨·TPO 기반 추천이 시작돼요'}
                              </p>
                            </div>
                          </div>
                          {wardrobeCount > 0 && (
                            <>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-zinc-400">{wardrobeCount} / 5</span>
                                <span className="text-[10px] font-bold text-zinc-400">{Math.round((wardrobeCount / 5) * 100)}%</span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-black dark:bg-white rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(wardrobeCount / 5) * 100}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* 기존 유저: 큐레이션 카드 강조 */
                      <>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">착장을 찍거나 코디를 추천받으세요</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">왼쪽에 오늘 착장 사진을 올리거나<br />AI 코디 추천을 받아보세요</p>
                        <div className="w-full max-w-[340px] mt-2 p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-left flex items-start gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer shadow-sm group" onClick={() => router.push('/curation')}>
                          <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white mb-1">오늘의 코디 추천받기</h4>
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">내 옷장 {wardrobeCount}개 아이템으로 완벽한 코디 제안</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 self-center group-hover:translate-x-1 transition-transform" />
                        </div>
                      </>
                    )
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

                  {/* 점수 + 헤드라인 */}
                  <div className="flex items-center gap-5 p-6 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-3xl border border-zinc-100 dark:border-zinc-800/60">
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
                        <span className="text-3xl font-black leading-none">{d.score ?? '—'}</span>
                        <span className="text-[7px] font-bold text-zinc-400 tracking-widest uppercase mt-0.5">SCORE</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400 uppercase block mb-1.5">AI Stylist Verdict</span>
                      {d.headline
                        ? <h2 className="text-xl font-black tracking-tight text-black dark:text-white leading-snug break-keep">"{d.headline}"</h2>
                        : <div className="flex flex-col gap-2"><Sk /><Sk w="3/4" /></div>}
                    </div>
                  </div>

                  {/* 세부 점수 */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                    <span className="text-[9px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-3">Score Breakdown</span>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {([
                        { key: 'fit' as const,     label: '핏·실루엣' },
                        { key: 'color' as const,   label: '컬러 조합' },
                        { key: 'styling' as const, label: '스타일링' },
                        { key: 'weather' as const, label: '날씨 적합' },
                      ]).map(({ key, label }, i) => {
                        const val = d[key] as number | undefined;
                        const c = val == null ? '#d4d4d8' : val >= 80 ? '#22c55e' : val >= 60 ? '#eab308' : '#ef4444';
                        return (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[11px] font-bold text-zinc-500">{label}</span>
                              <span className="text-[11px] font-extrabold" style={{ color: c }}>{val ?? '—'}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: c }}
                                initial={{ width: 0 }} animate={{ width: val != null ? `${val}%` : '0%' }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.08 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 잘된 점 + 개선점 */}
                  <div className="flex flex-col gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[9px] font-extrabold tracking-widest text-emerald-600 uppercase">잘된 점</span>
                      </div>
                      {d.strengths?.length
                        ? <ul className="flex flex-col gap-2.5">{d.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5 shrink-0 text-sm">✓</span>
                              <span className="text-[12px] text-emerald-900 dark:text-emerald-200 font-medium leading-snug">{s}</span>
                            </li>
                          ))}</ul>
                        : <div className="flex flex-col gap-2"><Sk /><Sk w="4/5" /></div>}
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                          <TrendingDown className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[9px] font-extrabold tracking-widest text-amber-600 uppercase">개선점</span>
                      </div>
                      {d.improvements?.length
                        ? <ul className="flex flex-col gap-2.5">{d.improvements.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5 shrink-0 text-sm">→</span>
                              <span className="text-[12px] text-amber-900 dark:text-amber-200 font-medium leading-snug">{s}</span>
                            </li>
                          ))}</ul>
                        : <div className="flex flex-col gap-2"><Sk /><Sk w="4/5" /></div>}
                    </div>
                  </div>

                  {/* 스타일링 팁 */}
                  <div className="p-5 bg-black rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Tips</span>
                    </div>
                    {d.tips?.length ? (
                      <ol className="flex flex-col gap-2.5">
                        {d.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-[10px] font-black text-yellow-300">{i + 1}</span>
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

                  {/* 날씨 코멘트 */}
                  {(d.weatherNote || isStreaming) && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900">
                      <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center shrink-0 mt-0.5">
                        <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold tracking-widest text-sky-400 uppercase block mb-0.5">날씨 적합성</span>
                        {d.weatherNote
                          ? <p className="text-[12px] text-sky-800 dark:text-sky-200 font-medium leading-relaxed">{d.weatherNote}</p>
                          : <Sk />}
                      </div>
                    </div>
                  )}

                  {critique && !isStreaming && (
                    <div className="flex flex-col gap-2.5 mt-1">
                      {/* 메인 CTA: 옷장 등록 */}
                      <button
                        onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); router.push('/add-clothes'); } }}
                        className="w-full py-3.5 bg-black text-white font-extrabold tracking-widest text-[11px] uppercase rounded-2xl active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-zinc-800"
                      >
                        <Plus className="w-4 h-4" /> 옷장에 자동 등록하기
                      </button>
                      {/* 보조 액션 */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { setScanState('idle'); resetAnalysis(); }}
                          className="py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl active:scale-95 transition hover:bg-zinc-50">
                          다시 분석
                        </button>
                        <Link href="/curation" className="block">
                          <button className="w-full h-full py-3 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl active:scale-95 transition hover:bg-purple-200 flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                          </button>
                        </Link>
                        <button onClick={handleSaveToFeed}
                          className="py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl active:scale-95 transition flex items-center justify-center gap-1 hover:bg-zinc-200">
                          <Bookmark className="w-3.5 h-3.5" /> 저장
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
