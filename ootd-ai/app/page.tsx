'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useWeather } from '../hooks/useWeather';
import { useToast } from '../components/ToastProvider';
import { useOotdAnalysis } from '../hooks/useOotdAnalysis';
import { useMobileCuration } from '../hooks/useMobileCuration';
import LandingContent from '../components/LandingContent';
import SplashScreen from '../components/home/SplashScreen';
import DesktopLayout from '../components/home/DesktopLayout';
import MobileCurationTab from '../components/home/MobileCurationTab';
import MobileAnalysisTab from '../components/home/MobileAnalysisTab';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const weather = useWeather();
  const { toast } = useToast();
  const [showSplash, setShowSplash] = useState(false);
  const [mobileTab, setMobileTab] = useState<'curation' | 'analysis'>('curation');
  const [userProfile, setUserProfile] = useState<{ nickname?: string; profile_image?: string; [key: string]: unknown } | null>(null);

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
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setUserProfile(data); else router.push('/onboarding'); });
  }, [user, authLoading, router, supabase]);

  const getGreeting = () => {
    const h = new Date().getHours();
    const name = userProfile?.nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    const n = name ? ` ${name}님` : '';
    if (h < 6) return `늦은 밤이네요${n} 🌙`;
    if (h < 12) return `좋은 아침이에요${n} ☀️`;
    if (h < 18) return `좋은 오후에요${n} 🌤`;
    return `좋은 저녁이에요${n} 🌆`;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh(); };

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
        onLogout={handleLogout}
      />

      {/* Mobile */}
      <div className="lg:hidden relative h-screen w-full overflow-hidden bg-[#F9F9F9] dark:bg-[#0c0c0f]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#F2F2F7_100%)] dark:bg-none dark:bg-[#0c0c0f]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        {/* Top HUD */}
        <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-20">
          <Link href="/settings" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-800 shadow-xl hover:bg-white/80 transition shrink-0 overflow-hidden">
            {userProfile?.profile_image || user?.user_metadata?.avatar_url
              ? <img src={(userProfile?.profile_image || user?.user_metadata?.avatar_url) as string} alt="Profile" className="w-full h-full object-cover" />
              : <User className="w-4 h-4" />}
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

          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-red-400 shadow-xl hover:bg-red-50 transition shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

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
              hasCustomImage={analysis.hasCustomImage} base64Image={analysis.base64Image}
              isStreaming={analysis.isStreaming} isRateLimited={analysis.isRateLimited}
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
