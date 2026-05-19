'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { Sparkles, ImagePlus, ChevronLeft, Check, X, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';
import { logEvent } from '../../lib/analytics';

interface ExtractedItem {
  id: string;
  category: string;
  image: string;
  name: string;
  nameLoading: boolean;
}

interface FailedItem {
  id: string;
  category: string;
  y_start: number;
  y_end: number;
}

interface ExtractionStrategy {
  name: string;
  maxDim: number;
  padding: number;
  xExpand: number;
  yExpand: number;
  enhanceContrast: boolean;
  brightnessBoost: number;
}

const STRATEGIES: ExtractionStrategy[] = [
  { name: '기본',   maxDim: 512, padding: 0.08, xExpand: 0,    yExpand: 0,    enhanceContrast: false, brightnessBoost: 0 },
  { name: '경량',   maxDim: 384, padding: 0.06, xExpand: 0,    yExpand: 0,    enhanceContrast: false, brightnessBoost: 0 },
  { name: '대비강화', maxDim: 512, padding: 0.10, xExpand: 0.05, yExpand: 0.03, enhanceContrast: true,  brightnessBoost: 25 },
  { name: '넓게',   maxDim: 448, padding: 0.15, xExpand: 0.10, yExpand: 0.05, enhanceContrast: true,  brightnessBoost: 15 },
];

const CATEGORY_LABELS: Record<string, string> = {
  outer: '아우터', tops: '상의', bottoms: '하의', shoes: '신발', socks: '양말',
  bag: '가방', accessory: '액세서리',
};

type Step = 'upload' | 'extracting' | 'confirm';

export default function AddClothesPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [base64Original, setBase64Original] = useState<string | null>(null);
  const [resultItems, setResultItems] = useState<ExtractedItem[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [stickerMode] = useState(true);

  // 단계별 진행 상태
  const [extractPhase, setExtractPhase] = useState<1 | 2 | 3>(1);
  const [extractCurrent, setExtractCurrent] = useState(0);
  const [extractTotal, setExtractTotal] = useState(0);

  // ── 유틸 ──
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX = 600;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
          else { if (h > MAX) { w *= MAX / h; h = MAX; } }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', 0.9));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });

  const getSegmentedBlob = (
    imgSrc: string, xmin: number, ymin: number, xmax: number, ymax: number,
    strategy: ExtractionStrategy
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const pxX = xmin * img.width, pxY = ymin * img.height;
        const pxW = (xmax - xmin) * img.width, pxH = (ymax - ymin) * img.height;
        const padX = pxW * strategy.padding, padY = pxH * strategy.padding;
        const fx = Math.max(0, pxX - padX), fy = Math.max(0, pxY - padY);
        const fw = Math.min(img.width - fx, pxW + padX * 2);
        const fh = Math.min(img.height - fy, pxH + padY * 2);
        let ow = fw, oh = fh;
        if (ow > oh) { if (ow > strategy.maxDim) { oh *= strategy.maxDim / ow; ow = strategy.maxDim; } }
        else { if (oh > strategy.maxDim) { ow *= strategy.maxDim / oh; oh = strategy.maxDim; } }
        const canvas = document.createElement('canvas');
        canvas.width = ow; canvas.height = oh;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('no ctx');
        ctx.drawImage(img, fx, fy, fw, fh, 0, 0, ow, oh);
        if (strategy.enhanceContrast) {
          const d = ctx.getImageData(0, 0, ow, oh);
          for (let i = 0; i < d.data.length; i += 4) {
            d.data[i]   = Math.min(255, Math.max(0, (d.data[i]   - 128) * 1.3 + 128 + strategy.brightnessBoost));
            d.data[i+1] = Math.min(255, Math.max(0, (d.data[i+1] - 128) * 1.3 + 128 + strategy.brightnessBoost));
            d.data[i+2] = Math.min(255, Math.max(0, (d.data[i+2] - 128) * 1.3 + 128 + strategy.brightnessBoost));
          }
          ctx.putImageData(d, 0, 0);
        }
        canvas.toBlob(b => b ? resolve(b) : reject('blob fail'), 'image/png');
      };
      img.onerror = reject;
      img.src = imgSrc;
    });

  const extractSingleItem = async (
    imgSrc: string, category: string, y_start: number, y_end: number
  ): Promise<string> => {
    let xmin = 0.05, xmax = 0.95;
    const cat = category.toLowerCase();
    if (cat.includes('bottom')) { xmin = 0.10; xmax = 0.90; }
    else if (cat.includes('shoe')) { xmin = 0.15; xmax = 0.85; }
    let ymin = y_start, ymax = y_end;
    if (cat.includes('top') || cat.includes('outer')) ymin = Math.max(ymin, 0.12);
    else if (cat.includes('bottom')) ymin = Math.max(ymin, 0.35);
    else if (cat.includes('shoe')) ymin = Math.max(ymin, 0.80);

    // 기본 크롭 먼저 확보 (배경제거 실패 시 fallback용)
    const baseStrategy = STRATEGIES[0];
    let fallbackCropped: string | null = null;
    try {
      const cropped = await getSegmentedBlob(imgSrc, xmin, ymin, xmax, ymax, baseStrategy);
      fallbackCropped = await blobToBase64(cropped);
    } catch { /* fallback 없이 진행 */ }

    for (let s = 0; s < STRATEGIES.length; s++) {
      const strategy = STRATEGIES[s];
      try {
        const sXmin = Math.max(0, xmin - strategy.xExpand);
        const sXmax = Math.min(1, xmax + strategy.xExpand);
        const sYmin = Math.max(0, ymin - strategy.yExpand);
        const sYmax = Math.min(1, ymax + strategy.yExpand);
        const cropped = await getSegmentedBlob(imgSrc, sXmin, sYmin, sXmax, sYmax, strategy);
        const removed = await Promise.race([
          removeBackground(cropped),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
        ]);
        return await blobToBase64(removed);
      } catch {
        if (s < STRATEGIES.length - 1) await new Promise(r => setTimeout(r, 500));
      }
    }

    // 배경제거 모두 실패 → 크롭 이미지라도 반환
    if (fallbackCropped) return fallbackCropped;
    throw new Error('추출 실패');
  };

  const handleScan = async () => {
    if (!originalImage || !base64Original) return;
    setStep('extracting');
    setResultItems([]);
    setFailedCount(0);
    setExtractPhase(1);
    setExtractCurrent(0);
    setExtractTotal(0);

    try {
      // Phase 1: segment API
      const res = await fetch('/api/segment-clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Original }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '분석 실패');
      }
      const data = await res.json();
      if (!data.items?.length) throw new Error('옷을 찾지 못했어요. 정면 전신샷으로 다시 시도해보세요.');

      const total = data.items.length;
      const newItems: ExtractedItem[] = [];
      let failed = 0;

      // Phase 2: background removal per item
      setExtractPhase(2);
      setExtractTotal(total);
      setExtractCurrent(0);

      for (let i = 0; i < total; i++) {
        const item = data.items[i];
        try {
          const image = await extractSingleItem(originalImage, item.category, item.y_start, item.y_end);
          const id = Math.random().toString(36).slice(2);
          newItems.push({ id, category: item.category, image, name: CATEGORY_LABELS[item.category] || item.category, nameLoading: true });
        } catch {
          failed++;
          setFailedCount(failed);
        }
        setExtractCurrent(i + 1);
      }

      if (newItems.length === 0) {
        toast('추출된 옷이 없어요. 다른 사진으로 시도해보세요.', 'error');
        setStep('upload');
        return;
      }

      // Phase 3: AI naming (awaited)
      setExtractPhase(3);
      setExtractTotal(newItems.length);
      setExtractCurrent(0);

      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        try {
          const res = await fetch('/api/name-clothes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: item.image, category: item.category }),
          });
          if (res.ok) {
            const nameData = await res.json();
            item.name = nameData.name || CATEGORY_LABELS[item.category] || item.category;
          }
        } catch {
          item.name = CATEGORY_LABELS[item.category] || item.category;
        }
        item.nameLoading = false;
        setExtractCurrent(i + 1);
      }

      setResultItems(newItems);
      setStep('confirm');
    } catch (e) {
      toast(e instanceof Error ? e.message : '오류가 발생했어요.', 'error');
      setStep('upload');
    }
  };

  const handleSave = async () => {
    if (!user || resultItems.length === 0) return;
    setIsSaving(true);
    try {
      for (const item of resultItems) {
        const res = await fetch(item.image);
        if (!res.ok) throw new Error(`이미지 로드 실패: ${res.statusText}`);
        const blob = await res.blob();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error: uploadErr } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: 'image/webp' });
        if (uploadErr) throw new Error(uploadErr.message);
        const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);
        const { error: dbErr } = await supabase.from('clothes').insert({
          category: item.category,
          name: item.name,
          image_url: publicUrl,
          user_id: user.id,
        });
        if (dbErr) throw new Error(dbErr.message);
      }
      logEvent(user.id, 'clothes_added', { count: resultItems.length, pipeline: 'auto' });
      router.push('/wardrobe');
    } catch (e) {
      toast(e instanceof Error ? e.message : '저장 중 오류가 발생했어요.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 이미지 업로드 — API 전송용은 최대 1024px로 리사이즈 (Vercel 4.5MB 한도)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage);
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
    const img = new Image();
    img.onload = () => {
      const MAX = 1024;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      setBase64Original(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = objectUrl;
  };

  // sessionStorage 자동 시작 (OOTD → AI 추출 연동)
  useEffect(() => {
    let mounted = true;
    const transferImage = sessionStorage.getItem('ootd_transfer_image');
    const autoStart = sessionStorage.getItem('ootd_auto_start');
    if (transferImage) {
      setBase64Original(transferImage);
      fetch(transferImage)
        .then(r => {
          if (!r.ok) throw new Error('fetch failed');
          return r.blob();
        })
        .then(blob => {
          if (!mounted) return;
          setOriginalImage(URL.createObjectURL(blob));
          sessionStorage.removeItem('ootd_transfer_image');
          if (autoStart === 'true') sessionStorage.removeItem('ootd_auto_start');
        })
        .catch(e => console.error('[add-clothes] sessionStorage transfer failed:', e));
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return () => { if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage); };
  }, [originalImage]);

  // ── 인라인 이름 편집 ──
  const startEdit = (item: ExtractedItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };
  const commitEdit = () => {
    if (editingId && editingName.trim()) {
      setResultItems(prev => prev.map(i => i.id === editingId ? { ...i, name: editingName.trim() } : i));
    }
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0f] font-sans">
      <style>{`
        .sticker { filter: drop-shadow(0 0 0 3px white) drop-shadow(0 8px 16px rgba(0,0,0,0.12)); }
      `}</style>

      <AnimatePresence mode="wait">

        {/* ── STEP: UPLOAD ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col px-5 pt-14 pb-10 max-w-md mx-auto">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-8">
              <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>

            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1">AI 옷 스캐너</h1>
            <p className="text-sm text-zinc-400 mb-8">정면 전신샷을 올리면 AI가 옷을 조각별로 추출해요</p>

            {/* 업로드 영역 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex-1 min-h-[320px] rounded-3xl border-2 overflow-hidden cursor-pointer transition-all ${
                originalImage
                  ? 'border-zinc-200 dark:border-zinc-700 shadow-lg'
                  : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400'
              }`}
            >
              {originalImage ? (
                <img src={originalImage} alt="업로드 이미지" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <ImagePlus className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-zinc-500">사진을 탭해서 올려주세요</p>
                  <p className="text-xs text-zinc-400">정면 전신샷 권장</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            <button
              onClick={handleScan}
              disabled={!originalImage}
              className="mt-5 w-full py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg disabled:opacity-30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> AI 스캔 시작
            </button>
          </motion.div>
        )}

        {/* ── STEP: EXTRACTING ── */}
        {step === 'extracting' && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center gap-8 px-8">

            {/* Active spinner */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full" />

            {/* Step rows */}
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              {([
                { phase: 1, label: '위치 분석', detail: '' },
                { phase: 2, label: '배경 제거', detail: extractPhase === 2 && extractTotal > 0 ? `${extractCurrent}/${extractTotal}` : '' },
                { phase: 3, label: '이름 생성', detail: extractPhase === 3 && extractTotal > 0 ? `${extractCurrent}/${extractTotal}` : '' },
              ] as { phase: number; label: string; detail: string }[]).map(({ phase, label, detail }) => {
                const done = extractPhase > phase;
                const active = extractPhase === phase;
                return (
                  <div key={phase} className="flex items-center gap-3">
                    {/* State icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${
                      done ? 'bg-black dark:bg-white' : active ? 'border-2 border-zinc-900 dark:border-white' : 'border-2 border-zinc-300 dark:border-zinc-700'
                    }`}>
                      {done ? <Check className="w-3 h-3 text-white dark:text-black" /> : (
                        <span className={active ? 'text-zinc-900 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}>{phase}</span>
                      )}
                    </div>
                    {/* Label */}
                    <div className="flex-1">
                      <span className={`text-sm font-bold ${done ? 'text-zinc-400 dark:text-zinc-500' : active ? 'text-zinc-900 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`}>
                        {label}
                      </span>
                      {detail && <span className="ml-1.5 text-xs text-zinc-400">{detail}</span>}
                    </div>
                    {/* Phase indicator */}
                    <span className={`text-[10px] font-bold ${done || active ? 'text-zinc-400' : 'text-zinc-300 dark:text-zinc-700'}`}>{phase}/3</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col px-5 pt-14 pb-32 max-w-md mx-auto">

            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('upload')} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <div>
                <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">추출 완료</h1>
                <p className="text-xs text-zinc-400">
                  {resultItems.length}개 추출됨{failedCount > 0 ? ` · ${failedCount}개 실패` : ''}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">이름을 탭해서 수정하고, 필요 없는 옷은 X로 제거하세요</p>

            <div className="flex flex-col gap-3">
              {resultItems.map((item) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">

                  {/* 이미지 */}
                  <div className="w-16 h-16 shrink-0 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center p-1">
                    <img src={item.image} alt={item.name}
                      className={`max-w-full max-h-full object-contain ${stickerMode ? 'sticker' : ''}`} />
                  </div>

                  {/* 이름 + 카테고리 */}
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
                        <button onClick={commitEdit} className="w-6 h-6 flex items-center justify-center bg-black rounded-full shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)} className="flex items-center gap-1.5 text-left w-full group">
                        {item.nameLoading ? (
                          <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                        ) : (
                          <>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.name}</span>
                            <Pencil className="w-3 h-3 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                          </>
                        )}
                      </button>
                    )}
                    {/* 카테고리 */}
                    <select
                      value={item.category}
                      onChange={e => setResultItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                      className="mt-1 text-[11px] font-bold text-zinc-500 bg-transparent border-none outline-none cursor-pointer"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 제거 */}
                  <button onClick={() => setResultItems(prev => prev.filter(i => i.id !== item.id))}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* 저장 버튼 (fixed bottom) */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 dark:bg-[#0c0c0f]/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleSave}
                  disabled={isSaving || resultItems.length === 0 || resultItems.some(i => i.nameLoading)}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> 저장 중...</>
                  ) : resultItems.some(i => i.nameLoading) ? (
                    <>이름 생성 중...</>
                  ) : (
                    <><Check className="w-4 h-4" /> {resultItems.length}개 옷장에 저장하기</>
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
