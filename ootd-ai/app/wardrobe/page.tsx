'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Home, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface ClothItem {
  id: string;
  image: string;
  name: string;
  categoryId?: string;
}

interface CategoryInfo {
  id: string;
  title: string;
  items: ClothItem[];
}

const WARDROBE_DATA: CategoryInfo[] = [
  { id: 'outer', title: 'OUTER', items: [] },
  { id: 'tops', title: 'TOPS', items: [] },
  { id: 'bottoms', title: 'BOTTOMS', items: [] },
  { id: 'shoes', title: 'SHOES', items: [] },
  { id: 'socks', title: 'SOCKS / ETC', items: [] }
];

const MEMORIES_DATA = [
  { id: 'm1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', date: 'TODAY', tags: ['Minimal', 'Casual'] },
  { id: 'm2', image: 'https://images.unsplash.com/photo-1509631179647-0c57283fce83?q=80&w=800&auto=format&fit=crop', date: 'YESTERDAY', tags: ['Street', 'Dark'] },
];

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'memories'>('wardrobe');
  const [editMode, setEditMode] = useState(false);
  const [localItems, setLocalItems] = useState<ClothItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalItems(JSON.parse(localStorage.getItem('ootd_wardrobe') || '[]'));
    setDeletedIds(JSON.parse(localStorage.getItem('ootd_deleted') || '[]'));
  }, []);

  const handleDelete = (id: string) => {
    if (id.startsWith('local_')) {
      const newLocal = localItems.filter(i => i.id !== id);
      setLocalItems(newLocal);
      localStorage.setItem('ootd_wardrobe', JSON.stringify(newLocal));
    } else {
      const newDeleted = [...deletedIds, id];
      setDeletedIds(newDeleted);
      localStorage.setItem('ootd_deleted', JSON.stringify(newDeleted));
    }
  };

  const getMergedCategories = () => {
    return WARDROBE_DATA.map(cat => {
      const mockRemaining = cat.items.filter(i => !deletedIds.includes(i.id));
      const locals = localItems.filter(i => i.categoryId === cat.id);
      return { ...cat, items: [...locals, ...mockRemaining] };
    });
  };

  const displayCategories = getMergedCategories();

  return (
    <div className="min-h-screen bg-[#dcc4a3] text-stone-900 pb-28 font-sans selection:bg-stone-300 relative">
      
      {/* Wood Texture Background for Wardrobe */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=800')] bg-cover bg-center opacity-40 mix-blend-multiply z-0" />
      {/* Header */}
      <header className="pt-12 pb-6 sticky top-0 bg-[#dcc4a3]/80 backdrop-blur-xl z-40 border-b border-stone-800/10 shadow-[0_10px_30px_rgba(120,90,50,0.1)]">
        
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6 px-6 relative z-10">
          <Link href="/">
            <button className="w-10 h-10 rounded-full border border-stone-800/20 bg-white/50 backdrop-blur flex items-center justify-center text-stone-800 shadow-md hover:bg-white/80 transition active:scale-95">
              <Home className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-black tracking-[0.3em] uppercase text-stone-900 drop-shadow-sm">
            MY CLOSET
          </h1>
          
          <button onClick={() => setEditMode(!editMode)} className={`w-10 h-10 rounded-full border flex items-center justify-center transition shadow-md shrink-0 ${editMode ? 'bg-red-500 border-red-600 text-white' : 'bg-white/50 backdrop-blur border-stone-800/20 text-stone-800 hover:bg-white/80'}`}>
            {editMode ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
        {/* Custom Segmented Control */}
        <div className="px-6 mb-2 relative z-10">
          <div className="flex p-1 bg-white/40 backdrop-blur-md border border-stone-800/10 rounded-full shadow-sm relative">
            <motion.div
               layoutId="activeTabIndicator"
               className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-stone-900 rounded-full z-0 shadow-md"
               initial={false}
               animate={{ x: activeTab === 'wardrobe' ? 0 : '100%' }}
               transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setActiveTab('wardrobe')}
              className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase z-10 transition-colors ${activeTab === 'wardrobe' ? 'text-white' : 'text-stone-700 hover:text-stone-900'}`}
            >
              Wardrobe
            </button>
            <button 
              onClick={() => setActiveTab('memories')}
              className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase z-10 transition-colors ${activeTab === 'memories' ? 'text-white' : 'text-stone-700 hover:text-stone-900'}`}
            >
              OOTD Feeds
            </button>
          </div>
        </div>
      </header>
      {/* Main Content Area */}
      <main className="relative z-10 pt-4">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WARDROBE (Hanging directly on wood) */}
          {activeTab === 'wardrobe' && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-14 mt-6"
            >
              {displayCategories.map(category => (
                <section key={category.id} className="relative">
                  <div className="flex justify-between items-end px-6 mb-4 z-20 relative">
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tight drop-shadow-md">{category.title}</h2>
                    <span className="text-[10px] font-bold tracking-widest text-stone-600 uppercase leading-relaxed bg-stone-100/50 px-2 py-0.5 rounded-full">{String(category.items.length).padStart(2, '0')} ITEMS</span>
                  </div>
                  
                  <div className="relative">
                    {/* Metal Clothes Rail (Darker for Wood Contrast) */}
                    <div className="absolute top-[16px] z-0 left-0 right-0 mx-6 h-[4px] bg-gradient-to-r from-stone-700 via-stone-500 to-stone-700 shadow-[0_5px_5px_rgba(0,0,0,0.5)] rounded-full" />
                    
                    <div className="flex gap-5 overflow-x-auto px-6 pt-5 pb-10 snap-x snap-mandatory relative z-10 [&::-webkit-scrollbar]:hidden items-start" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {category.items.map((item) => (
                        <div key={item.id} className="snap-center shrink-0 w-[150px] cursor-pointer group flex flex-col items-center relative">
                          {editMode && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="absolute -top-2 -right-1 z-50 bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.5)] border-[3px] border-[#dcc4a3] hover:scale-110 active:scale-90 transition-transform"
                            >
                              <X className="w-5 h-5" strokeWidth={3} />
                            </button>
                          )}
                          <div className="relative flex flex-col items-center w-[140px] transition-transform duration-500 z-10 group-hover:-translate-y-3">
                            {/* Hanger Graphic attached to Rail */}
                            <div className="text-stone-800 -mb-5 relative z-20 drop-shadow-[0_4px_2px_rgba(0,0,0,0.3)]">
                               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 14 l8-6 l8 6Z"/>
                                  <path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/>
                               </svg>
                            </div>
                            
                            {/* Direct Clothing (No White Card Box) */}
                            <div className="w-[140px] h-[160px] relative flex items-center justify-center">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="max-w-[100%] max-h-[100%] object-contain mt-2 transition-transform duration-500 group-hover:scale-[1.15]"
                                style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.2)) drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
                                draggable={false}
                              />
                            </div>
                            
                            {/* Label */}
                            <div className="mt-5 px-3 py-1.5 bg-white/90 backdrop-blur border border-stone-200 rounded-lg shadow-md">
                              <p className="text-[9px] font-black tracking-widest text-stone-800 uppercase text-center">{item.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Empty Add Placeholder (Hanger Only) */}
                      <Link href="/test-bg">
                        <div className="snap-center shrink-0 w-[140px] h-[160px] mt-[20px] flex flex-col items-center justify-start cursor-pointer group transition">
                          <div className="text-stone-500/50 mb-4 group-hover:text-stone-500 transition-colors">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M4 14 l8-6 l8 6Z"/><path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/>
                            </svg>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/40 border border-stone-400/30 flex items-center justify-center group-hover:bg-white/80 transition shadow-sm">
                            <Plus className="w-5 h-5 text-stone-600" />
                          </div>
                          <span className="text-[9px] font-bold text-stone-600 tracking-widest uppercase mt-4">ADD NEW</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </section>
              ))}
            </motion.div>
          )}
          {/* TAB 2: MEMORIES */}
          {activeTab === 'memories' && (
             <motion.div
              key="memories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-6 px-6 mt-4"
            >
               {MEMORIES_DATA.map(memory => (
                 <div key={memory.id} className="bg-white rounded-[2rem] overflow-hidden border border-stone-200 shadow-[0_15px_40px_rgba(0,0,0,0.1)] relative group">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={memory.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="OOTD" />
                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-black text-[9px] font-extrabold tracking-widest px-2.5 py-1 rounded-full shadow-md">
                      {memory.date}
                    </span>
                  </div>
                  <div className="p-5 relative z-10 bg-[#fdfdfd] border-t border-stone-100 flex flex-col gap-3">
                    <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold">Look</p>
                    <div className="flex gap-2">
                       {memory.tags.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-stone-100 rounded-full text-stone-600 font-bold uppercase tracking-widest text-[9px] border border-stone-200/50">{tag}</span>
                       ))}
                    </div>
                  </div>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Manual Upload FAB */}
      <div className="fixed bottom-8 right-6 z-50">
        <Link href="/test-bg">
          <button className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all outline-none pb-0.5 border border-stone-700">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </Link>
      </div>
    </div>
  );
}
