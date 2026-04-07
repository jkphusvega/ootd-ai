'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, User, Grid, Settings2, ChevronRight, ScanLine, Sparkles, MapPin, CloudRain, Star, Droplets, Bookmark, Upload, ImagePlus, Sun, Cloud, CloudSnow, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { createClient as createSSRClient } from '../lib/supabase/client';

interface WeatherData {
  temperature: number;
  condition: string;
}

interface FashionCritique {
  score: number;
  summary: string;
  weatherAdvice: string;
  fitAndColor: string;
  stylistRecommendation: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showSplash, setShowSplash] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [critique, setCritique] = useState<FashionCritique | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("https://images.unsplash.com/photo-1485230895905-312046452294?q=80&w=800&auto=format&fit=crop");
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userProfile, setUserProfile] = useState<{nickname?: string; profile_image?: string; height?: number; weight?: number; fit_preference?: string; style_moods?: string[]} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  // Splash Screen
  useEffect(() => {
    if (!sessionStorage.getItem('ootd_splashed')) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('ootd_splashed', 'true');
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auth Redirect
  useEffect(() => {
    if (!authLoading && !showSplash && !user) {
      router.push('/login');
    }
  }, [authLoading, showSplash, user, router]);

  // Fetch Weather
  useEffect(() => {
    const fetchWeather = async (lat = 37.5665, lon = 126.9780) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const data = await res.json();
        const code = data.current.weather_code;
        let cond = 'Clear';
        if (code >= 60 && code <= 67) cond = 'Rain';
        else if (code >= 1 && code <= 3) cond = 'Cloudy';
        else if (code >= 70) cond = 'Snow';
        setWeather({ temperature: data.current.temperature_2m, condition: cond });
      } catch (err) { console.error("Weather API Error:", err); }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather()
      );
    } else { fetchWeather(); }
  }, []);

  // Fetch User Profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setUserProfile(data);
      } else {
        // 프로필 데이터가 없으면 온보딩으로 이동
        router.push('/onboarding');
      }
    };
    if (!authLoading) checkProfile();
  }, [user, authLoading, router]);

  const processFile = async (file: File) => {
    // 🔒 보안: 5MB 이상 이미지 업로드 차단
    if (file.size > 5 * 1024 * 1024) {
      alert('📸 사진 용량이 너무 큽니다!\n5MB 이하의 사진을 사용해주세요.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
    setHasCustomImage(true);
    
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setBase64Image(base64);
    setScanState('scanning');
    
    try {
      const res = await fetch('/api/analyze-ootd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: userProfile || null
        })
      });
      const data = await res.json();
      if (res.ok) { setCritique(data); setScanState('success'); }
      else { alert('에러가 발생했습니다: ' + (data.error || 'AI 분석 오류')); setScanState('idle'); }
    } catch (err) { alert('네트워크 오류가 발생했습니다.'); setScanState('idle'); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    await processFile(e.target.files[0]);
  };

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => { setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await processFile(file);
  }, [weather]);

  const triggerCamera = () => { fileInputRef.current?.click(); };
  const triggerDesktopUpload = () => { desktopFileInputRef.current?.click(); };

  const handleSaveToFeed = async () => {
    if (!base64Image || !critique) return;
    setScanState('scanning');
    try {
      const fetchResponse = await fetch(base64Image);
      const blob = await fetchResponse.blob();
      const fileName = `ootd_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: 'image/webp' });
      if (uploadError) throw new Error('업로드 에러');
      const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('clothes').insert({
        category: 'ootd_feed', name: `${critique.score}점: ${critique.summary}`, image_url: publicUrl, user_id: user!.id
      });
      if (dbError) throw new Error('DB 무결성 에러');
      alert('성공적으로 내 OOTD 갤러리에 저장되었습니다! 📸\n(마이옷장 -> OOTD Feeds 탭에서 확인하세요)');
      setScanState('success');
    } catch(e) { alert('서버 저장 실패!'); setScanState('success'); }
  };

  const handleLogout = async () => {
    const supabaseSSR = createSSRClient();
    await supabaseSSR.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const WeatherIcon = () => {
    if (!weather) return null;
    if (weather.condition === 'Rain') return <CloudRain className="w-5 h-5" />;
    if (weather.condition === 'Snow') return <CloudSnow className="w-5 h-5" />;
    if (weather.condition === 'Cloudy') return <Cloud className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    const nickname = userProfile?.nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    const nameStr = nickname ? ` ${nickname}님` : '';
    if (h < 6) return `늦은 밤이네요${nameStr} 🌙`;
    if (h < 12) return `좋은 아침이에요${nameStr} ☀️`;
    if (h < 18) return `좋은 오후에요${nameStr} 🌤`;
    return `좋은 저녁이에요${nameStr} 🌆`;
  };

  if (!authLoading && !showSplash && !user) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="relative min-h-screen w-full bg-white font-sans selection:bg-zinc-200">
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={desktopFileInputRef} onChange={handleFileChange} />

      {/* ============ SPLASH SCREEN ============ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center justify-center">
               <img src="/logo.png" alt="OOTD Logo" className="w-[70vw] md:w-80 h-auto object-contain mix-blend-multiply" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="absolute bottom-12 left-0 right-0 text-center">
               <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">Powered by Ai.dev</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (lg 이상): Dashboard Style
          ════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 py-8">
          
          {/* Greeting + Weather Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">{getGreeting()}</h1>
                <button onClick={handleLogout} className="text-xs px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full font-bold transition flex items-center gap-1">
                  <LogOut className="w-3 h-3"/> 로그아웃
                </button>
              </div>
              <p className="text-zinc-400 text-sm font-medium">오늘의 OOTD를 업로드하고 AI 스타일리스트의 리뷰를 받아보세요</p>
            </div>
            {weather && (
              <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <WeatherIcon />
                <div>
                  <span className="text-xl font-extrabold text-zinc-900">{weather.temperature}°C</span>
                  <span className="text-xs text-zinc-400 ml-2 font-semibold">{weather.condition}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 items-start">
            {/* ── Left Column: Image Upload Area ── */}
            <div className="flex flex-col gap-5">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerDesktopUpload}
                className={`relative aspect-[3/4] w-full rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 border-2 ${
                  isDragging
                    ? 'border-zinc-900 bg-zinc-50 scale-[1.01] shadow-[0_0_40px_rgba(0,0,0,0.08)]'
                    : hasCustomImage
                    ? 'border-zinc-200 shadow-xl'
                    : 'border-dashed border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-100/50'
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
                      <p className="text-sm font-bold text-zinc-600 mb-1">
                        {isDragging ? '여기에 놓으세요!' : '사진을 드래그하거나 클릭하세요'}
                      </p>
                      <p className="text-xs text-zinc-400">오늘의 OOTD 전신 사진을 올려주세요</p>
                    </div>
                  </div>
                )}

                {/* Scanning Overlay */}
                {scanState === 'scanning' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      AI 스타일리스트 분석 중...
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Right Column: AI Results Panel ── */}
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="wait">
                {scanState === 'idle' && !critique && (
                  <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center mb-5">
                      <Sparkles className="w-7 h-7 text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-400 mb-2">AI 리뷰 대기 중</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      왼쪽에 OOTD 사진을 업로드하면<br/>AI 스타일리스트가 분석을 시작합니다
                    </p>
                  </motion.div>
                )}

                {scanState === 'scanning' && (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full mb-5" />
                    <p className="text-sm font-bold text-zinc-500 tracking-wide">Gemini AI가 분석하고 있어요...</p>
                  </motion.div>
                )}

                {(scanState === 'success' || critique) && critique && (
                  <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }} className="flex flex-col gap-5">
                    
                    {/* Score + Summary */}
                    <div className="flex justify-between items-start p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex-1 pr-6">
                        <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase block mb-2">AI Stylist Review</span>
                        <h2 className="text-xl font-extrabold tracking-tight text-black leading-snug break-keep text-balance">
                          "{critique.summary}"
                        </h2>
                      </div>
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                          <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#18181b" strokeWidth="4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: critique.score / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} strokeDasharray="175" />
                        </svg>
                        <span className="text-xl font-black">{critique.score}</span>
                      </div>
                    </div>

                    {/* Detail Cards */}
                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800">Weather Context</h3>
                      </div>
                      <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">{critique.weatherAdvice}</p>
                    </div>

                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <ScanLine className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800">Fit & Color</h3>
                      </div>
                      <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">{critique.fitAndColor}</p>
                    </div>

                    <div className="p-5 bg-black rounded-2xl border border-zinc-800 flex flex-col gap-2 shadow-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Pick</h3>
                      </div>
                      <p className="text-[13px] text-white leading-relaxed font-medium">{critique.stylistRecommendation}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 mt-2">
                      <button onClick={handleSaveToFeed} className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-stone-800">
                        <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                      </button>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button onClick={() => { setScanState('idle'); setCritique(null); setHasCustomImage(false); setOriginalImage("https://images.unsplash.com/photo-1485230895905-312046452294?q=80&w=800&auto=format&fit=crop"); }}
                          className="py-3.5 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-zinc-50">
                          다시 분석
                        </button>
                        <Link href="/wardrobe" className="block">
                          <button className="w-full h-full py-3.5 bg-zinc-100 border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-zinc-200">
                            옷장 가기
                          </button>
                        </Link>
                        <Link href="/curation" className="block">
                          <button className="w-full h-full py-3.5 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-purple-200 flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                          </button>
                        </Link>
                        <button onClick={() => {
                          if (base64Image) {
                            sessionStorage.setItem('ootd_transfer_image', base64Image);
                            sessionStorage.setItem('ootd_auto_start', 'true');
                            window.location.href = '/test-bg';
                          }
                        }} className="py-3.5 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5 hover:bg-zinc-800">
                          AI 추출 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (lg 미만): Camera-First Style
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden relative h-screen w-full overflow-hidden bg-[#F9F9F9]">
        {/* Premium Minimalist Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#F2F2F7_100%)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>

        {/* Top HUD */}
        <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-start z-20">
          <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-800 shadow-xl hover:bg-white/80 transition shrink-0 overflow-hidden">
            {userProfile?.profile_image || user?.user_metadata?.avatar_url ? (
              <img src={userProfile?.profile_image || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>
          <div className="flex flex-col items-center gap-1.5">
            <div className="px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-black/5 flex items-center gap-2.5 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <span className="text-zinc-900 text-[10px] font-black tracking-[0.2em] uppercase">Today's Selfie</span>
            </div>
            {weather && (
              <div className="px-3 py-1.5 bg-black/5 backdrop-blur-md rounded-full flex items-center gap-1.5 text-zinc-600 shadow-sm border border-zinc-200/50">
                <MapPin className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-[0.1em]">{weather.temperature}°C {weather.condition}</span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-red-500 shadow-xl hover:bg-red-50 transition shrink-0">
            <LogOut className="w-5 h-5 ml-1" />
          </button>
        </header>

        {/* Idle Prompt */}
        <AnimatePresence>
          {scanState === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-12 top-[25%] bottom-[30%] border-[2px] border-white/60 rounded-[3rem] pointer-events-none z-10 flex items-center justify-center drop-shadow-md">
              <div className="px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 text-[10px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg">
                <ScanLine className="w-4 h-4" /> 카메라 버튼을 눌러 OOTD를 촬영하세요
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning Overlay */}
        <AnimatePresence>
          {scanState === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 pointer-events-none">
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 bg-white" />
              <motion.div initial={{ top: '15%' }} animate={{ top: '85%' }} transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute left-6 right-6 h-[1.5px] bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-black/10 blur-[20px] rounded-full" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-full border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                  <Sparkles className="w-4 h-4" /> 에디터 모델 분석 중...
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Result Bottom Sheet */}
        <AnimatePresence>
          {scanState === 'success' && critique && (
            <motion.div key="success" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col h-[75vh]">
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 shrink-0" />
              <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase block mb-1">AI Stylist Review</span>
                    <h2 className="text-2xl font-black tracking-tight text-black leading-snug break-keep pr-4 text-balance">"{critique.summary}"</h2>
                  </div>
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                      <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#18181b" strokeWidth="4"
                        initial={{ pathLength: 0 }} animate={{ pathLength: critique.score / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} strokeDasharray="175" />
                    </svg>
                    <span className="text-xl font-black">{critique.score}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1"><Droplets className="w-4 h-4 text-zinc-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800">Weather Context</h3></div>
                    <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">{critique.weatherAdvice}</p>
                  </div>
                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1"><ScanLine className="w-4 h-4 text-zinc-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800">Fit & Color</h3></div>
                    <p className="text-[13px] text-zinc-600 leading-relaxed font-medium">{critique.fitAndColor}</p>
                  </div>
                  <div className="p-5 bg-black rounded-2xl border border-zinc-800 flex flex-col gap-2 shadow-xl">
                    <div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-yellow-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Pick</h3></div>
                    <p className="text-[13px] text-white leading-relaxed font-medium">{critique.stylistRecommendation}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <button onClick={handleSaveToFeed} className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setScanState('idle')} className="w-full py-4 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">다시입기</button>
                      <Link href="/wardrobe" className="block"><button className="w-full h-full py-4 bg-zinc-100 border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">옷장 가기</button></Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/curation" className="block">
                        <button className="w-full h-full py-4 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                        </button>
                      </Link>
                      <button onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); window.location.href = '/test-bg'; } }}
                        className="w-full py-4 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5">
                        AI 추출 <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Dock */}
        <AnimatePresence>
          {scanState !== 'success' && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent z-30 pointer-events-none" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 left-0 right-0 px-10 flex items-center justify-center z-40">
                {/* Shutter Button */}
                <div className="relative flex items-center justify-center cursor-pointer" onClick={triggerCamera}>
                  <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                    <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                    <motion.circle cx="48" cy="48" r="45" fill="none" stroke="#000000" strokeWidth="4"
                      initial={{ pathLength: 0 }} animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }}
                      transition={{ duration: 2.8, ease: "linear" }} strokeDasharray="283" />
                  </svg>
                  <div className="w-[72px] h-[72px] bg-black rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-black/10 transition-all hover:scale-105 active:scale-95">
                    <Camera className="w-8 h-8 text-white opacity-90" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
