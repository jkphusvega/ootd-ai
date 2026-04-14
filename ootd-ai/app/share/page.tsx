'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, ExternalLink, Loader2, Lock, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';

export default function SharePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [previewItems, setPreviewItems] = useState<{ image_url: string; category: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);

      // 공유 설정 가져오기
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('share_id, is_public')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setShareId(profile.share_id || null);
        setIsPublic(profile.is_public || false);
      }

      // 옷장 아이템 수 및 미리보기
      const { data: clothes, count } = await supabase
        .from('clothes')
        .select('image_url, category', { count: 'exact' })
        .eq('user_id', user.id)
        .neq('category', 'ootd_feed')
        .limit(6);

      setWardrobeCount(count || 0);
      setPreviewItems(clothes || []);
      setIsLoading(false);
    };
    if (!authLoading && user) fetchData();
  }, [user, authLoading]);

  const generateShareLink = async () => {
    if (!user) return;
    setIsSaving(true);

    const newShareId = shareId || Math.random().toString(36).substring(2, 10);

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        share_id: newShareId,
        is_public: !isPublic,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      setShareId(newShareId);
      setIsPublic(!isPublic);
    } else {
      toast('설정 변경에 실패했습니다.', 'error');
    }
    setIsSaving(false);
  };

  const shareUrl = shareId ? `${typeof window !== 'undefined' ? window.location.origin : 'https://ootdai.me'}/shared/${shareId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'OOTD AI 옷장 구경하기',
        text: '내 옷장을 AI가 정리해줬어! 한번 구경해볼래?',
        url: shareUrl,
      });
    } else {
      copyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-28 lg:pb-8">
      <div className="max-w-lg mx-auto px-6 pt-14 lg:pt-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-black">옷장 공유</h1>
          <p className="text-[10px] text-zinc-400 tracking-widest uppercase mt-1">Share Wardrobe</p>
        </div>

        {/* Preview Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-zinc-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400">내 옷장 미리보기</span>
            <span className="text-[10px] font-bold text-zinc-400">{wardrobeCount}개 아이템</span>
          </div>
          {previewItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {previewItems.map((item, idx) => (
                <div key={idx} className="aspect-square bg-zinc-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-zinc-100">
                  <img src={item.image_url} alt="" className="max-w-full max-h-full object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">옷장에 아이템을 먼저 등록해주세요</p>
          )}
        </motion.div>

        {/* Share Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-zinc-200 p-6 mb-6 shadow-sm">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-black">{isPublic ? '공개 상태' : '비공개 상태'}</p>
                <p className="text-[10px] text-zinc-400">{isPublic ? '링크를 아는 누구나 볼 수 있어요' : '나만 볼 수 있습니다'}</p>
              </div>
            </div>
            <button onClick={generateShareLink} disabled={isSaving}
              className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider transition ${
                isPublic
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}>
              {isSaving ? '...' : isPublic ? '비공개로' : '공개하기'}
            </button>
          </div>

          {/* Share Link */}
          {isPublic && shareId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-zinc-100 pt-5">
              <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mb-3">공유 링크</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-100 rounded-xl px-4 py-3 text-xs text-zinc-600 font-mono truncate border border-zinc-200">
                  {shareUrl}
                </div>
                <button onClick={copyLink}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}>
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={nativeShare}
                  className="py-3 bg-black text-white rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition active:scale-95">
                  <Share2 className="w-4 h-4" /> 공유하기
                </button>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                  className="py-3 bg-zinc-100 text-zinc-800 rounded-xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-zinc-200 transition active:scale-95">
                  <ExternalLink className="w-4 h-4" /> 미리보기
                </a>
              </div>
            </motion.div>
          )}
        </motion.div>

        <p className="text-center text-[10px] text-zinc-300 font-bold tracking-widest uppercase">
          공유된 링크에서는 옷장 아이템만 보이며, 개인정보는 포함되지 않습니다
        </p>
      </div>
    </div>
  );
}
