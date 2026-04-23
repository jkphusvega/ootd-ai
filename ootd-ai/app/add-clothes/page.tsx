'use client';
import { useState, useEffect, useMemo } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { Sparkles, UploadCloud, Home, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';
import { logEvent } from '../../lib/analytics';

interface ExtractedItem {
  id: string;
  category: string;
  image: string; // base64
}

interface FailedItem {
  id: string;
  category: string;
  y_start: number;
  y_end: number;
  errorMsg: string;
  retrying?: boolean;
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

// 전략 1→4 순서로 자동 시도 (실패하면 다음 전략으로)
const STRATEGIES: ExtractionStrategy[] = [
  { name: '기본 추출',      maxDim: 512, padding: 0.08, xExpand: 0,    yExpand: 0,    enhanceContrast: false, brightnessBoost: 0 },
  { name: '경량 모드',      maxDim: 384, padding: 0.06, xExpand: 0,    yExpand: 0,    enhanceContrast: false, brightnessBoost: 0 },
  { name: '대비 강화',      maxDim: 512, padding: 0.10, xExpand: 0.05, yExpand: 0.03, enhanceContrast: true,  brightnessBoost: 25 },
  { name: '넓은 영역 스캔', maxDim: 448, padding: 0.15, xExpand: 0.10, yExpand: 0.05, enhanceContrast: true,  brightnessBoost: 15 },
];

export default function UnifiedSandboxPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  // 비로그인 유저 접근 차단
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [base64Original, setBase64Original] = useState<string | null>(null);
  
  // Pipeline Mode Toggle
  const [pipelineMode, setPipelineMode] = useState<'single' | 'auto'>('single');
  
  const [resultImage, setResultImage] = useState<string | null>(null); // For single
  const [resultImages, setResultImages] = useState<ExtractedItem[]>([]); // For auto
  const [failedItems, setFailedItems] = useState<FailedItem[]>([]); // 실패한 아이템
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [stickerMode, setStickerMode] = useState(true);
  
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  // ---------- UTILS ----------
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
          } else {
            if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.9));
          } else resolve(reader.result as string);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  };

  // ═══════════════════════════════════════════════════════
  // 🧠 Smart Strategy Cascade: 실패 원인별 자동 대응 시스템
  // ═══════════════════════════════════════════════════════

  // 전략에 따라 크롭+리사이즈+전처리하여 Blob 반환
  const getSegmentedBlob = (
    imgSrc: string, xmin: number, ymin: number, xmax: number, ymax: number,
    strategy: ExtractionStrategy
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const pxX = xmin * img.width;
        const pxY = ymin * img.height;
        const pxW = (xmax - xmin) * img.width;
        const pxH = (ymax - ymin) * img.height;

        const paddingX = pxW * strategy.padding;
        const paddingY = pxH * strategy.padding;
        const finalX = Math.max(0, pxX - paddingX);
        const finalY = Math.max(0, pxY - paddingY);
        const finalW = Math.min(img.width - finalX, pxW + paddingX * 2);
        const finalH = Math.min(img.height - finalY, pxH + paddingY * 2);

        let outW = finalW, outH = finalH;
        if (outW > outH) {
          if (outW > strategy.maxDim) { outH *= strategy.maxDim / outW; outW = strategy.maxDim; }
        } else {
          if (outH > strategy.maxDim) { outW *= strategy.maxDim / outH; outH = strategy.maxDim; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No Canvas Ctx');
        ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, outW, outH);

        // 🎨 전략에 따른 이미지 전처리 (대비/밝기 강화)
        if (strategy.enhanceContrast) {
          const imageData = ctx.getImageData(0, 0, outW, outH);
          const data = imageData.data;
          const contrastFactor = 1.3; // 30% 대비 증가
          const brightAdd = strategy.brightnessBoost;
          for (let i = 0; i < data.length; i += 4) {
            // RGB에 대비 & 밝기 적용 (알파 제외)
            data[i]     = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128 + brightAdd));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128 + brightAdd));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128 + brightAdd));
          }
          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((b) => { if (b) resolve(b); else reject("blob failed"); }, 'image/png');
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  // 단일 아이템을 전략 캐스케이드로 추출
  const extractSingleItem = async (
    imgSrc: string, category: string, y_start: number, y_end: number,
    onStrategyChange?: (strategyName: string, attempt: number, total: number) => void
  ): Promise<ExtractedItem> => {
    let xmin = 0.05, xmax = 0.95;
    const cat = category.toLowerCase();
    if (cat.includes('bottom')) { xmin = 0.10; xmax = 0.90; }
    else if (cat.includes('shoe')) { xmin = 0.15; xmax = 0.85; }
    
    let ymin = y_start, ymax = y_end;
    if (cat.includes('top') || cat.includes('outer')) ymin = Math.max(ymin, 0.12);
    else if (cat.includes('bottom')) ymin = Math.max(ymin, 0.35);
    else if (cat.includes('shoe')) ymin = Math.max(ymin, 0.80);
    
    const errors: string[] = [];

    for (let s = 0; s < STRATEGIES.length; s++) {
      const strategy = STRATEGIES[s];
      onStrategyChange?.(strategy.name, s + 1, STRATEGIES.length);

      try {
        // 전략별 X/Y 확장 적용
        const sXmin = Math.max(0, xmin - strategy.xExpand);
        const sXmax = Math.min(1, xmax + strategy.xExpand);
        const sYmin = Math.max(0, ymin - strategy.yExpand);
        const sYmax = Math.min(1, ymax + strategy.yExpand);

        const croppedBlob = await getSegmentedBlob(imgSrc, sXmin, sYmin, sXmax, sYmax, strategy);
        const imglyBlob = await removeBackground(croppedBlob);
        const base64data = await blobToBase64(imglyBlob);

        return {
          id: Math.random().toString(),
          category: cat.includes('top') ? 'tops' : cat.includes('bot') ? 'bottoms' : cat.includes('out') ? 'outer' : cat.includes('shoe') ? 'shoes' : 'outer',
          image: base64data
        };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        errors.push(`[${strategy.name}] ${errMsg}`);
        console.warn(`⚠️ [${category}] "${strategy.name}" 전략 실패:`, errMsg);
        // 다음 전략 시도 전 메모리 해제 대기
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // 모든 전략 실패  
    throw new Error(`${STRATEGIES.length}가지 전략 모두 실패:\n${errors.join('\n')}`);
  };

  // ---------- PIPELINES ----------
  const handleSingleExtract = async () => {
    if (!originalImage) return;
    setIsProcessing(true);

    try {
      // 단일 모드도 전략 캐스케이드 적용
      const fakeCategory = 'single';
      let lastErr: Error | null = null;

      for (let s = 0; s < STRATEGIES.length; s++) {
        const strategy = STRATEGIES[s];
        setProgressMsg(`배경 제거 중 [${strategy.name}] (${s+1}/${STRATEGIES.length})...`);

        try {
          const response = await fetch(originalImage);
          const originalBlob = await response.blob();
          
          // 리사이즈 적용
          const resizedBlob = await new Promise<Blob>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              let w = img.width, h = img.height;
              if (w > h) { if (w > strategy.maxDim) { h *= strategy.maxDim / w; w = strategy.maxDim; } }
              else { if (h > strategy.maxDim) { w *= strategy.maxDim / h; h = strategy.maxDim; } }
              const canvas = document.createElement('canvas');
              canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject('no ctx');
              ctx.drawImage(img, 0, 0, w, h);
              if (strategy.enhanceContrast) {
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                  data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.3 + 128 + strategy.brightnessBoost));
                  data[i+1] = Math.min(255, Math.max(0, (data[i+1] - 128) * 1.3 + 128 + strategy.brightnessBoost));
                  data[i+2] = Math.min(255, Math.max(0, (data[i+2] - 128) * 1.3 + 128 + strategy.brightnessBoost));
                }
                ctx.putImageData(imageData, 0, 0);
              }
              canvas.toBlob((b) => b ? resolve(b) : reject('blob fail'), 'image/png');
            };
            img.src = URL.createObjectURL(originalBlob);
          });

          const resultBlob = await removeBackground(resizedBlob);
          const base64data = await blobToBase64(resultBlob);
          setResultImage(base64data);
          setProgressMsg('');
          setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
          return; // 성공!
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
          console.warn(`단일 추출 "${strategy.name}" 실패:`, e);
          await new Promise(r => setTimeout(r, 800));
        }
      }

      throw lastErr || new Error('모든 전략 실패');
    } catch (e: unknown) {
      console.error(e);
      toast('모든 전략을 시도했지만 배경 제거에 실패했습니다.\n다른 사진으로 시도해주세요.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSegment = async (base64Input?: string) => {
    const targetBase64 = base64Input || base64Original;
    const targetOriginal = originalImage;
    if (!targetOriginal || !targetBase64) return;
    
    setPipelineMode('auto');
    setIsProcessing(true);
    setProgressMsg('Gemini AI가 옷 위치를 분석하는 중...');
    setResultImages([]);
    setFailedItems([]);
    setResultImage(null);

    try {
      const response = await fetch('/api/segment-clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: targetBase64 })
      });
      if (!response.ok) { let errStr = '통신 에러'; try { const errObj = await response.json(); errStr = errObj.error; } catch(err: unknown){} throw new Error(errStr); }
      const data = await response.json();
      if (!data.items || data.items.length === 0) throw new Error('AI가 뚜렷한 옷 조각을 찾지 못했습니다.');

      const newResults: ExtractedItem[] = [];
      const newFailed: FailedItem[] = [];
      const total = data.items.length;
      
      for (let i = 0; i < total; i++) {
        const item = data.items[i];
        
        try {
          const result = await extractSingleItem(
            targetOriginal, item.category, item.y_start, item.y_end,
            (strategyName, attempt, stratTotal) => {
              setProgressMsg(`[${item.category}] ${strategyName} (${attempt}/${stratTotal}) — 아이템 ${i+1}/${total}`);
            }
          );
          newResults.push(result);
          setResultImages([...newResults]);
        } catch (itemError) {
          console.error(`[${item.category}] 추출 실패:`, itemError);
          const errMsg = itemError instanceof Error ? itemError.message : '알 수 없는 오류';
          newFailed.push({
            id: Math.random().toString(),
            category: item.category,
            y_start: item.y_start,
            y_end: item.y_end,
            errorMsg: errMsg
          });
          setFailedItems([...newFailed]);
        }
      }

      if (newResults.length === 0 && newFailed.length > 0) {
        toast('모든 항목이 실패했습니다. 아래에서 개별 재시도 해주세요.', 'error');
      }

      setResultImages(newResults);
      setFailedItems(newFailed);
      setProgressMsg('');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);

    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast('자동 분할 추출 실패: ' + msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 실패한 아이템 개별 재시도 (전략 캐스케이드 적용)
  const retryFailedItem = async (failedItem: FailedItem) => {
    if (!originalImage) return;
    
    // UI에서 retrying 표시
    setFailedItems(prev => prev.map(f => f.id === failedItem.id ? { ...f, retrying: true } : f));
    
    try {
      const result = await extractSingleItem(
        originalImage, failedItem.category, failedItem.y_start, failedItem.y_end,
        (strategyName, attempt, total) => {
          setProgressMsg(`[${failedItem.category}] 재시도: ${strategyName} (${attempt}/${total})`);
        }
      );
      
      // 성공: failedItems에서 제거, resultImages에 추가
      setFailedItems(prev => prev.filter(f => f.id !== failedItem.id));
      setResultImages(prev => [...prev, result]);
      setProgressMsg('');
      toast(`${failedItem.category} 재시도 성공! 🎉`, 'success');
    } catch (e) {
      console.error(`[${failedItem.category}] 재시도 실패:`, e);
      const errMsg = e instanceof Error ? e.message : '알 수 없는 오류';
      setFailedItems(prev => prev.map(f => f.id === failedItem.id ? { ...f, retrying: false, errorMsg: '4가지 전략 모두 실패' } : f));
      setProgressMsg('');
      toast(`${failedItem.category}: 모든 전략을 시도했지만 실패했습니다.`, 'error');
    }
  };

  // ---------- SAVE LOGIC ----------
  const handleSaveToWardrobe = async (category: string) => {
    if (!resultImage) return;
    setIsProcessing(true);
    setProgressMsg('클라우드 DB 옷장으로 동기화 중...');
    
    try {
      const fetchResponse = await fetch(resultImage);
      const blob = await fetchResponse.blob();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

      const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: 'image/webp' });
      if (uploadError) throw new Error('업로드 실패: ' + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('clothes').insert({ category, name: `${category.toUpperCase()}`, image_url: publicUrl, user_id: user!.id });
      if (dbError) throw new Error('DB 저장 실패: ' + dbError.message);

      logEvent(user!.id, 'clothes_added', { category, pipeline: 'single' });
      router.push('/wardrobe');
    } catch (e: unknown) {
      console.error('Supabase Error:', e);
      const msg = e instanceof Error ? e.message : '저장 중 서버 연동 오류가 발생했습니다.';
      toast(msg, 'error');
    } finally {
      setIsProcessing(false); setProgressMsg('');
    }
  };

  const handleBulkSaveToWardrobe = async () => {
    if (resultImages.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('AI 자동 추출된 목록 전체를 클라우드에 업로드 중입니다...');
    
    try {
      for (const item of resultImages) {
        const fetchResponse = await fetch(item.image);
        const blob = await fetchResponse.blob();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: 'image/webp' });
        if (uploadError) throw new Error('업로드 실패: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('clothes').insert({
          category: item.category || 'tops',
          name: `${(item.category || 'tops').toUpperCase()}`,
          image_url: publicUrl,
          user_id: user!.id
        });
        if (dbError) throw new Error('DB 저장 실패: ' + dbError.message);
      }

      logEvent(user!.id, 'clothes_added', { count: resultImages.length, pipeline: 'auto' });
      router.push('/wardrobe');
    } catch (e: unknown) {
      console.error('Supabase Error:', e);
      const msg = e instanceof Error ? e.message : '저장 중 오류 발생.';
      toast(msg, 'error');
    } finally {
      setIsProcessing(false); setProgressMsg('');
    }
  };

  // Revoke blob URLs when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage);
    };
  }, [originalImage]);

  // ---------- UI HANDLERS ----------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage);
      setOriginalImage(URL.createObjectURL(file));
      setResultImage(null);
      setResultImages([]);
      
      const reader = new FileReader();
      reader.onloadend = () => setBase64Original(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (id: string, newCat: string) => {
    setResultImages(prev => prev.map(item => item.id === id ? { ...item, category: newCat } : item));
  };
  const handleDiscardItem = (id: string) => {
    setResultImages(prev => prev.filter(item => item.id !== id));
  };

  // Seamless Transfer Engine
  useEffect(() => {
    const transferImage = sessionStorage.getItem('ootd_transfer_image');
    const autoStart = sessionStorage.getItem('ootd_auto_start');
    if (transferImage) {
      setBase64Original(transferImage);
      fetch(transferImage).then(res => res.blob()).then(blob => {
        setOriginalImage(URL.createObjectURL(blob));
        sessionStorage.removeItem('ootd_transfer_image');
        if (autoStart === 'true') {
           sessionStorage.removeItem('ootd_auto_start');
           setShouldAutoStart(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (shouldAutoStart && originalImage && base64Original) {
      setShouldAutoStart(false);
      handleAutoSegment(base64Original);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStart, originalImage, base64Original]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 p-4 md:p-8 font-sans selection:bg-zinc-200 overflow-x-hidden pb-32">
      <style>{`
        .sticker-effect {
          filter: drop-shadow(0px -3px 0px rgba(255,255,255,1)) drop-shadow(0px 3px 0px rgba(255,255,255,1)) drop-shadow(3px 0px 0px rgba(255,255,255,1)) drop-shadow(-3px 0px 0px rgba(255,255,255,1)) drop-shadow(0 15px 25px rgba(0,0,0,0.1));
        }
        .crop-effect { filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2)); }
      `}</style>
      
      <div className="max-w-5xl mx-auto pt-2 md:pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/"><button className="w-10 h-10 shrink-0 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition active:scale-95 shadow-sm"><Home className="w-4 h-4" /></button></Link>
              <h1 className="text-2xl md:text-2xl font-extrabold tracking-tight text-black leading-tight">✨ AI 옷 스캐너</h1>
            </div>
            <p className="text-zinc-500 tracking-wide text-[11px] md:text-[13px] mt-2 leading-relaxed">
              정면 전신샷은 <strong className="text-black">버튼 하나로 AI가 전체를 쪼개주고(Multi)</strong>,<br/>측면/앉은 자세나 단품 옷 사진은 <strong className="text-black">자체 단일 추출(Single)</strong>로 깔끔하게 배경만 날려줍니다!
            </p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-2 bg-white border border-zinc-200 p-1.5 rounded-full shadow-sm shrink-0 mt-2 md:mt-0">
             <button onClick={() => setStickerMode(true)} className={`flex-1 md:flex-none px-4 py-3 md:py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${stickerMode ? 'bg-black text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>다이컷 스티커</button>
             <button onClick={() => setStickerMode(false)} className={`flex-1 md:flex-none px-4 py-3 md:py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${!stickerMode ? 'bg-black text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>테두리 끄기</button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
           <button 
             onClick={() => { setPipelineMode('single'); setResultImages([]); }}
             className={`w-full py-4 border-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-[11px] md:text-sm ${pipelineMode === 'single' ? 'border-zinc-800 bg-zinc-100 text-black shadow-sm' : 'border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50'}`}
           >
              ✂️ 옵션 1. (단품/통짜 코디 용) 전체 배경만 제거하기
           </button>
           <button 
             onClick={() => { setPipelineMode('auto'); setResultImage(null); }}
             className={`w-full py-4 px-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all text-[11px] md:text-sm ${pipelineMode === 'auto' ? 'border-zinc-800 bg-zinc-100 text-black shadow-[0_0_15px_rgba(0,0,0,0.05)]' : 'border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50'}`}
           >
              🚀 옵션 2. (정면 전신샷 용) AI 다중 부위 분할 추출
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 pb-10 items-start">
          {/* Left: Upload & Original */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-base md:text-lg text-black">Target Image</h2>
            <div className="border border-zinc-200 rounded-[2rem] p-4 flex flex-col items-center justify-center bg-white shadow-sm min-h-[400px] md:h-[500px] relative overflow-hidden">
              {!originalImage ? (
                <>
                  <UploadCloud className="w-14 h-14 text-zinc-300 mb-5" />
                  <p className="text-zinc-500 font-extrabold mb-2 text-xs md:text-sm uppercase tracking-widest text-center px-4">옷 사진 터치하여 업로드</p>
                  <p className="text-zinc-400 text-[10px] md:text-xs text-center leading-relaxed">정면 전신샷은 옵션 2번,<br/>측면/단품 코디는 옵션 1번을 써보세요.</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </>
              ) : (
                <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
              )}
              {shouldAutoStart && (
                <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow animate-pulse">
                  Auto Sequence Initiating...
                </div>
              )}
            </div>

            <button 
              onClick={pipelineMode === 'auto' ? () => handleAutoSegment() : handleSingleExtract}
              disabled={!originalImage || isProcessing}
              className={`w-full disabled:opacity-50 text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] font-extrabold py-5 md:py-6 rounded-[1.5rem] flex items-center justify-center gap-2 transition-all tracking-widest text-[12px] md:text-sm active:scale-95 ${pipelineMode === 'auto' ? 'bg-zinc-800' : 'bg-black hover:scale-[1.01]'}`}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 animate-pulse" /> {progressMsg}
                </span>
              ) : pipelineMode === 'auto' ? '옵션 2: Gemini 부위별 분해 명령하기 🚀' : '옵션 1: 전체 배경 통짜로 제거하기 ✂️'}
            </button>
          </div>

          {/* Right: Results Display depending on Pipeline Mode */}
          <div className="flex flex-col gap-4 mt-8 md:mt-0">
             <h2 className="font-bold text-base md:text-lg text-black flex items-center justify-between">
                Die-cut Result
                {pipelineMode === 'auto' && resultImages.length > 0 && <span className="bg-black text-[10px] text-white px-2 py-0.5 rounded-full font-bold">{resultImages.length} 조각</span>}
             </h2>

             {/* Single Mode Result View */}
             {pipelineMode === 'single' && (
               <>
                 <div className="border border-zinc-200 rounded-[2rem] p-4 md:p-8 flex flex-col bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=100&w=2400&auto=format&fit=crop')] bg-cover bg-center min-h-[380px] h-[500px] relative overflow-hidden shadow-inner group items-center justify-center">
                   <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none" />
                   {!resultImage ? (
                     <p className="relative z-10 text-white/90 font-extrabold text-[12px] uppercase tracking-widest text-center leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">배경이 깨끗하게 지워진 채<br/>옷장 행거에 단품 피스로 수집됩니다.</p>
                   ) : (
                     <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
                        <div className="absolute top-[5%] left-10 right-10 h-[4px] bg-gradient-to-r from-stone-700 via-stone-500 to-stone-700 shadow-md rounded-full z-0" />
                        <div className="text-stone-800 absolute top-6 z-20 drop-shadow-md"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14 l8-6 l8 6Z"/><path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/></svg></div>
                        <img src={resultImage} alt="Cutout" className={`max-w-[85%] max-h-[85%] mt-12 object-contain transition-all duration-500 group-hover:scale-105 ${stickerMode ? 'sticker-effect' : 'crop-effect'}`} style={{ filter: !stickerMode ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' : undefined }} />
                     </div>
                   )}
                 </div>
                 <AnimatePresence>
                   {resultImage && (
                     <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-4 px-2">
                        <p className="text-[12px] text-zinc-500 font-bold text-center tracking-widest">저장할 옷장 칸(카테고리)을 골라주세요</p>
                        <div className="grid grid-cols-3 gap-2">
                           {['outer', 'tops', 'bottoms', 'socks', 'shoes'].map(cat => (
                             <button key={cat} onClick={() => handleSaveToWardrobe(cat)} disabled={isProcessing} className="py-4 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest text-black uppercase transition active:scale-95 shadow-sm">
                               {cat}
                             </button>
                           ))}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </>
             )}

             {/* Auto Mode Result View */}
             {pipelineMode === 'auto' && (
               <div className={`border border-zinc-200 rounded-[2rem] p-4 flex flex-col bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=100&w=2400&auto=format&fit=crop')] bg-cover bg-center min-h-[380px] h-[500px] relative overflow-hidden shadow-inner ${resultImages.length === 0 && failedItems.length === 0 ? 'items-center justify-center' : ''}`}>
                 <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none" />
                 {!resultImages.length && !failedItems.length ? (
                   <p className="text-white/90 font-extrabold text-[12px] uppercase tracking-widest text-center leading-relaxed px-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">AI 스캐너를 돌리면<br/>자동으로 조각나서 리스트에 담깁니다.</p>
                 ) : (
                    <div className="relative w-full h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden pr-2 z-10 pb-20">
                      {/* 성공 아이템 */}
                      {resultImages.map((item) => (
                         <div key={item.id} className="relative flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white p-2 rounded-2xl w-full shadow-lg">
                            <div className="w-[80px] h-[80px] shrink-0 rounded-xl relative flex items-center justify-center p-1 bg-stone-100/50">
                               <img src={item.image} alt="Crop" className={`max-w-full max-h-full object-contain ${stickerMode ? 'sticker-effect' : 'crop-effect'}`} style={{ filter: !stickerMode ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : undefined }} />
                            </div>
                            <div className="flex flex-col flex-1 gap-1.5">
                               <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded shadow uppercase">{item.category} 인식됨</span>
                                  <button onClick={() => handleDiscardItem(item.id)} className="text-[9px] text-red-500 font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition">버리기 🗑</button>
                               </div>
                               <select value={item.category} onChange={(e) => handleCategoryChange(item.id, e.target.value)} className="text-[10px] font-bold p-1.5 rounded-lg border border-stone-200 outline-none w-full bg-white shadow-sm text-stone-700">
                                 <option value="outer">Outer (아우터)</option>
                                 <option value="tops">Tops (상의)</option>
                                 <option value="bottoms">Bottoms (하의)</option>
                                 <option value="socks">Socks (양말/기타)</option>
                                 <option value="shoes">Shoes (신발)</option>
                               </select>
                            </div>
                         </div>
                      ))}
                      {/* 실패 아이템 */}
                      {failedItems.map((item) => (
                        <div key={item.id} className="relative flex items-center gap-3 bg-red-50/90 backdrop-blur-xl border border-red-200 p-2 rounded-2xl w-full shadow-lg">
                          <div className="w-[80px] h-[80px] shrink-0 rounded-xl bg-red-100 flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                          </div>
                          <div className="flex flex-col flex-1 gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded shadow uppercase">{item.category} 실패</span>
                              <button onClick={() => setFailedItems(prev => prev.filter(f => f.id !== item.id))} className="text-[9px] text-zinc-500 font-bold px-2 py-1 bg-white/80 rounded hover:bg-white transition">제거</button>
                            </div>
                            <p className="text-[9px] text-red-600 font-medium leading-snug">{item.errorMsg}</p>
                            <button onClick={() => retryFailedItem(item)} disabled={item.retrying || isProcessing}
                              className="text-[9px] font-extrabold px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                              {item.retrying ? '재시도 중...' : '다시 시도'}
                            </button>
                          </div>
                        </div>
                      ))}
                   </div>
                 )}
                 {resultImages.length > 0 && (
                   <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 via-transparent to-transparent backdrop-blur-[2px] z-20">
                     <button onClick={handleBulkSaveToWardrobe} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-4 bg-black hover:bg-zinc-800 text-white rounded-[1.5rem] font-extrabold text-xs tracking-widest shadow-2xl transition active:scale-95">
                        <CheckCircle2 className="w-4 h-4" /> 남은 옷 조각들 일괄 옷장 저장 🚀
                     </button>
                   </div>
                 )}
               </div>
             )}

          </div>
        </div>
      </div>
    </div>
  );
}
