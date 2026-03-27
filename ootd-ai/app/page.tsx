'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, User, Grid, Settings2, ChevronRight, ScanLine, Sparkles, MapPin, CloudRain, Star, Droplets, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

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
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showSplash, setShowSplash] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [critique, setCritique] = useState<FashionCritique | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Splash Screen Logic
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

  // Fetch Weather Logic (with fallback to Seoul)
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
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m), // 정수 반올림
          condition: cond
        });
      } catch (err) {
        console.error("Weather API Error:", err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather() 
      );
    } else {
      fetchWeather();
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
    
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
          weatherInfo: weather || { temperature: 20, condition: 'Clear' }
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCritique(data);
        setScanState('success');
      } else {
        console.error(data.error);
        alert('에러가 발생했습니다: ' + (data.error || 'AI 분석 오류'));
        setScanState('idle');
      }
    } catch (err) {
      console.error(err);
      alert('네트워크 오류가 발생했습니다.');
      setScanState('idle');
    }
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
        category: 'ootd_feed',
        name: `${critique.score}점: ${critique.summary}`,
        image_url: publicUrl,
        user_id: 'guest_user_123'
      });
      if (dbError) throw new Error('DB 무결성 에러');
      
      alert('성공적으로 내 OOTD 갤러리에 저장되었습니다! 📸\\n(마이옷장 -> OOTD Feeds 탭에서 확인하세요)');
      setScanState('success');
    } catch(e) {
      alert('서버 저장 실패!');
      setScanState('success');
    }
  };

  return (
    <div className="relative h-screen w-full bg-white overflow-hidden font-sans selection:bg-zinc-200">
      
      <input 
        type="file" 
        accept="image/*"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* OOTD AI Intro Splash Screen (Light Theme) */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center justify-center">
               <img src="/logo.png" alt="OOTD Logo" className="w-[70vw] md:w-80 h-auto object-contain mix-blend-multiply" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="absolute bottom-12 left-0 right-0 text-center">
               <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">Powered by Ai.dev</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background: uploaded image or clean white */}
      <div className="absolute inset-0 z-0 bg-white">
        {originalImage ? (
          <img 
            src={originalImage} 
            alt="OOTD Preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-stone-50/30" />
        )}
        {/* Light overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/90 pointer-events-none" />
      </div>

      {/* Top HUD */}
      <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-start z-20">
        <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-800 shadow-xl hover:bg-white/80 transition shrink-0">
          <User className="w-5 h-5" />
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

        <button className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-800 shadow-xl hover:bg-white/80 transition shrink-0">
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {/* Initial Prompt Banner */}
      <AnimatePresence>
        {scanState === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-12 top-[25%] bottom-[30%] border-[2px] border-white/60 rounded-[3rem] pointer-events-none z-10 flex items-center justify-center drop-shadow-md">
             <div className="px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 text-[10px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg">
               <ScanLine className="w-4 h-4" />
               카메라 버튼을 눌러 OOTD를 촬영하세요
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Scanning Process Overlay */}
      <AnimatePresence>
        {scanState === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 pointer-events-none">
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 bg-white" />
            
            <motion.div initial={{ top: '15%' }} animate={{ top: '85%' }} transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="absolute left-6 right-6 h-[1.5px] bg-black shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-black/10 blur-[20px] rounded-full" />
            </motion.div>

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-full border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                에디터 모델 분석 중...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT: AI Stylist Critique */}
      <AnimatePresence>
        {scanState === 'success' && critique && (
          <motion.div key="success" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col h-[75vh]">
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 shrink-0" />
            
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 [&::-webkit-scrollbar]:hidden">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase block mb-1">AI Stylist Review</span>
                   <h2 className="text-2xl font-black tracking-tight text-black leading-snug break-keep pr-4 text-balance">
                     "{critique.summary}"
                   </h2>
                 </div>
                 <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                      <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#18181b" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: critique.score / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} strokeDasharray="175" />
                    </svg>
                    <span className="text-xl font-black">{critique.score}</span>
                 </div>
              </div>

              <div className="space-y-4">
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
              </div>

              <div className="mt-8 flex flex-col gap-3">
                 <button onClick={handleSaveToFeed} className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                   <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                 </button>
                 <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => setScanState('idle')} className="col-span-1 py-4 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">
                     다시입기
                   </button>
                   <Link href="/wardrobe" className="col-span-1 block">
                     <button className="w-full h-full py-4 bg-zinc-100 border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">
                       옷장 가기
                     </button>
                   </Link>
                   <button onClick={() => {
                     if (base64Image) {
                       sessionStorage.setItem('ootd_transfer_image', base64Image);
                       sessionStorage.setItem('ootd_auto_start', 'true');
                       window.location.href = '/test-bg';
                     }
                   }} className="col-span-2 py-4 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5">
                       AI로 옷 추출하기
                       <ChevronRight className="w-3.5 h-3.5" />
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Camera Dock (Hidden during success) */}
      <AnimatePresence>
        {scanState !== 'success' && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent z-30 pointer-events-none" />
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-10 left-0 right-0 px-10 flex items-center justify-between z-40">
              <Link href="/wardrobe">
                <button className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex flex-col items-center justify-center text-zinc-800 hover:bg-zinc-50 transition shadow-xl active:scale-95">
                   <Grid className="w-5 h-5 text-zinc-800" />
                </button>
              </Link>

              {/* Shutter Button (Click calls file input) */}
              <div className="relative flex items-center justify-center cursor-pointer" onClick={triggerCamera}>
                <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                  <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                  <motion.circle cx="48" cy="48" r="45" fill="none" stroke="#000000" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }} transition={{ duration: 2.8, ease: "linear" }} strokeDasharray="283" />
                </svg>
                <div className="w-[72px] h-[72px] bg-black rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-black/10 transition-all hover:scale-105 active:scale-95">
                  <Camera className="w-8 h-8 text-white opacity-90" strokeWidth={1.5} />
                </div>
              </div>

              {/* AI Curation Tab */}
              <Link href="/curation">
                <button className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex flex-col items-center justify-center text-zinc-800 hover:bg-zinc-50 transition group shadow-xl active:scale-95">
                  <Zap className="w-6 h-6 text-black group-hover:-translate-y-1 transition-transform drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] fill-black" />
                </button>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
