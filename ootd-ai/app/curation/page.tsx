'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CloudRain, MapPin, RefreshCw, X, Home } from 'lucide-react';
import Link from 'next/link';

// Detailed Mock Data for AI layers
const AI_OUTFIT_SUGGESTION = [
  { id: 'l1', type: 'BOTTOM', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400&auto=format&fit=crop', zIndex: 1, yOffset: 120, scale: 0.95 },
  { id: 'l2', type: 'TOP', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop', zIndex: 2, yOffset: -30, scale: 1 },
  { id: 'l3', type: 'OUTER', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop', zIndex: 3, yOffset: -50, scale: 1.1 },
];

export default function CurationPage() {
  const [layers, setLayers] = useState(AI_OUTFIT_SUGGESTION);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const bringToFront = (id: string) => {
    setLayers(prev => {
      const maxZ = Math.max(...prev.map(l => l.zIndex));
      return prev.map(l => l.id === id ? { ...l, zIndex: maxZ + 1 } : l);
    });
  };

  const handleGenerateNew = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setLayers(prev => prev.map(l => ({ ...l, yOffset: l.yOffset + (Math.random() * 20 - 10) })));
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans overflow-hidden selection:bg-zinc-200 flex flex-col">
      
      {/* Light Theme Background Dynamic Element */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8f9fa] to-zinc-100 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_40%)] z-0 pointer-events-none" />

      {/* Header: Weather Context */}
      <header className="relative z-10 pt-12 pb-6 px-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <button className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm hover:bg-zinc-50 transition active:scale-95">
                <Home className="w-3.5 h-3.5" />
              </button>
            </Link>
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">Seoul, Hongdae</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black mb-1">
            Today's <br/>AI Curation
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-xl rounded-full border border-black/5 mt-1 shadow-sm">
            <CloudRain className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500">16°C RAINY</span>
          </div>
        </div>

        <button 
          onClick={handleGenerateNew}
          disabled={isGenerating}
          className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-white ${isGenerating ? 'animate-spin' : ''}`} strokeWidth={2.5} />
        </button>
      </header>

      {/* Main Canvas Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-end pb-12 overflow-hidden" ref={containerRef}>
        
        {/* The Pedestal / Stage (Light theme) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/5 rounded-full blur-xl z-0" />
        
        {/* Outfit Layers Container */}
        <div className="relative w-full max-w-sm h-[60vh] flex items-center justify-center z-10">
          <AnimatePresence>
            {!isGenerating && layers.sort((a, b) => a.zIndex - b.zIndex).map((layer, index) => (
              <motion.div
                key={layer.id}
                drag
                dragConstraints={containerRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                onDragStart={() => bringToFront(layer.id)}
                initial={{ opacity: 0, y: layer.yOffset + 100, scale: 0.8 }}
                animate={{ opacity: 1, y: layer.yOffset, scale: layer.scale }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20, 
                  delay: index * 0.15 
                }}
                className="absolute"
                style={{ zIndex: layer.zIndex }}
              >
                {/* Die-cut Card (Light Theme) */}
                <motion.div 
                  className="w-48 h-56 bg-white rounded-3xl border border-zinc-200 shadow-[0_15px_40px_rgba(0,0,0,0.08)] relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                  whileHover={{ y: -5 }}
                >
                   {/* subtle inner shadow */}
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02),transparent)] pointer-events-none" />
                   
                   <img 
                     src={layer.image} 
                     alt="Clothing" 
                     className="w-full h-full object-cover p-2 mix-blend-multiply" 
                     draggable="false"
                   />
                   
                   {/* Layer Type Badge */}
                   <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur border border-zinc-100 px-2 py-1 rounded-md shadow-sm">
                     <span className="text-[8px] font-black tracking-widest text-zinc-600">{layer.type}</span>
                   </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-50 text-zinc-500"
            >
               <Sparkles className="w-8 h-8 animate-pulse text-black" />
               <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">AI Stylist Thinking...</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Info Bottom Sheet */}
      <div className="relative z-20 mt-auto">
        <div className="w-full bg-white backdrop-blur-2xl rounded-t-[3rem] border-t border-black/5 shadow-[0_-20px_50px_rgba(0,0,0,0.03)] p-8 pt-10 relative">
           <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-200 rounded-full" />
           
           <h2 className="text-2xl font-black tracking-tight mb-2">Rainy Day Layering</h2>
           <p className="text-zinc-500 text-xs leading-relaxed mb-6">
             현재 기온 16도의 비오는 날씨를 반영하여 구성한 레이어드 룩입니다. 오버핏 가죽 자켓이 빗방울을 막아주며 내부의 캐주얼 티셔츠가 편안함을 유지합니다.
           </p>

           <div className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50 shadow-sm shrink-0">
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-600">Style</span>
                <span className="text-[10px] font-bold text-black">Street</span>
              </div>
              <div className="px-4 py-2 border border-zinc-200 rounded-full flex items-center gap-2 bg-zinc-50 shadow-sm shrink-0">
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-600">Color</span>
                <span className="text-[10px] font-bold text-black">Monotone</span>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
