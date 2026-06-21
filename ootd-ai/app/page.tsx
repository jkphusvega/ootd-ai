'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Settings, Shirt, X, User } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '../lib/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useWeather } from '../hooks/useWeather';
import { useToast } from '../components/ToastProvider';
import { useOotdAnalysis } from '../hooks/useOotdAnalysis';
import { useMobileCuration } from '../hooks/useMobileCuration';
import LandingContent from '../components/LandingContent';
import SplashScreen from '../components/home/SplashScreen';

const DesktopLayout = dynamic(() => import('../components/home/DesktopLayout'), { ssr: false });
const MobileCurationTab = dynamic(() => import('../components/home/MobileCurationTab'), { ssr: false });
const MobileAnalysisTab = dynamic(() => import('../components/home/MobileAnalysisTab'), { ssr: false });

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const weather = useWeather();
  const { toast } = useToast();
  const [showSplash, setShowSplash] = useState(false);
  const [mobileTab, setMobileTab] = useState<'curation' | 'analysis'>('analysis');
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ nickname?: string; profile_image?: string; body_goal?: string; [key: string]: unknown } | null>(null);
  const [nudgeClosed, setNudgeClosed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('ootd_nudge_closed') === 'true') {
      setNudgeClosed(true);
    }
  }, []);

  const isForceMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('force') === 'true';
  }, []);

  const showNudge = (user && userProfile && userProfile.body_goal === 'none' && !nudgeClosed) || isForceMode;

  const handleCloseNudge = () => {
    setNudgeClosed(true);
    localStorage.setItem('ootd_nudge_closed', 'true');
  };

  const analysis = useOotdAnalysis({ user, weather, userProfile, supabase, toast });
  const curation = useMobileCuration({ user, weather, supabase });

  // Splash screen (once per session)
  useEffect(() => {
    if (!sessionStorage.getItem('ootd_splashed')) {
      setShowSplash(true);
      const t = setTimeout(() => { setShowSplash(false); sessionStorage.setItem('ootd_splashed', 'true'); }, 2600);
      return () => clearTimeout(t);
    }
  }, []);

  // Weather notification (Phase 2-2)
  useEffect(() => {
    if (user && weather && 'weatherTip' in weather && weather.weatherTip && !sessionStorage.getItem('ootd_weather_notified')) {
      toast(`☁️ 오늘의 날씨 코디 팁\n${weather.weatherTip}`, 'info');
      sessionStorage.setItem('ootd_weather_notified', 'true');
    }
  }, [user, weather, toast]);

  // Fetch user profile, redirect to onboarding if missing
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') { console.error('[profile]', error.message); return; }
        if (data) setUserProfile(data); else router.push('/onboarding');
      } catch (e) { console.error('[profile]', e); }
    })();
  }, [user, authLoading, router, supabase]);

  // 옷장 데이터 기반 초기 탭 설정: 아이템 5개 이상이면 큐레이션이 기본
  useEffect(() => {
    if (!initialTabSet && curation.wardrobeCount !== undefined) {
      setMobileTab(curation.wardrobeCount >= 5 ? 'curation' : 'analysis');
      setInitialTabSet(true);
    }
  }, [curation.wardrobeCount, initialTabSet]);

  const getGreeting = () => {
    const h = new Date().getHours();
    const name = userProfile?.nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    const n = name ? ` ${name}님` : '';
    if (h < 6) return `늦은 밤이네요${n} 🌙`;
    if (h < 12) return `좋은 아침이에요${n} ☀️`;
    if (h < 18) return `좋은 오후에요${n} 🌤`;
    return `좋은 저녁이에요${n} 🌆`;
  };


  if (!authLoading && !user && !showSplash) return <LandingContent />;
  if (authLoading || showSplash) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0c0c0f] flex flex-col items-center justify-center gap-4">
        <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
        {!showSplash && <><div className="w-16 h-16 rounded-2xl bg-zinc-100 animate-pulse" /><div className="w-32 h-3 bg-zinc-100 rounded-full animate-pulse" /></>}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0c0c0f] font-sans selection:bg-zinc-200">
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={analysis.fileInputRef} onChange={analysis.handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={analysis.galleryInputRef} onChange={analysis.handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={analysis.desktopFileInputRef} onChange={analysis.handleFileChange} />

      {/* Desktop */}
      <DesktopLayout
        weather={weather} userProfile={userProfile} greeting={getGreeting()}
        wardrobeCount={curation.wardrobeCount}
        analysis={analysis}
        onLogout={() => {}}
        showNudge={showNudge}
        onCloseNudge={handleCloseNudge}
      />

      {/* Mobile */}
      <div className="lg:hidden relative h-screen w-full overflow-hidden bg-[#F9F9F9] dark:bg-[#0c0c0f]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#F2F2F7_100%)] dark:bg-none dark:bg-[#0c0c0f]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        {/* Floating Nudge Banner */}
        <AnimatePresence>
          {showNudge && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-28 left-6 right-6 z-20 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-[10px] font-bold border border-white/10 dark:border-black/5 backdrop-blur-md"
            >
              <Link href="/settings" className="flex-1 flex items-center gap-2">
                <span className="text-xs">📏</span>
                <span>체형과 스타일 목표를 입력하면 AI 코디가 내 핏에 딱 맞춰서 큐레이션해 줘요!</span>
              </Link>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseNudge();
                }}
                className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors shrink-0 text-zinc-400 dark:text-zinc-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top HUD */}
        <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-20">
          {/* 프로필 이미지 또는 기본 사용자 아이콘 */}
          <Link href="/settings" className="w-10 h-10 rounded-full overflow-hidden shadow-xl shrink-0 border border-zinc-200/50 dark:border-zinc-800/50 block bg-zinc-50 dark:bg-zinc-900">
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture || userProfile?.profile_image ? (
              <img 
                src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || userProfile?.profile_image} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                <User className="w-5 h-5" />
              </div>
            )}
          </Link>

          <div className="flex p-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-xl">
            {(['curation', 'analysis'] as const).map(tab => (
              <button key={tab} onClick={() => setMobileTab(tab)}
                className="relative flex-1 px-4 py-2 text-[10px] font-black tracking-widest uppercase rounded-full text-center">
                {mobileTab === tab && (
                  <motion.div layoutId="mobileTabIndicator"
                    className="absolute inset-0 bg-black rounded-full shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className={`relative z-10 ${mobileTab === tab ? 'text-white' : 'text-zinc-500'}`}>
                  {tab === 'curation' ? 'AI 코디' : 'OOTD 분석'}
                </span>
              </button>
            ))}
          </div>

          {/* 햄버거 메뉴 */}
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-700 shadow-xl hover:bg-white/80 transition shrink-0">
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </header>

        {/* 드롭다운 메뉴 */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute top-24 right-6 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden min-w-[160px]"
              >
                <Link href="/wardrobe" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  <Shirt className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">내 옷장</span>
                </Link>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-3" />
                <Link href="/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  <Settings className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">설정</span>
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mobileTab === 'curation' && (
            <MobileCurationTab
              weather={weather} wardrobeCount={curation.wardrobeCount}
              curation={curation.curation} isCurating={curation.isCurating}
              curationError={curation.curationError} generateCuration={curation.generateCuration}
              feedback={curation.feedback} isSavingFeedback={curation.isSavingFeedback}
              submitFeedback={curation.submitFeedback} pastSimilarOutfits={curation.pastSimilarOutfits}
            />
          )}
          {mobileTab === 'analysis' && (
            <MobileAnalysisTab
              scanState={analysis.scanState} setScanState={analysis.setScanState}
              critique={analysis.critique} partialCritique={analysis.partialCritique}
              originalImage={analysis.originalImage}
              hasCustomImage={analysis.hasCustomImage} base64Image={analysis.base64Image}
              isStreaming={analysis.isStreaming} isRateLimited={analysis.isRateLimited}
              wardrobeCount={curation.wardrobeCount ?? 0}
              retryAnalysis={analysis.retryAnalysis} handleSaveToFeed={analysis.handleSaveToFeed}
              triggerCamera={analysis.triggerCamera} triggerGallery={analysis.triggerGallery}
              onSwitchToCuration={() => setMobileTab('curation')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
