'use client';
import { useState, useRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { Sparkles, UploadCloud, Layers, Crop, Home } from 'lucide-react';
import Link from 'next/link';

export default function TestBgPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stickerMode, setStickerMode] = useState(true);
  
  const [pipelineMode, setPipelineMode] = useState<'full' | 'crop'>('full');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const handleSaveToWardrobe = (category: string) => {
    if (!resultImage) return;
    const newItem = {
      id: 'local_' + Date.now().toString(),
      image: resultImage,
      name: `NEW ${category.toUpperCase()}`,
      categoryId: category
    };
    try {
      const current = JSON.parse(localStorage.getItem('ootd_wardrobe') || '[]');
      localStorage.setItem('ootd_wardrobe', JSON.stringify([newItem, ...current]));
      alert('옷장에 안전하게 저장되었습니다! 🎉');
    } catch(e) {
      console.error('Storage full:', e);
      alert('브라우저 저장 공간이 꽉 찼습니다! 옷장에서 안 입는 옷을 삭제 후 다시 시도해주세요.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setOriginalImage(url);
      setResultImage(null);
      setCropBox(null);
    }
  };

  const getPointerPos = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    return { x, y };
  }

  // Mouse & Touch handlers
  const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
    if (pipelineMode !== 'crop') return;
    const { x, y } = getPointerPos(clientX, clientY, target);
    setStartPos({ x, y });
    setCropBox({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number, target: HTMLElement) => {
    if (!isDragging || pipelineMode !== 'crop') return;
    const { x, y } = getPointerPos(clientX, clientY, target);
    setCropBox({
      x: Math.min(x, startPos.x),
      y: Math.min(y, startPos.y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y)
    });
  };

  const handleEnd = () => {
    if (isDragging) setIsDragging(false);
  };

  const getCroppedImageBlob = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current || !containerRef.current || !cropBox) return reject("No crop box data");
      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgOffsetX = rect.left - containerRect.left;
      const imgOffsetY = rect.top - containerRect.top;
      const targetX = cropBox.x - imgOffsetX;
      const targetY = cropBox.y - imgOffsetY;
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;
      const pxX = targetX * scaleX;
      const pxY = targetY * scaleY;
      const pxW = cropBox.width * scaleX;
      const pxH = cropBox.height * scaleY;

      if (pxW <= 0 || pxH <= 0 || pxX >= img.naturalWidth || pxY >= img.naturalHeight) return reject("Invalid crop");

      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No ctx");

      ctx.drawImage(img, Math.max(0, pxX), Math.max(0, pxY), Math.min(pxW, img.naturalWidth - pxX), Math.min(pxH, img.naturalHeight - pxY), 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => { if (b) resolve(b); else reject("blob fail"); }, 'image/png');
    });
  };

  const handleRemoveBg = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      let imageSource: string | Blob = originalImage;
      if (pipelineMode === 'crop' && cropBox && cropBox.width > 20) {
         try { imageSource = await getCroppedImageBlob(); } catch(e) { console.log(e); }
      }

      const blob = await removeBackground(imageSource, {
        progress: (key, current, total) => setProgress(Math.round((current / total) * 100))
      });
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 500;
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
              resolve(canvas.toDataURL('image/webp', 0.8));
            } else resolve(reader.result as string);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(blob);
      });
      setResultImage(base64data);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
    } catch (error) {
      console.error(error);
      alert('배경 제거 실패!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 p-4 md:p-8 font-sans selection:bg-zinc-200 overflow-x-hidden">
      <style>{`
        .sticker-effect {
          filter: drop-shadow(0px -3px 0px rgba(255,255,255,1)) drop-shadow(0px 3px 0px rgba(255,255,255,1)) drop-shadow(3px 0px 0px rgba(255,255,255,1)) drop-shadow(-3px 0px 0px rgba(255,255,255,1)) drop-shadow(0 15px 25px rgba(0,0,0,0.1));
        }
        .crop-effect {
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto pt-2 md:pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-5 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <button className="w-10 h-10 shrink-0 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition active:scale-95 shadow-sm">
                  <Home className="w-4 h-4" />
                </button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black leading-tight">🚀 AI Sandbox</h1>
            </div>
            <p className="text-zinc-500 tracking-wide text-[11px] md:text-sm mt-1 leading-relaxed">
              얼굴/신체를 배제하고 <span className="text-black font-bold">오직 '외투/상의/하의'만 타겟팅</span>하여 옷걸이에 거는 완벽한 2단계 워크플로우를 모의 테스트합니다.
            </p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-2 bg-white border border-zinc-200 p-1.5 rounded-full shadow-sm shrink-0">
             <button 
               onClick={() => setStickerMode(true)}
               className={`flex-1 md:flex-none px-3 py-2.5 md:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${stickerMode ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
             >다이컷 스티커</button>
             <button 
               onClick={() => setStickerMode(false)}
               className={`flex-1 md:flex-none px-3 py-2.5 md:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${!stickerMode ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
             >테두리 끄기</button>
          </div>
        </div>

        {/* Pipeline Toggle */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
           <button 
             onClick={() => { setPipelineMode('full'); setCropBox(null); }}
             className={`w-full py-4 border-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-[11px] md:text-sm ${pipelineMode === 'full' ? 'border-zinc-800 bg-zinc-100 text-black shadow-sm' : 'border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50'}`}
           >
              1. 전체 누끼 (얼굴/신체 전체 배경제거)
           </button>
           <button 
             onClick={() => { setPipelineMode('crop'); if(!originalImage) return; }}
             className={`w-full py-4 px-2 border-2 rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all text-[11px] md:text-sm ${pipelineMode === 'crop' ? 'border-zinc-800 bg-zinc-100 text-black shadow-[0_0_15px_rgba(0,0,0,0.05)]' : 'border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50'}`}
           >
              <div className="flex items-center justify-center gap-1.5 text-center px-2">
                 <Crop className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                 2. 옷 부분만 타겟팅 추출 (얼굴 파내기 테스트)
              </div>
              {pipelineMode === 'crop' && <span className="text-[9px] md:text-[11px] font-normal text-zinc-500 leading-tight mt-1.5 text-center">업로드 후 사진 위에서 드래그해서 상의/하의 영역만 네모낳게 그어보세요!</span>}
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-10">
          {/* Left: Upload & Original */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-base md:text-lg text-black flex items-center justify-between">Original Selfie</h2>
            <div 
              ref={containerRef}
              className="border border-zinc-200 rounded-[2rem] p-4 flex flex-col items-center justify-center bg-white shadow-sm h-[380px] md:h-[480px] relative overflow-hidden select-none touch-none"
              onMouseDown={(e) => handleStart(e.clientX, e.clientY, e.currentTarget)} onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)} onMouseUp={handleEnd} onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)} onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget)} onTouchEnd={handleEnd}
            >
              {!originalImage ? (
                <>
                  <UploadCloud className="w-12 h-12 md:w-16 md:h-16 text-zinc-400 mb-4 md:mb-6" />
                  <p className="text-zinc-500 font-bold mb-2 text-xs md:text-sm uppercase tracking-widest text-center px-4">전신 거울 셀카 터치하여 업로드</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </>
              ) : (
                <>
                  <img ref={imageRef} src={originalImage} alt="Original" className="max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
                  {pipelineMode === 'crop' && cropBox && cropBox.width > 0 && (
                    <div className="absolute border-2 border-dashed border-black bg-black/10 z-20 pointer-events-none" style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height }}>
                       <span className="absolute -top-5 md:-top-6 left-0 bg-black text-white text-[9px] md:text-[10px] font-bold tracking-widest px-1.5 md:px-2 py-0.5 rounded shadow whitespace-nowrap">Gemini AI</span>
                    </div>
                  )}
                  {pipelineMode === 'crop' && (!cropBox || cropBox.width < 10) && (
                    <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 bg-black/80 py-3 px-4 md:px-6 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-10 shadow-2xl backdrop-blur-md">
                      <p className="text-white font-bold tracking-wide text-xs md:text-base">📸 화면에 손가락으로 네모를 그리세요</p>
                      <p className="text-zinc-300 text-[9px] md:text-xs mt-1 text-center">얼굴을 제외하고 원하는 옷 영역만 박스로 지정해보세요</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <button 
              onClick={handleRemoveBg}
              disabled={!originalImage || isProcessing || (pipelineMode === 'crop' && (!cropBox || cropBox.width < 10))}
              className={`w-full disabled:opacity-50 text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] font-extrabold py-4 md:py-5 rounded-[1.5rem] flex items-center justify-center gap-2 md:gap-3 transition-all tracking-widest text-[11px] md:text-sm ${pipelineMode === 'crop' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-black hover:scale-[1.02]'}`}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse text-white" />
                  처리 중... {progress ? `${progress}%` : ''}
                </span>
              ) : pipelineMode === 'crop' ? '2단계: 박스친 옷만 정밀 다이컷 추출 ✂️' : '1단계: 전신 통짜 보존 추출 🚀'}
            </button>
          </div>

          {/* Right: Result */}
          <div className="flex flex-col gap-4 mt-6 md:mt-0">
             <h2 className="font-bold text-base md:text-lg text-black flex items-center justify-between">Wardrobe Save Result</h2>
             <div className="border border-zinc-200 rounded-[2rem] p-4 md:p-8 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=800')] bg-cover bg-center h-[380px] md:h-[480px] relative overflow-hidden shadow-inner">
               <div className="absolute inset-0 bg-white/40 mix-blend-overlay pointer-events-none" />
               {!resultImage ? (
                 <p className="text-stone-700 font-extrabold text-[10px] md:text-[11px] uppercase tracking-widest text-center leading-relaxed px-6 drop-shadow-sm">추출 버튼을 누르면<br/>오직 옷만 떨어져<br/>옷장 행거에 걸립니다.</p>
               ) : (
                 <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className="absolute top-[5%] left-6 right-6 md:left-10 md:right-10 h-[4px] bg-gradient-to-r from-stone-700 via-stone-500 to-stone-700 shadow-[0_5px_5px_rgba(0,0,0,0.5)] rounded-full z-0" />
                    <div className="relative w-full h-[85%] flex items-center justify-center mt-6">
                       <div className="text-stone-800 absolute top-0 z-20 drop-shadow-[0_4px_2px_rgba(0,0,0,0.3)]">
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[40px] h-[40px] md:w-[48px] md:h-[48px]"><path d="M4 14 l8-6 l8 6Z"/><path d="M12 8V4 c0-1.5 1.5-2 2-1 s1.5 2 .5 2"/></svg>
                       </div>
                       <img src={resultImage} alt="Result" className={`w-[90%] max-h-[85%] mt-10 md:mt-12 object-contain relative z-10 transition-all duration-500 ${stickerMode ? 'sticker-effect bg-white p-2 rounded-2xl border border-zinc-200/50 mix-blend-multiply' : 'crop-effect mix-blend-multiply'}`} style={{ filter: !stickerMode ? 'drop-shadow(0px 10px 15px rgba(0,0,0,0.3))' : undefined }} />
                    </div>
                 </div>
               )}
             </div>
             {resultImage && (
               <div className="mt-6 flex flex-col gap-3 w-full px-2">
                  <p className="text-[11px] text-zinc-500 font-bold text-center tracking-widest leading-relaxed">이 추출된 옷을 내 옷장의 어느 칸에 걸까요?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleSaveToWardrobe('outer')} className="py-3.5 bg-white hover:bg-zinc-50 rounded-2xl text-[10px] font-bold tracking-widest text-black transition shadow-sm outline-none active:scale-95 border border-zinc-200">아우터</button>
                    <button onClick={() => handleSaveToWardrobe('tops')} className="py-3.5 bg-white hover:bg-zinc-50 rounded-2xl text-[10px] font-bold tracking-widest text-black transition shadow-sm outline-none active:scale-95 border border-zinc-200">상의</button>
                    <button onClick={() => handleSaveToWardrobe('bottoms')} className="py-3.5 bg-white hover:bg-zinc-50 rounded-2xl text-[10px] font-bold tracking-widest text-black transition shadow-sm outline-none active:scale-95 border border-zinc-200">하의</button>
                    <button onClick={() => handleSaveToWardrobe('socks')} className="py-3.5 bg-white hover:bg-zinc-50 rounded-2xl text-[10px] font-bold tracking-widest text-black transition shadow-sm outline-none active:scale-95 border border-zinc-200">양말</button>
                    <button onClick={() => handleSaveToWardrobe('shoes')} className="py-3.5 bg-white hover:bg-zinc-50 rounded-2xl text-[10px] font-bold tracking-widest text-black transition shadow-sm outline-none active:scale-95 border border-zinc-200">신발</button>
                  </div>
                  <Link href="/wardrobe" className="w-full">
                    <button className="w-full mt-2 py-4 bg-black hover:bg-zinc-800 rounded-[1.5rem] text-[11px] md:text-xs font-extrabold tracking-widest uppercase text-white transition shadow-[0_10px_20px_rgba(0,0,0,0.15)] outline-none active:scale-95">원목 옷장 행거로 가기 ➡️</button>
                  </Link>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
