'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface ClothItem {
  id: string;
  image: string;
  name: string;
  categoryId?: string;
  createdAt?: string;
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

const ITEMS_PER_CATEGORY = 8;

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'memories'>('wardrobe');
  const [editMode, setEditMode] = useState(false);
  const [localItems, setLocalItems] = useState<ClothItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const fetchClothes = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase.from('clothes').select('id, image_url, name, category, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data && !error) {
      const mapped = data.map((row: { id: string; image_url: string; name: string; category: string; created_at: string }) => ({
        id: row.id, image: row.image_url, name: row.name, categoryId: row.category, createdAt: row.created_at
      }));
      setLocalItems(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchClothes();
    }
  }, [user, authLoading]);

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#dcc4a3] pb-28 lg:pb-8">
        <div className="fixed inset-0 pointer-events-none bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=100&w=2400&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-multiply z-0" />
        <div className="relative z-10 pt-20 max-w-6xl mx-auto px-6">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="w-40 h-8 bg-white/20 rounded-xl animate-pulse" />
            <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
          </div>
          {/* Skeleton Categories */}
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-14">
              <div className="flex justify-between items-end mb-6">
                <div className="w-32 h-10 bg-white/15 rounded-xl animate-pulse" />
                <div className="w-20 h-5 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-5 lg:grid lg:grid-cols-5">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="shrink-0 w-[140px] lg:w-auto">
                    <div className="w-[140px] lg:w-full aspect-square bg-white/15 rounded-2xl animate-pulse" />
                    <div className="mt-3 w-20 h-3 bg-white/10 rounded-full animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const item = localItems.find(i => i.id === id);
    setLocalItems(prev => prev.filter(i => i.id !== id));
    setPendingDeleteId(null);

    const { error } = await supabase.from('clothes').delete().eq('id', id);
    if (error) {
      fetchClothes();
      return;
    }

    // Remove the image from storage to prevent orphaned files
    if (item?.image) {
      const storagePrefix = '/storage/v1/object/public/clothes/';
      const idx = item.image.indexOf(storagePrefix);
      if (idx !== -1) {
        const fileName = item.image.slice(idx + storagePrefix.length);
        await supabase.storage.from('clothes').remove([fileName]);
      }
    }
  };

  const getMergedCategories = () => {
    return WARDROBE_DATA.map(cat => {
      const dbItems = localItems.filter(i => i.categoryId === cat.id);
      return { ...cat, items: dbItems };
    });
  };

  const displayCategories = getMergedCategories();
  const totalItems = localItems.filter(i => i.categoryId !== 'ootd_feed').length;

  return (
    <div className="min-h-screen bg-[#dcc4a3] text-stone-900 pb-28 lg:pb-8 font-sans selection:bg-stone-300 relative">
      
      {/* Wood Texture Background */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=100&w=2400&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-multiply z-0" />
      <style>{`
        .sticker-effect {
          filter: drop-shadow(0px -3px 0px rgba(255,255,255,1)) drop-shadow(0px 3px 0px rgba(255,255,255,1)) drop-shadow(3px 0px 0px rgba(255,255,255,1)) drop-shadow(-3px 0px 0px rgba(255,255,255,1)) drop-shadow(0 15px 25px rgba(0,0,0,0.1));
        }
      `}</style>

      {/* Header */}
      <header className="pt-12 lg:pt-8 pb-6 sticky top-0 bg-[#dcc4a3]/80 backdrop-blur-xl z-40 border-b border-stone-800/10 shadow-[0_10px_30px_rgba(120,90,50,0.1)]">
        <div className="max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-6 px-6 relative z-10">
            {/* Home button: mobile only (desktop has sidebar) */}
            <Link href="/" className="lg:hidden">
              <button className="w-10 h-10 rounded-full border border-stone-800/20 bg-white/50 backdrop-blur flex items-center justify-center text-stone-800 shadow-md hover:bg-white/80 transition active:scale-95">
                <Home className="w-4 h-4" />
              </button>
            </Link>
            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-[0.3em] uppercase text-stone-900 drop-shadow-sm">MY CLOSET</h1>
              <span className="hidden lg:inline-flex text-[10px] font-bold bg-black/20 text-white px-2.5 py-1 rounded-full tracking-widest">
                {totalItems} ITEMS
              </span>
            </div>
            
            <button onClick={() => setEditMode(!editMode)} className={`w-10 h-10 rounded-full border flex items-center justify-center transition shadow-md shrink-0 ${editMode ? 'bg-red-500 border-red-600 text-white' : 'bg-white/50 backdrop-blur border-stone-800/20 text-stone-800 hover:bg-white/80'}`}>
              {editMode ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Segmented Control */}
          <div className="px-6 mb-2 relative z-10">
            <div className="flex p-1 bg-white/40 backdrop-blur-md border border-stone-800/10 rounded-full shadow-sm relative max-w-md lg:max-w-sm">
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
              >Wardrobe</button>
              <button 
                onClick={() => setActiveTab('memories')}
                className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase z-10 transition-colors ${activeTab === 'memories' ? 'text-white' : 'text-stone-700 hover:text-stone-900'}`}
              >OOTD Feeds</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-4 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WARDROBE */}
          {activeTab === 'wardrobe' && (
            <motion.div key="wardrobe" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col gap-14 mt-6">
              {displayCategories.map(category => (
                <section key={category.id} className="relative">
                  <div className="flex justify-between items-end px-6 mb-4 z-20 relative">
                    <h2 className="text-4xl font-serif italic text-stone-100 tracking-tight drop-shadow-md">{category.title}</h2>
                    <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase leading-relaxed bg-black/40 border border-white/10 px-2 py-0.5 rounded-full">
                      {String(category.items.length).padStart(2, '0')} ITEMS
                    </span>
                  </div>
                  
                  <div className="relative">
                    {/* Metal Rail */}
                    <div className="absolute top-[16px] z-0 left-0 right-0 mx-6 h-[4px] bg-gradient-to-r from-stone-700 via-stone-500 to-stone-700 shadow-[0_5px_5px_rgba(0,0,0,0.5)] rounded-full" />
                    
                    {/* ── MOBILE: Horizontal Scroll ── */}
                    {(() => {
                      const isExpanded = expandedCategories.has(category.id);
                      const visibleItems = isExpanded ? category.items : category.items.slice(0, ITEMS_PER_CATEGORY);
                      const hasMore = category.items.length > ITEMS_PER_CATEGORY;
                      return (
                        <>
                          <div className="lg:hidden flex gap-5 overflow-x-auto px-6 pt-5 pb-10 snap-x snap-mandatory relative z-10 [&::-webkit-scrollbar]:hidden items-start" style={{ scrollbarWidth: 'none' }}>
                            {visibleItems.map((item) => (
                              <MobileClothCard key={item.id} item={item} editMode={editMode}
                                pendingDeleteId={pendingDeleteId}
                                onRequestDelete={setPendingDeleteId}
                                onConfirmDelete={handleDelete}
                                onCancelDelete={() => setPendingDeleteId(null)} />
                            ))}
                            {hasMore && (
                              <div className="snap-center shrink-0 w-[100px] h-[160px] mt-[20px] flex flex-col items-center justify-center cursor-pointer group" onClick={() => toggleCategory(category.id)}>
                                <div className="w-12 h-12 rounded-full bg-black/20 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition shadow-sm">
                                  <span className="text-white/60 text-lg font-black">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase mt-3 text-center">
                                  {isExpanded ? '접기' : `+${category.items.length - ITEMS_PER_CATEGORY}개`}
                                </span>
                              </div>
                            )}
                            <AddNewCard />
                          </div>

                          {/* ── DESKTOP: Grid Layout ── */}
                          <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-6 px-6 pt-8 pb-6 relative z-10">
                            {visibleItems.map((item) => (
                              <DesktopClothCard key={item.id} item={item} editMode={editMode}
                                pendingDeleteId={pendingDeleteId}
                                onRequestDelete={setPendingDeleteId}
                                onConfirmDelete={handleDelete}
                                onCancelDelete={() => setPendingDeleteId(null)} />
                            ))}
                            <Link href="/add-clothes">
                              <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-white/40 hover:bg-white/5 transition-all">
                                <div className="w-12 h-12 rounded-full bg-black/20 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                                  <Plus className="w-6 h-6 text-white/50" />
                                </div>
                                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">ADD NEW</span>
                              </div>
                            </Link>
                            {hasMore && (
                              <button onClick={() => toggleCategory(category.id)}
                                className="aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-white/40 hover:bg-white/5 transition-all">
                                <div className="w-12 h-12 rounded-full bg-black/20 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                                  <span className="text-white/60 text-xl font-black">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">
                                  {isExpanded ? '접기' : `${category.items.length - ITEMS_PER_CATEGORY}개 더보기`}
                                </span>
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>
              ))}
            </motion.div>
          )}

          {/* TAB 2: MEMORIES / OOTD FEEDS */}
          {activeTab === 'memories' && (
            <motion.div key="memories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="px-6 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localItems.filter(i => i.categoryId === 'ootd_feed').map(memory => (
                <div key={memory.id} className="bg-white rounded-[2rem] overflow-hidden border border-stone-200 shadow-[0_15px_40px_rgba(0,0,0,0.1)] relative group">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={memory.image} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="OOTD" />
                    {pendingDeleteId === memory.id ? (
                      <div className="absolute top-4 right-4 z-20 flex gap-1">
                        <button onClick={() => handleDelete(memory.id)} className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg hover:bg-red-600 transition">삭제</button>
                        <button onClick={() => setPendingDeleteId(null)} className="bg-white text-zinc-700 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg hover:bg-zinc-100 transition">취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setPendingDeleteId(memory.id)} className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white p-2.5 rounded-full shadow-md z-20 hover:scale-110 active:scale-95">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-5 pb-6 relative z-10 bg-[#fdfdfd] border-t border-stone-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold">OOTD AI Insight</p>
                      {memory.createdAt && (
                        <p className="text-stone-300 text-[9px] font-medium">
                          {new Date(memory.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-[13px] font-extrabold text-stone-800 leading-relaxed font-sans break-keep drop-shadow-sm">
                       "{memory.name.split(':')[1] ? memory.name.split(':')[1].trim() : memory.name}"
                    </div>
                    <div className="absolute top-[-25px] right-6 bg-black text-white px-4 py-2 rounded-full font-black text-lg shadow-[0_5px_15px_rgba(0,0,0,0.3)] ring-4 ring-[#fdfdfd]">
                       {memory.name.split('점')[0]}
                    </div>
                  </div>
                </div>
              ))}
              {localItems.filter(i => i.categoryId === 'ootd_feed').length === 0 && (
                <div className="col-span-full">
                  <p className="text-stone-600/70 font-extrabold text-center mt-20 text-[13px] tracking-widest uppercase py-10 bg-white/20 rounded-xl border border-stone-500/10">
                    등록된 과거 OOTD 스크랩이 아직 없습니다.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 lg:bottom-8 right-6 z-50">
        <Link href="/add-clothes">
          <button className="w-14 h-14 bg-stone-900 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all outline-none pb-0.5 border border-stone-700">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ───── Sub Components ───── */

function MobileClothCard({ item, editMode, pendingDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete }: {
  item: ClothItem;
  editMode: boolean;
  pendingDeleteId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const isPending = pendingDeleteId === item.id;
  return (
    <div className="snap-center shrink-0 w-[150px] cursor-pointer group flex flex-col items-center relative">
      {editMode && !isPending && (
        <button onClick={() => onRequestDelete(item.id)}
          className="absolute -top-2 -right-1 z-50 bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.5)] border-[3px] border-[#dcc4a3] hover:scale-110 active:scale-90 transition-transform">
          <X className="w-5 h-5" strokeWidth={3} />
        </button>
      )}
      {isPending && (
        <div className="absolute -top-3 -right-3 z-50 flex gap-1">
          <button onClick={() => onConfirmDelete(item.id)}
            className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-[#dcc4a3] hover:bg-red-600 transition">
            삭제
          </button>
          <button onClick={onCancelDelete}
            className="bg-white text-zinc-700 text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-[#dcc4a3] hover:bg-zinc-100 transition">
            취소
          </button>
        </div>
      )}
      <div className="relative flex flex-col items-center w-[140px] transition-transform duration-500 z-10 group-hover:-translate-y-3">
        <div className="text-white/30 -mb-5 relative z-20 drop-shadow-[0_4px_2px_rgba(0,0,0,0.3)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14 l8-6 l8 6Z"/><path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/>
          </svg>
        </div>
        <div className="w-[140px] h-[160px] relative flex items-center justify-center">
          <img src={item.image} alt={item.name} loading="lazy" className="max-w-[100%] max-h-[100%] object-contain mt-2 transition-transform duration-500 group-hover:scale-[1.15] sticker-effect" draggable={false} />
        </div>
        <div className="mt-5 px-3 py-1.5 bg-white/90 backdrop-blur border border-stone-200 rounded-lg shadow-md">
          <p className="text-[9px] font-black tracking-widest text-stone-800 uppercase text-center">{item.name}</p>
        </div>
      </div>
    </div>
  );
}

function DesktopClothCard({ item, editMode, pendingDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete }: {
  item: ClothItem;
  editMode: boolean;
  pendingDeleteId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const isPending = pendingDeleteId === item.id;
  return (
    <div className="relative group cursor-pointer">
      {editMode && !isPending && (
        <button onClick={() => onRequestDelete(item.id)}
          className="absolute -top-2 -right-2 z-50 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-[#dcc4a3] hover:scale-110 active:scale-90 transition-transform">
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      )}
      {isPending && (
        <div className="absolute -top-3 -right-3 z-50 flex gap-1">
          <button onClick={() => onConfirmDelete(item.id)}
            className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-[#dcc4a3] hover:bg-red-600 transition">
            삭제
          </button>
          <button onClick={onCancelDelete}
            className="bg-white text-zinc-700 text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-[#dcc4a3] hover:bg-zinc-100 transition">
            취소
          </button>
        </div>
      )}
      <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden flex items-center justify-center p-4 transition-all duration-300 group-hover:bg-white/20 group-hover:shadow-xl group-hover:-translate-y-1">
        <img src={item.image} alt={item.name} loading="lazy" className="max-w-full max-h-full object-contain sticker-effect transition-transform duration-500 group-hover:scale-110" draggable={false} />
      </div>
      <div className="mt-3 text-center">
        <p className="text-[10px] font-black tracking-widest text-white/80 uppercase">{item.name}</p>
      </div>
    </div>
  );
}

function AddNewCard() {
  return (
    <Link href="/add-clothes">
      <div className="snap-center shrink-0 w-[140px] h-[160px] mt-[20px] flex flex-col items-center justify-start cursor-pointer group transition">
        <div className="text-white/10 mb-4 group-hover:text-white/30 transition-colors">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14 l8-6 l8 6Z"/><path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/>
          </svg>
        </div>
        <div className="w-10 h-10 rounded-full bg-black/20 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition shadow-sm">
          <Plus className="w-5 h-5 text-white/50" />
        </div>
        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase mt-4">ADD NEW</span>
      </div>
    </Link>
  );
}
