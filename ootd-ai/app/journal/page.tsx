'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sun, Calendar, Sparkles, Image as ImageIcon, Camera, X, Check } from 'lucide-react';
import Link from 'next/link';

// Mock Data
const MOCK_JOURNAL = [
  { id: '1', date: 'Oct 14, 2026', day: 'Wed', temp: '16°', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&fit=crop', tags: ['#미니멀', '#출근룩'], extracted: 3 },
  { id: '2', date: 'Oct 13, 2026', day: 'Tue', temp: '18°', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&fit=crop', tags: ['#스트릿', '#퇴근후'], extracted: 4 },
  { id: '3', date: 'Oct 10, 2026', day: 'Sat', temp: '22°', image: 'https://images.unsplash.com/photo-1550614000-4b95d4ed79ea?w=600&fit=crop', tags: ['#주말', '#아메카지'], extracted: 2 },
];

export default function JournalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'done'>('idle');

  const handleUpload = () => {
    setUploadState('analyzing');
    // Simulate AI extraction taking 2.5 seconds
    setTimeout(() => {
      setUploadState('done');
    }, 2800);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setUploadState('idle'), 300);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-zinc-900 font-sans selection:bg-zinc-200 pb-24">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 sticky top-0 bg-[#FDFDFC]/90 backdrop-blur-xl z-30">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-3xl font-serif italic text-zinc-800 tracking-tight">OOTD Journal</h1>
            <p className="text-[10px] text-zinc-400 tracking-[0.2em] uppercase mt-2 font-medium">Incremental Loading</p>
          </div>
          <div className="text-right pb-1">
            <p className="text-lg font-serif text-zinc-800 italic">Oct</p>
            <div className="flex items-center justify-end gap-1.5 text-zinc-400 mt-1">
              <Sun className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">16°</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="px-6 mt-6 flex flex-col gap-12">
        {MOCK_JOURNAL.map((entry, idx) => (
          <motion.article 
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            {/* Date line */}
            <div className="flex items-center gap-4">
              <div className="w-10 text-center">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{entry.day}</span>
                <span className="block text-2xl font-serif text-zinc-800">{entry.date.split(' ')[1].replace(',', '')}</span>
              </div>
              <div className="flex-1 h-[1px] bg-zinc-100" />
            </div>

            {/* Photo Card */}
            <div className="relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden bg-zinc-50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group cursor-pointer border border-zinc-100">
              <img src={entry.image} alt="OOTD" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
              
              {/* Extract Badge */}
              <div className="absolute top-5 right-5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/50">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-bold text-zinc-600 tracking-widest">AI EXTRACTED: {entry.extracted} 아이템</span>
              </div>

              {/* Tags Base */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 pointer-events-none" />
              
              {/* Tags */}
              <div className="absolute bottom-5 left-5 flex gap-2">
                {entry.tags.map(tag => (
                   <span key={tag} className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] tracking-wider font-semibold border border-white/20">
                     {tag}
                   </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}

        {/* Start Logging Prompt */}
        <motion.div 
           whileHover={{ scale: 1.02 }}
           onClick={() => setIsModalOpen(true)}
           className="w-full p-8 border border-dashed border-zinc-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer mt-4"
        >
          <Calendar className="w-8 h-8 opacity-50" strokeWidth={1.5} />
          <p className="text-xs font-semibold tracking-widest uppercase">Add Today's Outfit</p>
        </motion.div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl z-40 transition-colors hover:bg-zinc-800"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
      
      {/* Upload Modal (Bottom Sheet) */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={uploadState !== 'analyzing' ? closeModal : undefined}
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white rounded-t-[2.5rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] border-t border-zinc-100 flex flex-col items-center min-h-[35vh]"
            >
              <div className="w-12 h-1 bg-zinc-200 rounded-full mb-8" />

              {uploadState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-serif italic text-zinc-900">Log Today's Outfit</h2>
                      <p className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-widest font-semibold">Gemini Vision AI Analysis</p>
                    </div>
                    <button onClick={closeModal} className="p-2.5 bg-zinc-50 rounded-full text-zinc-500 hover:bg-zinc-100 transition border border-zinc-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={handleUpload} className="group flex flex-col items-center justify-center gap-4 bg-white border border-zinc-200 aspect-square rounded-[2rem] shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all">
                      <div className="p-5 bg-zinc-50 rounded-full group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7 text-zinc-700" strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-zinc-600 text-xs tracking-widest uppercase">Camera</span>
                    </button>
                    
                    <button onClick={handleUpload} className="group flex flex-col items-center justify-center gap-4 bg-white border border-zinc-200 aspect-square rounded-[2rem] shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all">
                      <div className="p-5 bg-zinc-50 rounded-full group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-7 h-7 text-zinc-700" strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-zinc-600 text-xs tracking-widest uppercase">Library</span>
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 mt-6 tracking-wide text-center leading-relaxed">
                    전신 사진(거울 셀카) 한 장만 올리면<br/>상의, 하의, 아우터를 AI가 자동으로 옷장에 보관합니다.
                  </p>
                </motion.div>
              )}

              {uploadState === 'analyzing' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-10 w-full">
                   <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-indigo-200" />
                     <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-t-2 border-indigo-400" />
                     <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" strokeWidth={1.5} />
                   </div>
                   <h3 className="text-2xl font-serif italic text-zinc-800 mb-3 tracking-tight">Analyzing Outfit...</h3>
                   <p className="text-[10px] text-zinc-400 tracking-widest uppercase font-semibold">Gemini Vision extracting items to Wardrobe</p>
                </motion.div>
              )}

              {uploadState === 'done' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-6 w-full">
                   <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
                     <Check className="w-8 h-8" strokeWidth={2} />
                   </div>
                   <h3 className="text-3xl font-serif italic text-zinc-800 mb-3 tracking-tight">Successfully Logged</h3>
                   <p className="text-xs text-zinc-500 mb-10 text-center px-4 leading-relaxed tracking-wide">
                     오늘의 OOTD가 저널에 기록되었습니다.<br/>
                     AI가 사진에서 <span className="font-bold text-zinc-700">3개의 아이템 (아우터, 상의, 하의)</span>을 추출해<br/>내 옷장에 자동 저장했습니다.
                   </p>
                   
                   <button onClick={closeModal} className="w-full bg-zinc-900 text-white text-sm tracking-widest uppercase font-bold py-5 rounded-2xl shadow-xl hover:bg-zinc-800 hover:-translate-y-0.5 transition-all">
                     View Journal
                   </button>
                   
                   <Link href="/wardrobe" className="mt-4 text-[10px] text-indigo-500 font-bold uppercase tracking-widest hover:underline hover:text-indigo-600 transition">
                     👉 Check Built Wardrobe
                   </Link>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
