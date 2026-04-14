'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  name?: string;
  color?: string;
}

interface PublicProfile {
  nickname: string;
  style_moods: string[];
  wardrobe: WardrobeItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

export default function SharedWardrobeClient({ shareId }: { shareId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchSharedWardrobe = async () => {
      setIsLoading(true);

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, nickname, style_moods, is_public')
        .eq('share_id', shareId)
        .single();

      if (!profileData || !profileData.is_public) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: clothes } = await supabase
        .from('clothes')
        .select('id, image_url, category, name, color')
        .eq('user_id', profileData.user_id)
        .neq('category', 'ootd_feed')
        .order('created_at', { ascending: false })
        .limit(48);

      setProfile({
        nickname: profileData.nickname || 'OOTD User',
        style_moods: profileData.style_moods || [],
        wardrobe: clothes || [],
      });
      setIsLoading(false);
    };

    fetchSharedWardrobe();
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse" />
          <div className="w-24 h-2.5 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-white/30" />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-2">비공개 옷장이에요</h1>
        <p className="text-sm text-white/40 mb-10">이 링크는 더 이상 유효하지 않거나 비공개로 변경됐어요.</p>
        <Link href="/">
          <button className="px-6 py-3 bg-white text-black text-[11px] font-extrabold tracking-widest uppercase rounded-full hover:bg-zinc-100 transition">
            OOTD AI 시작하기
          </button>
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const grouped = profile.wardrobe.reduce<Record<string, WardrobeItem[]>>((acc, item) => {
    const cat = item.category || 'etc';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryOrder = ['outer', 'top', 'bottom', 'shoes', 'bag', 'accessory'];
  const sortedCategories = [
    ...categoryOrder.filter(c => grouped[c]),
    ...Object.keys(grouped).filter(c => !categoryOrder.includes(c)),
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0f] font-sans text-white pb-24">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src="/logo.png" alt="OOTD AI" className="h-6 w-auto object-contain invert" />
          <Link href="/login">
            <button className="px-4 py-2 bg-white text-black text-[10px] font-extrabold tracking-widest uppercase rounded-full hover:bg-zinc-100 transition active:scale-95">
              나도 시작하기
            </button>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Shirt className="w-6 h-6 text-white/50" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{profile.nickname}님의 옷장</h1>
              <p className="text-[11px] text-white/30 font-bold tracking-widest uppercase mt-0.5">
                {profile.wardrobe.length}개 아이템
              </p>
            </div>
          </div>

          {profile.style_moods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.style_moods.map((mood) => (
                <span key={mood}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-wider text-white/50">
                  {mood}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Wardrobe Grid by Category */}
        {profile.wardrobe.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">아직 옷장이 비어있어요</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedCategories.map((cat, catIdx) => (
              <motion.section
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/30">
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                  <span className="text-[10px] text-white/15 font-bold">{grouped[cat].length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {grouped[cat].map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: catIdx * 0.08 + idx * 0.04 }}
                      className="aspect-square bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden flex items-center justify-center p-3 hover:bg-white/[0.08] transition group"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name || item.category}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}

        {/* CTA Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-white/60" />
          </div>
          <h2 className="text-lg font-extrabold mb-2">나도 AI 스타일리스트 써볼까?</h2>
          <p className="text-sm text-white/40 mb-6">옷장 등록부터 매일 코디 추천까지, 무료로 시작해요.</p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-[11px] font-extrabold tracking-widest uppercase rounded-2xl hover:bg-zinc-100 transition"
            >
              무료로 시작하기 <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
