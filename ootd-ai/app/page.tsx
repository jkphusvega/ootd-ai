'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, ChevronRight, ScanLine, Sparkles, MapPin, CloudRain, Star, Droplets, Bookmark, ImagePlus, Sun, Cloud, CloudSnow, LogOut, RefreshCw, Shirt, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useWeather } from '../hooks/useWeather';
import { useToast } from '../components/ToastProvider';
import LandingContent from '../components/LandingContent';

interface FashionCritique {
  score: number;
  summary: string;
  weatherAdvice: string;
  fitAndColor: string;
  stylistRecommendation: string;
}

interface CurationItem {
  category: string;
  name: string;
  image_url: string;
  reason: string;
}

interface CurationResult {
  title: string;
  description: string;
  style: string;
  colorTone: string;
  items: CurationItem[];
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showSplash, setShowSplash] = useState(false);
  const weather = useWeather();
  const { toast } = useToast();
  const [critique, setCritique] = useState<FashionCritique | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userProfile, setUserProfile] = useState<{nickname?: string; profile_image?: string; height?: number; weight?: number; fit_preference?: string; style_moods?: string[]} | null>(null);

  const getSearchUrls = (name: string) => {
    const q = encodeURIComponent(name);
    return {
      musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
      cm29: `https://www.29cm.co.kr/search?query=${q}`,
    };
  };

  // 모바일 탭 상태 (기본: AI 코디 추천)
  const [mobileTab, setMobileTab] = useState<'curation' | 'analysis'>('curation');
  const [curation, setCuration] = useState<CurationResult | null>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [partialCritique, setPartialCritique] = useState<Partial<FashionCritique> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  // Splash Screen
  useEffect(() => {
    if (!sessionStorage.getItem('ootd_splashed')) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('ootd_splashed', 'true');
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auth Redirect (removed — non-auth users see landing below)

  // Fetch User Profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setUserProfile(data);
      } else {
        // 프로필 데이터가 없으면 온보딩으로 이동
        router.push('/onboarding');
      }
    };
    if (!authLoading) checkProfile();
  }, [user, authLoading, router]);

  // 옷장 아이템 수 조회 (AI 코디 탭에서 사용)
  useEffect(() => {
    const fetchWardrobeCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('clothes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('category', 'ootd_feed');
      setWardrobeCount(count || 0);
    };
    if (!authLoading && user) fetchWardrobeCount();
  }, [user, authLoading, supabase]);

  // 스트리밍 중 완성된 필드를 정규식으로 추출
  const extractPartialFields = (text: string): Partial<FashionCritique> => {
    const r: Partial<FashionCritique> = {};
    const scoreM = text.match(/"score"\s*:\s*(\d+)/);
    if (scoreM) r.score = parseInt(scoreM[1]);
    const summaryM = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (summaryM) r.summary = summaryM[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    const weatherM = text.match(/"weatherAdvice"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (weatherM) r.weatherAdvice = weatherM[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    const fitM = text.match(/"fitAndColor"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (fitM) r.fitAndColor = fitM[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    const stylistM = text.match(/"stylistRecommendation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (stylistM) r.stylistRecommendation = stylistM[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    return r;
  };

  // AI 코디 큐레이션 생성
  const generateCuration = async () => {
    if (!user) return;
    setIsCurating(true);
    setCurationError(null);
    try {
      const { data: profile } = await supabase
        .from('user_profiles').select('*').eq('user_id', user.id).single();
      const res = await fetch('/api/curate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: profile || null,
        }),
      });
      const data = await res.json();
      if (res.ok) setCuration(data);
      else setCurationError(data.error || 'AI 큐레이션 오류');
    } catch {
      setCurationError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsCurating(false);
    }
  };

  // 이미지 압축: max 1024px + WebP 85% 품질 (페이로드 5MB→3~400KB)
  const compressImage = (file: File, maxDim = 1024, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
          else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast('사진 용량이 너무 큽니다!\n10MB 이하의 사진을 사용해주세요.', 'error');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
    setHasCustomImage(true);
    
    // 원본 base64 (피드 저장용)
    const fullBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setBase64Image(fullBase64);

    // API 전송용 압축 이미지 (1024px, WebP)
    const compressed = await compressImage(file);
    setScanState('scanning');
    setPartialCritique(null);
    setIsStreaming(false);
    setCritique(null);
    
    try {
      const res = await fetch('/api/analyze-ootd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed,
          weatherInfo: weather || { temperature: 20, condition: 'Clear' },
          userProfile: userProfile || null
        })
      });
      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({ error: 'AI 분석 중 오류가 발생했습니다.' }));
        toast(errData.error || 'AI 분석 중 오류가 발생했습니다.', 'error');
        setScanState('idle');
        return;
      }
      // 스트리밍: 청크마다 완성된 필드 추출 → 점진적 렌더링
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let panelOpened = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const partial = extractPartialFields(fullText);
        if (Object.keys(partial).length > 0) {
          setPartialCritique(partial);
          if (!panelOpened) { panelOpened = true; setIsStreaming(true); setScanState('success'); }
        }
      }
      const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { toast('AI 응답을 읽을 수 없습니다. 다시 시도해주세요.', 'error'); setScanState('idle'); setIsStreaming(false); setPartialCritique(null); return; }
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) { toast(parsed.error, 'error'); setScanState('idle'); setIsStreaming(false); setPartialCritique(null); return; }
      setCritique(parsed); setPartialCritique(null); setIsStreaming(false); setScanState('success');
    } catch { toast('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error'); setScanState('idle'); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    await processFile(e.target.files[0]);
  };

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => { setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await processFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, userProfile]);

  const triggerCamera = () => { fileInputRef.current?.click(); };

  const retryAnalysis = async () => {
    if (!base64Image) return;
    setScanState('scanning');
    setPartialCritique(null);
    setIsStreaming(false);
    setCritique(null);
    try {
      const blob = await (await fetch(base64Image)).blob();
      const compressed = await compressImage(new File([blob], 'retry.jpg', { type: blob.type }));
      const res = await fetch('/api/analyze-ootd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed, weatherInfo: weather || { temperature: 20, condition: 'Clear' }, userProfile: userProfile || null }),
      });
      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({ error: 'AI 분석 중 오류가 발생했습니다.' }));
        toast(errData.error || 'AI 분석 중 오류가 발생했습니다.', 'error');
        setScanState('idle');
        return;
      }
      // 스트리밍: 청크마다 완성된 필드 추출 → 점진적 렌더링
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let panelOpened = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const partial = extractPartialFields(fullText);
        if (Object.keys(partial).length > 0) {
          setPartialCritique(partial);
          if (!panelOpened) { panelOpened = true; setIsStreaming(true); setScanState('success'); }
        }
      }
      const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { toast('AI 응답을 읽을 수 없습니다. 다시 시도해주세요.', 'error'); setScanState('idle'); setIsStreaming(false); setPartialCritique(null); return; }
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) { toast(parsed.error, 'error'); setScanState('idle'); setIsStreaming(false); setPartialCritique(null); return; }
      setCritique(parsed); setPartialCritique(null); setIsStreaming(false); setScanState('success');
    } catch { toast('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error'); setScanState('idle'); }
  };
  const triggerGallery = () => { galleryInputRef.current?.click(); };
  const triggerDesktopUpload = () => { desktopFileInputRef.current?.click(); };

  const handleSaveToFeed = async () => {
    if (!base64Image || !critique) return;
    setScanState('scanning');
    try {
      // base64 → Blob 변환 (모바일 Safari에서 fetch(dataURL)이 실패하는 문제 우회)
      const base64Data = base64Image.split(',')[1];
      const mimeMatch = base64Image.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });

      const fileName = `ootd_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: mimeType });
      if (uploadError) throw new Error('업로드 에러: ' + uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('clothes').insert({
        category: 'ootd_feed', name: `${critique.score}점: ${critique.summary}`, image_url: publicUrl, user_id: user!.id
      });
      if (dbError) throw new Error('DB 에러: ' + dbError.message);
      toast('OOTD 갤러리에 저장되었습니다!\n(마이옷장 → OOTD Feeds 탭에서 확인하세요)', 'success');
      setScanState('success');
    } catch(e: unknown) {
      console.error('OOTD Save Error:', e);
      const msg = e instanceof Error ? e.message : '알 수 없는 오류';
      toast('저장 실패: ' + msg, 'error');
      setScanState('success');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const WeatherIcon = () => {
    if (!weather) return null;
    if (weather.condition === 'Rain') return <CloudRain className="w-5 h-5" />;
    if (weather.condition === 'Snow') return <CloudSnow className="w-5 h-5" />;
    if (weather.condition === 'Cloudy') return <Cloud className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    const nickname = userProfile?.nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    const nameStr = nickname ? ` ${nickname}님` : '';
    if (h < 6) return `늦은 밤이네요${nameStr} 🌙`;
    if (h < 12) return `좋은 아침이에요${nameStr} ☀️`;
    if (h < 18) return `좋은 오후에요${nameStr} 🌤`;
    return `좋은 저녁이에요${nameStr} 🌆`;
  };

  // Non-authenticated users see the landing page
  if (!authLoading && !user && !showSplash) {
    return <LandingContent />;
  }

  if (authLoading || showSplash) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0c0c0f] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="w-32 h-3 bg-zinc-100 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0c0c0f] font-sans selection:bg-zinc-200">
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={desktopFileInputRef} onChange={handleFileChange} />

      {/* ============ SPLASH SCREEN ============ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-[#FDFDFC] dark:bg-[#1a1a1e] flex flex-col items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center justify-center">
               <img src="/logo.png" alt="OOTD Logo" className="w-[60vw] md:w-64 h-auto object-contain dark:invert" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="absolute bottom-12 left-0 right-0 text-center">
               <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">Powered by Ai.dev</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (lg 이상): Dashboard Style
          ════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 py-8">
          
          {/* Greeting + Weather Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{getGreeting()}</h1>
                <button onClick={handleLogout} className="text-xs px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full font-bold transition flex items-center gap-1">
                  <LogOut className="w-3 h-3"/> 로그아웃
                </button>
              </div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">오늘의 OOTD를 업로드하고 AI 스타일리스트의 리뷰를 받아보세요</p>
            </div>
            {weather && (
              <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <WeatherIcon />
                <div>
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-white">{weather.temperature}°C</span>
                  <span className="text-xs text-zinc-400 ml-2 font-semibold">{weather.condition}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 items-start">
            {/* ── Left Column: Image Upload Area ── */}
            <div className="flex flex-col gap-5">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerDesktopUpload}
                className={`relative aspect-[3/4] w-full rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 border-2 ${
                  isDragging
                    ? 'border-zinc-900 bg-zinc-50 scale-[1.01] shadow-[0_0_40px_rgba(0,0,0,0.08)]'
                    : hasCustomImage
                    ? 'border-zinc-200 shadow-xl'
                    : 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-400 hover:bg-zinc-100/50'
                }`}
              >
                {hasCustomImage ? (
                  <>
                    <img src={originalImage} alt="Uploaded OOTD" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-center text-xs font-bold text-zinc-700 shadow">
                        클릭하여 새 사진 업로드
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isDragging ? 'bg-zinc-900 scale-110' : 'bg-zinc-200 group-hover:bg-zinc-300'}`}>
                      <ImagePlus className={`w-9 h-9 transition-colors ${isDragging ? 'text-white' : 'text-zinc-500'}`} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-600 mb-1">
                        {isDragging ? '여기에 놓으세요!' : '사진을 드래그하거나 클릭하세요'}
                      </p>
                      <p className="text-xs text-zinc-400">오늘의 OOTD 전신 사진을 올려주세요</p>
                      <p className="text-[10px] text-zinc-300 mt-1">사진은 AI 분석에만 사용되며 서버에 저장되지 않습니다</p>
                    </div>
                  </div>
                )}

                {/* Scanning Overlay */}
                {scanState === 'scanning' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      AI 스타일리스트 분석 중...
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Right Column: AI Results Panel ── */}
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="wait">
                {scanState === 'idle' && !critique && (
                  <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-5">
                      <Sparkles className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-400 mb-2">AI 리뷰 대기 중</h3>
                    <p className="text-sm text-zinc-300 dark:text-zinc-600 leading-relaxed mb-6">
                      왼쪽에 OOTD 사진을 업로드하면<br/>AI 스타일리스트가 분석을 시작합니다
                    </p>
                    {wardrobeCount === 0 && (
                      <div className="mt-2 px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3">옷장이 비어 있어요<br/>AI 코디 추천을 받으려면 먼저 옷을 등록해야 해요</p>
                        <Link href="/add-clothes">
                          <button className="px-5 py-2 bg-black text-white text-[10px] font-extrabold tracking-widest uppercase rounded-xl hover:bg-zinc-800 transition active:scale-95">
                            옷 등록하러 가기
                          </button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}

                {scanState === 'scanning' && (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full mb-5" />
                    <p className="text-sm font-bold text-zinc-500 tracking-wide">Gemini AI가 분석하고 있어요...</p>
                  </motion.div>
                )}

                {(() => {
                  const d = critique ?? partialCritique;
                  if (!d) return null;
                  const Sk = ({ w = 'full', h = 3 }: { w?: string; h?: number }) => (
                    <div className={`h-${h} w-${w} bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse`} />
                  );
                  return (
                    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }} className="flex flex-col gap-5">

                      {/* Score + Summary */}
                      <div className="flex justify-between items-start p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex-1 pr-6">
                          <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase block mb-2">AI Stylist Review</span>
                          {d.summary
                            ? <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white leading-snug break-keep text-balance">"{d.summary}"</h2>
                            : <div className="flex flex-col gap-2"><Sk /><Sk w="3/4" /></div>}
                        </div>
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                            <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#18181b" strokeWidth="4"
                              initial={{ pathLength: 0 }} animate={{ pathLength: (d.score ?? 0) / 100 }}
                              transition={{ duration: 1.2, ease: "easeOut" }} strokeDasharray="175" />
                          </svg>
                          <span className="text-xl font-black">{d.score ?? '—'}</span>
                        </div>
                      </div>

                      {/* Weather */}
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="w-4 h-4 text-zinc-400" />
                          <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800 dark:text-zinc-300">Weather Context</h3>
                        </div>
                        {d.weatherAdvice
                          ? <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{d.weatherAdvice}</p>
                          : <div className="flex flex-col gap-2"><Sk /><Sk w="5/6" /></div>}
                      </div>

                      {/* Fit & Color */}
                      <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <ScanLine className="w-4 h-4 text-zinc-400" />
                          <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800 dark:text-zinc-300">Fit & Color</h3>
                        </div>
                        {d.fitAndColor
                          ? <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{d.fitAndColor}</p>
                          : <div className="flex flex-col gap-2"><Sk /><Sk w="5/6" /></div>}
                      </div>

                      {/* Stylist Pick */}
                      <div className="p-5 bg-black rounded-2xl border border-zinc-800 flex flex-col gap-2 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Pick</h3>
                        </div>
                        {d.stylistRecommendation
                          ? <p className="text-[13px] text-white leading-relaxed font-medium">{d.stylistRecommendation}</p>
                          : <div className="flex flex-col gap-2"><div className="h-3 w-full bg-zinc-700 rounded-full animate-pulse" /><div className="h-3 w-4/5 bg-zinc-700 rounded-full animate-pulse" /></div>}
                      </div>

                      {/* Action Buttons — 스트리밍 완료 후에만 표시 */}
                      {critique && !isStreaming && (
                        <div className="flex flex-col gap-3 mt-2">
                          <button onClick={handleSaveToFeed} className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-stone-800">
                            <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                          </button>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button onClick={() => { setScanState('idle'); setCritique(null); setHasCustomImage(false); setOriginalImage(""); }}
                              className="py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-zinc-50">
                              다시 분석
                            </button>
                            <Link href="/wardrobe" className="block">
                              <button className="w-full h-full py-3.5 bg-zinc-100 border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-zinc-200">옷장 가기</button>
                            </Link>
                            <Link href="/curation" className="block">
                              <button className="w-full h-full py-3.5 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-purple-200 flex items-center justify-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                              </button>
                            </Link>
                            <button onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); router.push('/add-clothes'); } }}
                              className="py-3.5 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5 hover:bg-zinc-800">
                              AI 추출 <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (lg 미만): Camera-First Style
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden relative h-screen w-full overflow-hidden bg-[#F9F9F9] dark:bg-[#0c0c0f]">
        {/* Premium Minimalist Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#F2F2F7_100%)] dark:bg-none dark:bg-[#0c0c0f]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>

        {/* Top HUD */}
        <header className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-20">
          <button className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-zinc-800 shadow-xl hover:bg-white/80 transition shrink-0 overflow-hidden">
            {userProfile?.profile_image || user?.user_metadata?.avatar_url ? (
              <img src={userProfile?.profile_image || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          {/* 탭 스위처 */}
          <div className="flex p-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-xl">
            {(['curation', 'analysis'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className="relative flex-1 px-4 py-2 text-[10px] font-black tracking-widest uppercase rounded-full text-center"
              >
                {mobileTab === tab && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    className="absolute inset-0 bg-black rounded-full shadow-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${mobileTab === tab ? 'text-white' : 'text-zinc-500'}`}>
                  {tab === 'curation' ? 'AI 코디' : 'OOTD 분석'}
                </span>
              </button>
            ))}
          </div>

          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl border border-black/5 flex items-center justify-center text-red-400 shadow-xl hover:bg-red-50 transition shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* ── TAB: AI 코디 추천 ── */}
        <AnimatePresence mode="wait">
          {mobileTab === 'curation' && (
            <motion.div key="curation-tab"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col pt-32 pb-28 px-6 overflow-y-auto [&::-webkit-scrollbar]:hidden">

              {/* 날씨 칩 */}
              {weather && (
                <div className="flex justify-center mb-6">
                  <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full flex items-center gap-2 shadow-md">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500">{weather.temperature}°C {weather.condition.toUpperCase()}</span>
                  </div>
                </div>
              )}

              {/* 옷장 없을 때 */}
              {wardrobeCount === 0 && !isCurating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 bg-white/80 border border-zinc-200 rounded-3xl flex items-center justify-center shadow-md">
                    <Shirt className="w-7 h-7 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-zinc-700 mb-1">옷장이 비어 있어요</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">옷을 등록하면 AI가 매일 코디를 골라드려요</p>
                  </div>
                  <Link href="/add-clothes">
                    <button className="mt-2 px-6 py-3 bg-black text-white text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-lg active:scale-95 transition">
                      옷 등록하러 가기
                    </button>
                  </Link>
                </div>
              )}

              {/* 큐레이션 시작 전 */}
              {wardrobeCount > 0 && !curation && !isCurating && !curationError && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
                  <div className="w-20 h-20 bg-white/80 border border-zinc-200 rounded-3xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-9 h-9 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-zinc-800 mb-2">오늘 뭐 입지?</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      옷장 <span className="font-bold text-zinc-600">{wardrobeCount}개</span> + 오늘 날씨로<br />AI가 최적의 코디를 골라드려요
                    </p>
                  </div>
                  <button
                    onClick={generateCuration}
                    className="px-8 py-4 bg-black text-white text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-xl active:scale-95 transition flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> AI 코디 추천받기
                  </button>
                </div>
              )}

              {/* 로딩 */}
              {isCurating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full" />
                  <p className="text-sm font-bold text-zinc-500">AI 스타일리스트가 고민 중...</p>
                </div>
              )}

              {/* 에러 */}
              {curationError && !isCurating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm text-red-500 font-bold">{curationError}</p>
                  <button onClick={generateCuration}
                    className="px-6 py-3 bg-zinc-900 text-white text-[11px] font-extrabold tracking-widest uppercase rounded-xl active:scale-95 transition">
                    다시 시도
                  </button>
                </div>
              )}

              {/* 큐레이션 결과 */}
              {curation && !isCurating && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                  <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-md">
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">{curation.title}</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{curation.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 bg-zinc-100 rounded-full text-zinc-600">{curation.style}</span>
                      <span className="text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 bg-zinc-100 rounded-full text-zinc-600">{curation.colorTone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {curation.items.map((item, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center p-3">
                          <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain"
                            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
                        </div>
                        <div className="p-3">
                          <span className="text-[8px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-0.5">{item.category}</span>
                          <p className="text-xs font-bold text-zinc-800 dark:text-white line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 mt-1 mb-2">{item.reason}</p>
                          <div className="flex gap-1.5">
                            <a href={getSearchUrls(item.name).musinsa} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 px-2 py-1 bg-zinc-900 rounded-md hover:bg-zinc-700 transition active:scale-95">
                              <ExternalLink className="w-2 h-2 text-white" />
                              <span className="text-[8px] font-bold text-white">무신사</span>
                            </a>
                            <a href={getSearchUrls(item.name).cm29} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-md hover:bg-zinc-200 transition active:scale-95">
                              <ExternalLink className="w-2 h-2 text-zinc-600" />
                              <span className="text-[8px] font-bold text-zinc-700">29CM</span>
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button onClick={generateCuration} disabled={isCurating}
                    className="w-full py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-extrabold tracking-widest uppercase rounded-2xl shadow-sm active:scale-95 transition flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> 다른 코디 추천받기
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── TAB: OOTD 분석 ── */}
          {mobileTab === 'analysis' && (
            <motion.div key="analysis-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">

              {/* Idle Prompt */}
              <AnimatePresence>
                {scanState === 'idle' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-x-12 top-[25%] bottom-[30%] border-[2px] border-white/60 rounded-[3rem] pointer-events-none z-10 flex flex-col items-center justify-center gap-3 drop-shadow-md">
                    {hasCustomImage && base64Image ? (
                      <button onClick={retryAnalysis}
                        className="pointer-events-auto px-6 py-3 rounded-full bg-black text-white text-[11px] font-extrabold tracking-widest uppercase flex items-center gap-2 shadow-xl active:scale-95 transition">
                        <RefreshCw className="w-4 h-4" /> 다시 분석하기
                      </button>
                    ) : (
                      <div className="px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 text-[10px] tracking-widest font-extrabold uppercase flex items-center gap-2 shadow-lg">
                        <ScanLine className="w-4 h-4" /> 카메라 버튼을 눌러 OOTD를 촬영하세요
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanning Overlay */}
              <AnimatePresence>
                {scanState === 'scanning' && (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 pointer-events-none">
                    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="absolute inset-0 bg-white" />
                    <div className="absolute left-6 right-6 top-[15%] bottom-[15%] overflow-hidden">
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ willChange: 'transform' }}
                        className="absolute left-0 right-0 h-[1.5px] bg-black shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-8 bg-black/8 blur-[12px] rounded-full" />
                      </motion.div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        className="px-6 py-4 bg-white/95 backdrop-blur-xl rounded-full border border-zinc-200 text-black font-extrabold tracking-widest text-[11px] uppercase shadow-xl flex items-center gap-3">
                        <Sparkles className="w-4 h-4" /> 에디터 모델 분석 중...
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Result Bottom Sheet */}
              <AnimatePresence>
                {scanState === 'success' && (critique || partialCritique) && (() => {
                  const d = critique ?? partialCritique!;
                  const Sk = ({ dark = false }: { dark?: boolean }) => (
                    <div className={`flex flex-col gap-2`}>
                      <div className={`h-3 w-full rounded-full animate-pulse ${dark ? 'bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                      <div className={`h-3 w-4/5 rounded-full animate-pulse ${dark ? 'bg-zinc-700' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                    </div>
                  );
                  return (
                    <motion.div key="success" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col h-[75vh]">
                      <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 shrink-0" />
                      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 [&::-webkit-scrollbar]:hidden">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1 pr-4">
                            <span className="text-[10px] font-extrabold tracking-[0.2em] text-zinc-400 uppercase block mb-1">AI Stylist Review</span>
                            {d.summary
                              ? <h2 className="text-2xl font-black tracking-tight text-black dark:text-white leading-snug break-keep text-balance">"{d.summary}"</h2>
                              : <div className="flex flex-col gap-2 mt-1"><div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" /><div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" /></div>}
                          </div>
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                              <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#18181b" strokeWidth="4"
                                initial={{ pathLength: 0 }} animate={{ pathLength: (d.score ?? 0) / 100 }}
                                transition={{ duration: 1.2, ease: "easeOut" }} strokeDasharray="175" />
                            </svg>
                            <span className="text-xl font-black">{d.score ?? '—'}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1"><Droplets className="w-4 h-4 text-zinc-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800 dark:text-zinc-300">Weather Context</h3></div>
                            {d.weatherAdvice ? <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{d.weatherAdvice}</p> : <Sk />}
                          </div>
                          <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1"><ScanLine className="w-4 h-4 text-zinc-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-800 dark:text-zinc-300">Fit & Color</h3></div>
                            {d.fitAndColor ? <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{d.fitAndColor}</p> : <Sk />}
                          </div>
                          <div className="p-5 bg-black rounded-2xl border border-zinc-800 flex flex-col gap-2 shadow-xl">
                            <div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-yellow-400" /><h3 className="text-[11px] font-extrabold tracking-widest uppercase text-white">Stylist Pick</h3></div>
                            {d.stylistRecommendation ? <p className="text-[13px] text-white leading-relaxed font-medium">{d.stylistRecommendation}</p> : <Sk dark />}
                          </div>
                        </div>
                        {/* 버튼은 스트리밍 완료 후에만 */}
                        {critique && !isStreaming && (
                          <div className="mt-8 flex flex-col gap-3">
                            <button onClick={handleSaveToFeed} className="w-full py-4 bg-stone-900 border border-stone-800 text-white font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                              <Bookmark className="w-4 h-4" /> OOTD 피드에 저장하기
                            </button>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setScanState('idle')} className="w-full py-4 bg-white border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">다시입기</button>
                                <Link href="/wardrobe" className="block"><button className="w-full h-full py-4 bg-zinc-100 border border-zinc-200 text-zinc-800 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform">옷장 가기</button></Link>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMobileTab('curation')}
                                  className="w-full h-full py-4 bg-purple-100 border border-purple-200 text-purple-900 font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" /> 코디 추천
                                </button>
                                <button onClick={() => { if (base64Image) { sessionStorage.setItem('ootd_transfer_image', base64Image); sessionStorage.setItem('ootd_auto_start', 'true'); router.push('/add-clothes'); } }}
                                  className="w-full py-4 bg-black text-white font-extrabold tracking-tighter text-[11px] uppercase rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-0.5">
                                  AI 추출 <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Mobile Bottom Dock */}
              <AnimatePresence>
                {scanState !== 'success' && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#F9F9F9] dark:from-[#0c0c0f] via-[#F9F9F9]/80 dark:via-[#0c0c0f]/80 to-transparent z-30 pointer-events-none" />
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-24 left-0 right-0 px-10 flex items-center justify-center gap-6 z-40">
                      <button onClick={triggerGallery} className="w-14 h-14 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full flex items-center justify-center shadow-xl hover:bg-white dark:hover:bg-zinc-700 transition active:scale-95">
                        <ImagePlus className="w-6 h-6 text-zinc-700" strokeWidth={1.5} />
                      </button>
                      <div className="relative flex items-center justify-center cursor-pointer" onClick={triggerCamera}>
                        <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                          <circle cx="48" cy="48" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
                          <motion.circle cx="48" cy="48" r="45" fill="none" stroke="#000000" strokeWidth="4"
                            initial={{ pathLength: 0 }} animate={{ pathLength: scanState === 'scanning' ? 1 : 0 }}
                            transition={{ duration: 2.8, ease: "linear" }} strokeDasharray="283" />
                        </svg>
                        <div className="w-[72px] h-[72px] bg-black rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-black/10 transition-all hover:scale-105 active:scale-95">
                          <Camera className="w-8 h-8 text-white opacity-90" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="w-14 h-14" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
