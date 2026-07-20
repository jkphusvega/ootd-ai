'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Pencil, Package, Sparkles } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';
import { useRotatingMessage } from '../../hooks/useRotatingMessage';

const CATEGORY_LABELS: Record<string, string> = {
  outer: '아우터', tops: '상의', bottoms: '하의', shoes: '신발',
  socks: '양말', bag: '가방', accessory: '액세서리',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  outer: '🧥', tops: '👕', bottoms: '👖', shoes: '👟',
  socks: '🧦', bag: '👜', accessory: '⌚',
};

const PARSING_MESSAGES = [
  '주문내역에서 아이템을 찾는 중이에요...',
  '쇼핑 목록을 꼼꼼히 읽는 중...',
  '어떤 옷들을 주문했는지 확인하는 중...',
  'AI가 아이템을 분류하고 있어요...',
] as const;

interface ParsedItem {
  id: string;
  brand: string;
  productName: string;
  name: string;
  category: string;
  included: boolean;
}

type Step = 'upload' | 'parsing' | 'confirm';

export default function AddFromOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const [step, setStep] = useState<Step>('upload');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [parsingMsg, parsingMsgIdx] = useRotatingMessage(PARSING_MESSAGES);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setScreenshot(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!screenshot) return;
    setStep('parsing');
    try {
      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: screenshot }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '파싱 실패');
      }
      const data = await res.json();
      if (!data.items?.length) throw new Error('주문 내역에서 아이템을 찾지 못했어요.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(data.items.map((item: any) => ({
        id: Math.random().toString(36).slice(2),
        brand: item.brand || '',
        productName: item.productName || '',
        name: item.koreanName || item.productName || '',
        category: item.category || 'tops',
        included: true,
      })));
      setStep('confirm');
    } catch (e) {
      toast(e instanceof Error ? e.message : '파싱 중 오류가 발생했어요.', 'error');
      setStep('upload');
    }
  };

  const commitEdit = () => {
    if (!editingId) return;
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: editingName.trim() || i.name } : i));
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!user) return;
    const toSave = items.filter(i => i.included);
    if (toSave.length === 0) { toast('저장할 아이템을 선택해주세요.', 'error'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('clothes').insert(
        toSave.map(item => ({
          category: item.category,
          name: item.name,
          image_url: '',
          user_id: user.id,
        }))
      );
      if (error) throw error;
      toast(`${toSave.length}개 아이템이 옷장에 등록됐어요!`, 'success');
      router.push('/wardrobe');
    } catch (e) {
      toast(e instanceof Error ? e.message : '저장 중 오류가 발생했어요.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = items.filter(i => i.included).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0f]">
      <AnimatePresence mode="wait">

        {/* ── UPLOAD ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col px-5 pt-14 pb-10 max-w-md mx-auto min-h-screen">
            <button onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-8">
              <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>

            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1">주문내역으로 등록</h1>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              무신사, 29CM 등 주문내역 스크린샷을 올리면<br />AI가 아이템을 자동으로 옷장에 등록해요
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex-1 min-h-[360px] rounded-3xl border-2 overflow-hidden cursor-pointer transition-all ${
                screenshot
                  ? 'border-zinc-200 dark:border-zinc-700 shadow-lg'
                  : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400'
              }`}
            >
              {screenshot ? (
                <img src={screenshot} alt="주문내역 스크린샷" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <Package className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-zinc-500">주문내역 스크린샷을 올려주세요</p>
                  <p className="text-xs text-zinc-400 text-center leading-relaxed">
                    앱에서 주문내역 화면을 캡처한 뒤<br />여기에 올려주세요
                  </p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {screenshot && (
              <button onClick={() => { setScreenshot(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="mt-3 text-xs text-zinc-400 underline text-center">
                다른 사진 선택
              </button>
            )}

            <button
              onClick={handleParse}
              disabled={!screenshot}
              className="mt-5 w-full py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg disabled:opacity-30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> AI 파싱 시작
            </button>
          </motion.div>
        )}

        {/* ── PARSING ── */}
        {step === 'parsing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center gap-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full" />
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={parsingMsgIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-bold text-zinc-700 dark:text-zinc-300"
                >
                  {parsingMsg}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col px-5 pt-14 pb-36 max-w-md mx-auto">

            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('upload')}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <div>
                <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">파싱 완료</h1>
                <p className="text-xs text-zinc-400">{selectedCount}/{items.length}개 선택됨</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">이름을 탭해서 수정하고, 필요 없는 항목은 체크를 해제하세요</p>

            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                    item.included
                      ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                      : 'bg-zinc-50/40 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-900 opacity-40'
                  }`}
                >
                  {/* 카테고리 아이콘 */}
                  <div className="w-14 h-14 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl">
                    {CATEGORY_EMOJIS[item.category] || '👕'}
                  </div>

                  {/* 이름 + 카테고리 + 원래 상품명 */}
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          className="flex-1 text-sm font-bold bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 outline-none min-w-0"
                        />
                        <button onClick={commitEdit}
                          className="w-6 h-6 flex items-center justify-center bg-black rounded-full shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                        className="flex items-center gap-1.5 text-left w-full group">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.name}</span>
                        <Pencil className="w-3 h-3 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    )}
                    <select
                      value={item.category}
                      onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                      className="mt-0.5 text-[11px] font-bold text-zinc-500 bg-transparent border-none outline-none cursor-pointer"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.brand} · {item.productName}</p>
                  </div>

                  {/* 체크박스 */}
                  <button
                    onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, included: !i.included } : i))}
                    className={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 border-2 transition-all ${
                      item.included
                        ? 'bg-black dark:bg-white border-black dark:border-white'
                        : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {item.included && <Check className="w-3.5 h-3.5 text-white dark:text-black" />}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* 이미지 없음 안내 */}
            <p className="text-[10px] text-zinc-400 text-center mt-4 leading-relaxed">
              이미지 없이 등록됩니다. 옷장에서 실물 사진을 추가할 수 있어요.
            </p>

            {/* 저장 버튼 */}
            <div
              className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0c0c0f]/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800"
              style={{ paddingTop: '1.25rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedCount === 0}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> 저장 중...</>
                  ) : (
                    <><Check className="w-4 h-4" /> {selectedCount}개 옷장에 등록하기</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
