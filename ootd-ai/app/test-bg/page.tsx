'use client';
import { useState, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { Sparkles, UploadCloud, Home, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

interface ExtractedItem {
  id: string;
  category: string;
  image: string; // base64
}

export default function UnifiedSandboxPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [base64Original, setBase64Original] = useState<string | null>(null);
  
  // Pipeline Mode Toggle
  const [pipelineMode, setPipelineMode] = useState<'single' | 'auto'>('single');
  
  const [resultImage, setResultImage] = useState<string | null>(null); // For single
  const [resultImages, setResultImages] = useState<ExtractedItem[]>([]); // For auto
  
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

  const getSegmentedBlob = (imgSrc: string, xmin: number, ymin: number, xmax: number, ymax: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const pxX = xmin * img.width;
        const pxY = ymin * img.height;
        const pxW = (xmax - xmin) * img.width;
        const pxH = (ymax - ymin) * img.height;

        const paddingX = pxW * 0.02; // Tight 2% horizontal padding
        const paddingY = pxH * 0.02; // Tight 2% vertical padding
        const finalX = Math.max(0, pxX - paddingX);
        const finalY = Math.max(0, pxY - paddingY);
        const finalW = Math.min(img.width - finalX, pxW + paddingX * 2);
        const finalH = Math.min(img.height - finalY, pxH + paddingY * 2);

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No Canvas Ctx');
        ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
        canvas.toBlob((b) => { if (b) resolve(b); else reject("blob failed"); }, 'image/png');
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  // ---------- PIPELINES ----------
  const handleSingleExtract = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setProgressMsg('단일 객체의 배경을 정밀하게 지우는 중...');

    try {
      const blob = await removeBackground(originalImage);
      const base64data = await blobToBase64(blob);
      setResultImage(base64data);
      setProgressMsg('');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
    } catch(e) {
      console.error(e);
      alert('추출 실패!');
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
    setProgressMsg('Gemini AI가 정면을 분석하여 자동 크롭 중...');
    setResultImages([]);
    setResultImage(null);

    try {
      const response = await fetch('/api/segment-clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: targetBase64 })
      });
      if (!response.ok) { let errStr = '통신 에러'; try { const errObj = await response.json(); errStr = errObj.error; } catch(e){} throw new Error(errStr); }
      const data = await response.json();
      if (!data.items || data.items.length === 0) throw new Error('AI가 뚜렷한 옷 조각을 찾지 못했습니다.');

      const newResults: ExtractedItem[] = [];
      const total = data.items.length;
      
      for (let i = 0; i < total; i++) {
        const item = data.items[i];
        setProgressMsg(`[${item.category}] 부위 누끼 따는 중... (${i+1}/${total})`);
        
        const [ymin, xmin, ymax, xmax] = item.box;
        const croppedBlob = await getSegmentedBlob(targetOriginal, xmin, ymin, xmax, ymax);
        const imglyBlob = await removeBackground(croppedBlob);
        const base64data = await blobToBase64(imglyBlob);
        
        newResults.push({
          id: Math.random().toString(),
          category: item.category.toLowerCase().includes('top') ? 'tops' : item.category.toLowerCase().includes('bot') ? 'bottoms' : item.category.toLowerCase().includes('out') ? 'outer' : item.category.toLowerCase().includes('shoe') ? 'shoes' : 'outer',
          image: base64data
        });
      }

      setResultImages(newResults);
      setProgressMsg('');
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);

    } catch(e: any) {
      console.error(e);
      alert('자동 분할 추출 실패: ' + e.message);
    } finally {
      setIsProcessing(false);
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

      const { error: dbError } = await supabase.from('clothes').insert({ category, name: `${category.toUpperCase()}`, image_url: publicUrl, user_id: 'guest_user_123' });
      if (dbError) throw new Error('DB 저장 실패: ' + dbError.message);

      alert('단품 옷이 옷장에 안전하게 저장되었습니다! ☁️🎉');
      window.location.href = '/wardrobe';
    } catch(e: any) {
      console.error('Supabase Error:', e);
      alert(e.message || '저장 중 서버 연동 오류가 발생했습니다.');
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
          user_id: 'guest_user_123'
        });
        if (dbError) throw new Error('DB 저장 실패: ' + dbError.message);
      }

      alert('선택된 모든 옷이 옷장에 안전하게 동기화 저장되었습니다! ☁️🎉');
      window.location.href = '/wardrobe';
    } catch(e: any) {
      console.error('Supabase Error:', e);
      alert(e.message || '저장 중 오류 발생.');
    } finally {
      setIsProcessing(false); setProgressMsg('');
    }
  };

  // ---------- UI HANDLERS ----------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
              <h1 className="text-2xl md:text-2xl font-extrabold tracking-tight text-black leading-tight">✨ 혼합 듀얼 다이컷 스캐너</h1>
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
               <div className={`border border-zinc-200 rounded-[2rem] p-4 flex flex-col bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=100&w=2400&auto=format&fit=crop')] bg-cover bg-center min-h-[380px] h-[500px] relative overflow-hidden shadow-inner ${resultImages.length === 0 ? 'items-center justify-center' : ''}`}>
                 <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none" />
                 {!resultImages.length ? (
                   <p className="text-white/90 font-extrabold text-[12px] uppercase tracking-widest text-center leading-relaxed px-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">AI 추출기를 돌리면<br/>자동으로 조각나서 리스트에 담깁니다.</p>
                 ) : (
                   <div className="relative w-full h-full flex flex-col gap-4 overflow-y-auto overflow-x-hidden pr-2 z-10 pb-20">
                      {resultImages.map((item) => (
                         <div key={item.id} className="relative flex items-center gap-4 bg-white/70 backdrop-blur-xl border border-white p-3 rounded-2xl w-full shadow-lg">
                            <div className="w-[100px] h-[100px] shrink-0 rounded-xl relative flex items-center justify-center p-1 bg-stone-100/50">
                               <img src={item.image} alt="Crop" className={`max-w-full max-h-full object-contain ${stickerMode ? 'sticker-effect' : 'crop-effect'}`} style={{ filter: !stickerMode ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : undefined }} />
                            </div>
                            <div className="flex flex-col flex-1 gap-2">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded shadow uppercase">{item.category} 인식됨</span>
                                  <button onClick={() => handleDiscardItem(item.id)} className="text-[10px] text-red-500 font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition">버리기 🗑</button>
                               </div>
                               <select value={item.category} onChange={(e) => handleCategoryChange(item.id, e.target.value)} className="text-[11px] font-bold p-2 rounded-xl border border-stone-200 outline-none w-full bg-white shadow-sm text-stone-700">
                                 <option value="outer">Outer (아우터)</option>
                                 <option value="tops">Tops (상의)</option>
                                 <option value="bottoms">Bottoms (하의)</option>
                                 <option value="socks">Socks (양말/기타)</option>
                                 <option value="shoes">Shoes (신발)</option>
                               </select>
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
