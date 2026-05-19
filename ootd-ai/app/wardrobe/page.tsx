'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, Trash2, X, CloudSun, Sparkles, TrendingUp, TrendingDown, Star, Edit3, Link as LinkIcon, Save, Loader2, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';

interface ClothItem {
  id: string;
  image: string;
  name: string;
  purchaseUrl?: string;
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
  { id: 'bag', title: 'BAGS', items: [] },
  { id: 'accessory', title: 'ACCESSORIES', items: [] },
  { id: 'socks', title: 'SOCKS', items: [] },
];

const ITEMS_PER_CATEGORY = 8;

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'memories'>('wardrobe');
  const [editMode, setEditMode] = useState(false);
  const [localItems, setLocalItems] = useState<ClothItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedFeed, setSelectedFeed] = useState<ClothItem | null>(null);
  const [feedView, setFeedView] = useState<'grid' | 'calendar'>('grid');
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [editingItem, setEditingItem] = useState<ClothItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleItemClick = (item: ClothItem) => {
    if (editMode) return;
    setEditingItem(item);
    setEditName(item.name);
    setEditUrl(item.purchaseUrl || '');
  };

  const saveItemEdit = async () => {
    if (!editingItem || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      const { error } = await supabase.from('clothes')
        .update({ name: editName.trim(), purchase_url: editUrl.trim() || null })
        .eq('id', editingItem.id);
      if (error) throw error;
      setLocalItems(prev => prev.map(i =>
        i.id === editingItem.id ? { ...i, name: editName.trim(), purchaseUrl: editUrl.trim() || undefined } : i
      ));
      toast('정보가 저장되었습니다.', 'success');
      setEditingItem(null);
    } catch {
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

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
    const { data, error } = await supabase.from('clothes').select('id, image_url, name, purchase_url, category, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data && !error) {
      const mapped = data.map((row: { id: string; image_url: string; name: string; purchase_url?: string; category: string; created_at: string }) => ({
        id: row.id, image: row.image_url, name: row.name, purchaseUrl: row.purchase_url || undefined, categoryId: row.category, createdAt: row.created_at
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 pb-28 lg:pb-8">
        <div className="relative z-10 pt-20 max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <div className="w-40 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-14">
              <div className="flex justify-between items-end mb-6">
                <div className="w-32 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                <div className="w-20 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-5 lg:grid lg:grid-cols-5">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="shrink-0 w-[140px] lg:w-auto">
                    <div className="w-[140px] lg:w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                    <div className="mt-3 w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse mx-auto" />
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
      toast('삭제에 실패했습니다. 다시 시도해주세요.', 'error');
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-28 lg:pb-8 font-sans">
      <style>{`
        .sticker-effect {
          filter: drop-shadow(0px -3px 0px rgba(255,255,255,1)) drop-shadow(0px 3px 0px rgba(255,255,255,1)) drop-shadow(3px 0px 0px rgba(255,255,255,1)) drop-shadow(-3px 0px 0px rgba(255,255,255,1)) drop-shadow(0 15px 25px rgba(0,0,0,0.1));
        }
      `}</style>

      {/* Header */}
      <header className="pt-12 lg:pt-8 pb-6 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl z-40 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-6 px-6">
            <Link href="/" className="lg:hidden">
              <button className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition active:scale-95">
                <Home className="w-4 h-4" />
              </button>
            </Link>
            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-[0.3em] uppercase text-zinc-900 dark:text-white">MY CLOSET</h1>
              <span className="hidden lg:inline-flex text-[10px] font-bold bg-zinc-900 dark:bg-zinc-700 text-white px-2.5 py-1 rounded-full tracking-widest">
                {totalItems} ITEMS
              </span>
            </div>

            <button onClick={() => setEditMode(!editMode)} className={`w-10 h-10 rounded-full border flex items-center justify-center transition shrink-0 ${editMode ? 'bg-red-500 border-red-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'}`}>
              {editMode ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Segmented Control */}
          <div className="px-6 mb-2 flex justify-center">
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full relative w-full max-w-xs">
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-900 dark:bg-white rounded-full z-0 shadow-sm"
                initial={false}
                animate={{ x: activeTab === 'wardrobe' ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setActiveTab('wardrobe')}
                className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase z-10 transition-colors ${activeTab === 'wardrobe' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >Wardrobe</button>
              <button
                onClick={() => setActiveTab('memories')}
                className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase z-10 transition-colors ${activeTab === 'memories' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >OOTD Feeds</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-4 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WARDROBE */}
          {activeTab === 'wardrobe' && (
            <motion.div key="wardrobe" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col gap-14 mt-6">

              {/* 빈 옷장 온보딩 메시지 */}
              {totalItems === 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="mx-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center text-center gap-4">
                  <div className="text-4xl">👗</div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">아직 옷장이 비어있어요</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      옷을 등록할수록 AI 코디 추천이 정확해져요.<br />
                      전신샷 한 장이면 AI가 옷을 자동으로 분리해서 등록해줘요.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Link href="/add-clothes">
                      <button className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-extrabold text-xs tracking-widest uppercase shadow-lg hover:opacity-80 transition flex items-center justify-center gap-2">
                        <span>✨</span> AI로 옷 등록하기
                      </button>
                    </Link>
                    <p className="text-[10px] text-zinc-400">전신샷 1장 → AI가 아이템별로 자동 분리</p>
                  </div>
                </motion.div>
              )}

              {displayCategories.map(category => (
                <section key={category.id} className="relative">
                  <div className="flex justify-between items-end px-6 mb-4">
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{category.title}</h2>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
                      {String(category.items.length).padStart(2, '0')} ITEMS
                    </span>
                  </div>

                  <div className="relative">
                    
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
                                onCancelDelete={() => setPendingDeleteId(null)}
                                onClick={() => handleItemClick(item)} />
                            ))}
                            {hasMore && (
                              <div className="snap-center shrink-0 w-[100px] h-[160px] mt-[20px] flex flex-col items-center justify-center cursor-pointer group" onClick={() => toggleCategory(category.id)}>
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition">
                                  <span className="text-zinc-500 text-lg font-black">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase mt-3 text-center">
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
                                onCancelDelete={() => setPendingDeleteId(null)}
                                onClick={() => handleItemClick(item)} />
                            ))}
                            <Link href="/add-clothes">
                              <div className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition">
                                  <Plus className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">ADD NEW</span>
                              </div>
                            </Link>
                            {hasMore && (
                              <button onClick={() => toggleCategory(category.id)}
                                className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition">
                                  <span className="text-zinc-500 text-xl font-black">{isExpanded ? '−' : '+'}</span>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
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

          {/* TAB 2: OOTD FEEDS */}
          {activeTab === 'memories' && (() => {
            const feedItems = localItems.filter(i => i.categoryId === 'ootd_feed');

            // date → first item of that day
            const dateMap: Record<string, ClothItem> = {};
            feedItems.forEach(item => {
              if (!item.createdAt) return;
              const key = item.createdAt.slice(0, 10);
              if (!dateMap[key]) dateMap[key] = item;
            });

            // calendar helpers
            const { year, month } = calMonth;
            const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
            const DOW = ['일','월','화','수','목','금','토'];
            const firstDow = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const todayStr = new Date().toISOString().slice(0, 10);
            const cells: (number | null)[] = [
              ...Array(firstDow).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];
            while (cells.length % 7 !== 0) cells.push(null);
            const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

            return (
              <motion.div key="memories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }} className="mt-4">

                {/* View toggle */}
                <div className="flex items-center justify-between px-6 mb-4">
                  <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">
                    {feedItems.length} OOTD 기록
                  </span>
                  <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl gap-0.5">
                    <button onClick={() => setFeedView('grid')}
                      className={`p-2 rounded-lg transition ${feedView === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setFeedView('calendar')}
                      className={`p-2 rounded-lg transition ${feedView === 'calendar' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* GRID VIEW */}
                {feedView === 'grid' && (
                  <div className="px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {feedItems.map(memory => {
                      let parsed: { score?: number; headline?: string; summary?: string } = {};
                      try { parsed = JSON.parse(memory.name); } catch {
                        const s = memory.name.split(':');
                        parsed = { score: parseInt(s[0]), summary: s[1]?.trim() };
                      }
                      const displaySummary = parsed.headline || parsed.summary;
                      return (
                        <motion.div key={memory.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedFeed(memory)}
                          className="relative group cursor-pointer rounded-[1.5rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-zinc-200 dark:border-zinc-800">
                          <div className="aspect-[3/4] relative">
                            <img src={memory.image} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="OOTD" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            {pendingDeleteId === memory.id ? (
                              <div className="absolute top-3 right-3 z-20 flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleDelete(memory.id)} className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-lg">삭제</button>
                                <button onClick={() => setPendingDeleteId(null)} className="bg-white text-zinc-700 text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-lg">취소</button>
                              </div>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); setPendingDeleteId(memory.id); }}
                                className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white p-2 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {parsed.score != null && (
                              <div className="absolute top-3 left-3 bg-black text-white px-2.5 py-1 rounded-full font-black text-sm shadow-lg">
                                {parsed.score}
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3 right-3">
                              {memory.createdAt && (
                                <p className="text-white/60 text-[9px] font-bold tracking-widest uppercase mb-1">
                                  {new Date(memory.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                              {displaySummary && (
                                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">"{displaySummary}"</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {feedItems.length === 0 && (
                      <div className="col-span-full">
                        <p className="text-zinc-400 font-extrabold text-center mt-20 text-[13px] tracking-widest uppercase py-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          저장된 OOTD가 없습니다
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* CALENDAR VIEW */}
                {feedView === 'calendar' && (
                  <div className="px-4">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-4 px-2">
                      <button onClick={() => setCalMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                        <ChevronLeft className="w-4 h-4 text-zinc-500" />
                      </button>
                      <span className="text-sm font-black text-zinc-900 dark:text-white">{year}년 {MONTH_NAMES[month]}</span>
                      <button onClick={() => setCalMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>

                    {/* DOW header */}
                    <div className="grid grid-cols-7 mb-1">
                      {DOW.map((d, i) => (
                        <div key={d} className={`text-center text-[10px] font-extrabold tracking-widest py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-400'}`}>{d}</div>
                      ))}
                    </div>

                    {/* Weeks */}
                    <div className="flex flex-col gap-1">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => {
                            if (!day) return <div key={di} />;
                            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const item = dateMap[dateKey];
                            const isToday = dateKey === todayStr;
                            let parsed: { score?: number } = {};
                            if (item) { try { parsed = JSON.parse(item.name); } catch {} }
                            return (
                              <div key={di}
                                onClick={() => item && setSelectedFeed(item)}
                                className={`relative aspect-square rounded-xl overflow-hidden transition-all ${item ? 'cursor-pointer hover:scale-105 shadow-sm' : ''} ${isToday && !item ? 'ring-2 ring-zinc-300 dark:ring-zinc-600' : ''}`}>
                                {item ? (
                                  <>
                                    <img src={item.image} alt="OOTD" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {parsed.score != null && (
                                      <span className="absolute bottom-1 left-0 right-0 text-center text-white font-black text-[9px] leading-none">{parsed.score}</span>
                                    )}
                                    {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />}
                                  </>
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center rounded-xl ${isToday ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
                                    <span className={`text-[11px] font-bold ${isToday ? 'text-white dark:text-zinc-900' : di === 0 ? 'text-red-300' : di === 6 ? 'text-blue-300' : 'text-zinc-400'}`}>{day}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <p className="text-center text-[10px] text-zinc-400 font-medium mt-5 mb-4">사진이 있는 날을 탭하면 분석 내용을 볼 수 있어요</p>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 lg:bottom-8 right-6 z-50">
        <Link href="/add-clothes">
          <button className="w-14 h-14 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all outline-none">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </Link>
      </div>

      {/* ── Feed Detail Modal ── */}
      <AnimatePresence>
        {selectedFeed && (() => {
          type FeedData = {
            score?: number; fit?: number; color?: number; styling?: number; weather?: number;
            headline?: string; summary?: string;
            strengths?: string[]; improvements?: string[]; tips?: string[]; weatherNote?: string;
          };
          let c: FeedData = {};
          try { c = JSON.parse(selectedFeed.name); } catch {
            const s = selectedFeed.name.split(':');
            c = { score: parseInt(s[0]), summary: s[1]?.trim() };
          }
          const headline = c.headline || c.summary;
          const breakdown = [
            { label: '핏·실루엣', val: c.fit },
            { label: '컬러 조합', val: c.color },
            { label: '스타일링', val: c.styling },
            { label: '날씨 적합', val: c.weather },
          ];
          const barCol = (v?: number) => v == null ? '#d4d4d8' : v >= 80 ? '#22c55e' : v >= 60 ? '#eab308' : '#ef4444';
          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedFeed(null)} />
              <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-lg lg:rounded-[2rem] lg:max-h-[80vh]">
                <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 shrink-0 lg:hidden" />
                <div className="flex-1 overflow-y-auto px-6 pb-10 lg:pt-8 [&::-webkit-scrollbar]:hidden">
                  {/* 이미지 + 점수 */}
                  <div className="relative mt-4 rounded-2xl overflow-hidden aspect-[3/2] mb-5">
                    <img src={selectedFeed.image} alt="OOTD" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {c.score != null && (
                      <div className="absolute bottom-4 left-4 flex items-end gap-2">
                        <span className="text-white font-black text-4xl leading-none">{c.score}</span>
                        <span className="text-white/70 font-bold text-sm mb-1">/ 100</span>
                      </div>
                    )}
                    {selectedFeed.createdAt && (
                      <span className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                        {new Date(selectedFeed.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <button onClick={() => setSelectedFeed(null)}
                      className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white p-2 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 헤드라인 */}
                  {headline && (
                    <div className="mb-4">
                      <p className="text-[9px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">AI Stylist Verdict</p>
                      <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-snug break-keep">"{headline}"</h2>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {/* Score Breakdown */}
                    {breakdown.some(b => b.val != null) && (
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4">
                        <span className="text-[9px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-3">Score Breakdown</span>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                          {breakdown.map(({ label, val }) => (
                            <div key={label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-bold text-zinc-500">{label}</span>
                                <span className="text-[10px] font-extrabold" style={{ color: barCol(val) }}>{val ?? '—'}</span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: barCol(val), width: val != null ? `${val}%` : '0%' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 잘된 점 */}
                    {c.strengths?.length ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[9px] font-extrabold tracking-widest text-emerald-600 uppercase">잘된 점</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {c.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400 shrink-0 text-sm">✓</span>
                              <span className="text-[12px] text-emerald-900 dark:text-emerald-200 font-medium leading-snug">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* 개선점 */}
                    {c.improvements?.length ? (
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[9px] font-extrabold tracking-widest text-amber-600 uppercase">개선점</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {c.improvements.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400 shrink-0 text-sm">→</span>
                              <span className="text-[12px] text-amber-900 dark:text-amber-200 font-medium leading-snug">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Stylist Tips */}
                    {c.tips?.length ? (
                      <div className="bg-zinc-900 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-[9px] font-extrabold tracking-widest text-white uppercase">Stylist Tips</span>
                        </div>
                        <ol className="flex flex-col gap-2.5">
                          {c.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-[10px] font-black text-yellow-300">{i + 1}</span>
                              <span className="text-[12px] text-zinc-200 font-medium leading-snug">{tip}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {/* 날씨 코멘트 */}
                    {c.weatherNote && (
                      <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900">
                        <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center shrink-0 mt-0.5">
                          <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold tracking-widest text-sky-400 uppercase block mb-0.5">날씨 적합성</span>
                          <p className="text-[12px] text-sky-800 dark:text-sky-200 font-medium leading-relaxed">{c.weatherNote}</p>
                        </div>
                      </div>
                    )}

                    {/* Legacy fallback: old format had no detailed fields */}
                    {!headline && !c.strengths?.length && !c.tips?.length && (
                      <p className="text-center text-zinc-400 text-xs py-6">분석 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
      
      {/* ── Item Edit Modal ── */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => !isSavingEdit && setEditingItem(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50 bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-2xl overflow-hidden">
              <div className="absolute top-4 right-4">
                <button onClick={() => !isSavingEdit && setEditingItem(null)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-black mb-6 text-zinc-900 dark:text-white">아이템 정보 수정</h3>
              
              <div className="w-32 h-32 mx-auto mb-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-2">
                <img src={editingItem.image} alt="item preview" className="max-w-full max-h-full object-contain sticker-effect" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                    <Edit3 className="w-3 h-3" />
                    아이템 이름
                  </label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} disabled={isSavingEdit}
                    placeholder="예: 검정 와이드 슬랙스"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" />
                    구매 링크 (선택)
                  </label>
                  <input type="url" value={editUrl} onChange={e => setEditUrl(e.target.value)} disabled={isSavingEdit}
                    placeholder="https://..."
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition" />
                  <p className="text-[10px] text-zinc-500 mt-1.5">나중에 옷장을 공유할 때, 다른 사람이 이 링크로 옷을 구매할 수 있습니다.</p>
                </div>
              </div>

              <button onClick={saveItemEdit} disabled={isSavingEdit || !editName.trim()}
                className="mt-8 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black text-sm tracking-widest flex justify-center items-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-50">
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                저장하기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Sub Components ───── */

function MobileClothCard({ item, editMode, pendingDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete, onClick }: {
  item: ClothItem;
  editMode: boolean;
  pendingDeleteId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onClick?: () => void;
}) {
  const isPending = pendingDeleteId === item.id;
  
  const parsedName = useMemo(() => {
    try {
      return JSON.parse(item.name).n || item.name;
    } catch {
      return item.name;
    }
  }, [item.name]);
  return (
    <div className="snap-center shrink-0 w-[150px] cursor-pointer group flex flex-col items-center relative">
      {editMode && !isPending && (
        <button onClick={() => onRequestDelete(item.id)}
          className="absolute -top-2 -right-1 z-50 bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.5)] border-[3px] border-white dark:border-zinc-950 hover:scale-110 active:scale-90 transition-transform">
          <X className="w-5 h-5" strokeWidth={3} />
        </button>
      )}
      {isPending && (
        <div className="absolute -top-3 -right-3 z-50 flex gap-1">
          <button onClick={() => onConfirmDelete(item.id)}
            className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-950 hover:bg-red-600 transition">
            삭제
          </button>
          <button onClick={onCancelDelete}
            className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-950 hover:bg-zinc-100 transition">
            취소
          </button>
        </div>
      )}
      <div className="relative flex flex-col items-center w-[140px] transition-transform duration-500 z-10 group-hover:-translate-y-3" onClick={() => !editMode && onClick?.()}>
        <div className="w-[140px] h-[160px] relative flex items-center justify-center">
          <img src={item.image} alt={parsedName} loading="lazy" className="max-w-[100%] max-h-[100%] object-contain transition-transform duration-500 group-hover:scale-[1.15] sticker-effect" draggable={false} />
        </div>
        <div className="mt-3 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <p className="text-[9px] font-black tracking-widest text-zinc-800 dark:text-zinc-200 uppercase text-center truncate max-w-[120px]">{parsedName}</p>
        </div>
      </div>
    </div>
  );
}

function DesktopClothCard({ item, editMode, pendingDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete, onClick }: {
  item: ClothItem;
  editMode: boolean;
  pendingDeleteId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onClick?: () => void;
}) {
  const isPending = pendingDeleteId === item.id;

  const parsedName = useMemo(() => {
    try {
      return JSON.parse(item.name).n || item.name;
    } catch {
      return item.name;
    }
  }, [item.name]);
  return (
    <div className="relative group cursor-pointer">
      {editMode && !isPending && (
        <button onClick={() => onRequestDelete(item.id)}
          className="absolute -top-2 -right-2 z-50 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-950 hover:scale-110 active:scale-90 transition-transform">
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      )}
      {isPending && (
        <div className="absolute -top-3 -right-3 z-50 flex gap-1">
          <button onClick={() => onConfirmDelete(item.id)}
            className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-950 hover:bg-red-600 transition">
            삭제
          </button>
          <button onClick={onCancelDelete}
            className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-950 hover:bg-zinc-100 transition">
            취소
          </button>
        </div>
      )}
      <div className="aspect-square bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center p-4 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1" onClick={() => !editMode && onClick?.()}>
        <img src={item.image} alt={parsedName} loading="lazy" className="max-w-full max-h-full object-contain sticker-effect transition-transform duration-500 group-hover:scale-110" draggable={false} />
      </div>
      <div className="mt-3 text-center">
        <p className="text-[10px] font-black tracking-widest text-zinc-700 dark:text-zinc-300 uppercase truncate max-w-full px-2">{parsedName}</p>
      </div>
    </div>
  );
}

function AddNewCard() {
  return (
    <Link href="/add-clothes">
      <div className="snap-center shrink-0 w-[140px] h-[160px] flex flex-col items-center justify-center cursor-pointer group transition gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition shadow-sm">
          <Plus className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        </div>
        <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">ADD NEW</span>
      </div>
    </Link>
  );
}
