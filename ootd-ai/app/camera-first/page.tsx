'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, User, Grid, Settings2, CheckCircle2, ChevronRight, ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function CameraFirstPage() {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');

  const capturePhoto = () => {
    if (scanState !== 'idle') return;
    setScanState('scanning');
    setTimeout(() => {
      setScanState('success');
      setTimeout(() => setScanState('idle'), 5000);
    }, 2800);
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Simulated Live Camera Feed */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1485230895905-312046452294?q=80&w=800&auto=format&fit=crop" 
          alt="Camera Feed" 
          className="w-full h-full object-cover scale-105"
        />
        {/* Gradients for UI readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
      </div>

      {/* Top HUD */}
      <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-20">
        <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-black/60 transition">
          <User className="w-5 h-5" />
        </button>

        <div className="px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2.5 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
          <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">Today&apos;s OOTD</span>
        </div>

        <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-xl hover:bg-black/60 transition">
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {/* Default HUD reticle when idle */}
      <AnimatePresence>
        {scanState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-x-12 top-[20%] bottom-[25%] border-[1.5px] border-white/20 rounded-[3rem] pointer-events-none z-10 flex items-center justify-center"
          >
             <div className="px-6 py-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/80 text-[10px] tracking-widest font-bold uppercase flex items-center gap-2">
               <ScanLine className="w-4 h-4" />
               거울 앞에 서서 전신을 비춰주세요
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AR Scanning Effect */}
      <AnimatePresence>
        {scanState === 'scanning' && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            {/* Flash Effect */}
            <motion.div 
               initial={{ opacity: 1 }} 
               animate={{ opacity: 0 }} 
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="absolute inset-0 bg-white"
            />
            
            {/* Scanning Line & Glow */}
            <motion.div 
               initial={{ top: '15%' }}
               animate={{ top: '85%' }}
               transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
               className="absolute left-6 right-6 h-[1.5px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] z-20"
            >
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-cyan-400/20 blur-[20px] rounded-full" />
            </motion.div>

            {/* Scanning HUD brackets */}
            <div className="absolute inset-x-8 top-[15%] bottom-[20%] border-2 border-cyan-400/20 rounded-[2.5rem]" />
            <div className="absolute top-[15%] left-8 w-12 h-12 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-[2.5rem]" />
            <div className="absolute top-[15%] right-8 w-12 h-12 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-[2.5rem]" />
            <div className="absolute bottom-[20%] left-8 w-12 h-12 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-[2.5rem]" />
            <div className="absolute bottom-[20%] right-8 w-12 h-12 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-[2.5rem]" />

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 1, repeat: Infinity }}
                className="px-6 py-3 bg-black/70 backdrop-blur-xl rounded-full border border-cyan-500/50 text-cyan-400 font-bold tracking-widest text-[11px] uppercase shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Vision AI 분류 중...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {scanState === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-36 left-6 right-6 z-40"
          >
            <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex flex-col items-center justify-center shrink-0 border border-cyan-500/30">
                  <CheckCircle2 className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-lg tracking-tight mb-1">OOTD 기록 완료!</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">사진에서 <span className="text-cyan-400 font-bold">아우터, 상의, 하의</span>를 각각 분리하여 내 옷장에 3벌을 추가했습니다.</p>
                </div>
              </div>
              <Link href="/wardrobe">
                <button className="w-full py-4 bg-white text-black font-bold tracking-widest text-[11px] uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition shadow-lg">
                  가상 옷장(Wardrobe) 확인하기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Area */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent z-30 pointer-events-none" />
      
      <div className="absolute bottom-10 left-0 right-0 px-10 flex items-center justify-between z-40">
        
        {/* Gallery / Wardrobe Button */}
        <Link href="/wardrobe">
          <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/20 transition group">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 p-0.5">
              <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center">
                 <Grid className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            </div>
          </button>
        </Link>

        {/* Massive Shutter Button */}
        <div className="relative flex items-center justify-center cursor-pointer">
          <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
            <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <motion.circle 
              cx="48" cy="48" r="45" 
              fill="none" 
              stroke="#22d3ee" 
              strokeWidth="4" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }}
              transition={{ duration: 2.8, ease: "linear" }}
              strokeDasharray="283"
            />
          </svg>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={capturePhoto}
            className="w-[72px] h-[72px] bg-white rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] border-4 border-black/10 transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
          >
            <Camera className="w-8 h-8 text-black opacity-80" strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* AI Styling Magic Button */}
        <button className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/20 transition group">
          <Zap className="w-6 h-6 text-yellow-400 group-hover:-translate-y-1 transition-transform drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
        </button>

      </div>
    </div>
  );
}
