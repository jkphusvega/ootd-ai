'use client';
import { useState, useRef, useCallback } from 'react';
import { logEvent } from '../lib/analytics';

export interface FashionCritique {
  score: number;
  headline: string;
  tips: string[];
}

interface WeatherInfo { temperature: number; condition: string; }
interface UserProfile { [key: string]: unknown; }
type ToastFn = (msg: string, type: 'success' | 'error' | 'info') => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export function useOotdAnalysis({
  user,
  weather,
  userProfile,
  supabase,
  toast,
}: {
  user: { id: string } | null;
  weather: WeatherInfo | null;
  userProfile: UserProfile | null;
  supabase: SupabaseClient;
  toast: ToastFn;
}) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [critique, setCritique] = useState<FashionCritique | null>(null);
  const [originalImage, setOriginalImage] = useState('');
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [partialCritique, setPartialCritique] = useState<Partial<FashionCritique> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  const extractPartialFields = (text: string): Partial<FashionCritique> => {
    const r: Partial<FashionCritique> = {};
    const scoreM = text.match(/"score"\s*:\s*(\d+)/);
    if (scoreM) r.score = parseInt(scoreM[1]);
    const headlineM = text.match(/"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (headlineM) r.headline = headlineM[1].replace(/\\"/g, '"');
    const tipsM = text.match(/"tips"\s*:\s*\[([\s\S]*?)\]/);
    if (tipsM) {
      const items = [...tipsM[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1].replace(/\\"/g, '"'));
      if (items.length) r.tips = items;
    }
    return r;
  };

  const compressImage = (file: File, maxDim = 1024, quality = 0.85): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
          else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const runAnalysis = async (compressed: string) => {
    const res = await fetch('/api/analyze-ootd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: compressed,
        weatherInfo: weather || { temperature: 20, condition: 'Clear' },
        userProfile: userProfile || null,
      }),
    });
    if (!res.ok || !res.body) {
      const errData = await res.json().catch(() => ({ error: 'AI 분석 중 오류가 발생했습니다.' }));
      if (res.status === 429) setIsRateLimited(true);
      toast(errData.error || 'AI 분석 중 오류가 발생했습니다.', 'error');
      setScanState('idle');
      return;
    }
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
    if (!jsonMatch) {
      toast('AI 응답을 읽을 수 없습니다. 다시 시도해주세요.', 'error');
      setScanState('idle'); setIsStreaming(false); setPartialCritique(null);
      return;
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) {
      toast(parsed.error, 'error');
      setScanState('idle'); setIsStreaming(false); setPartialCritique(null);
      return;
    }
    setCritique(parsed); setPartialCritique(null); setIsStreaming(false); setScanState('success');
    if (user) logEvent(user.id, 'ootd_analyzed', { score: parsed.score, weather_condition: weather?.condition, temperature: weather?.temperature });
  };

  const processFile = async (file: File) => {
    if (scanState === 'scanning' || isRateLimited) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('사진 용량이 너무 큽니다!\n10MB 이하의 사진을 사용해주세요.', 'error');
      return;
    }
    setOriginalImage(URL.createObjectURL(file));
    setHasCustomImage(true);
    const fullBase64 = await new Promise<string>(resolve => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setBase64Image(fullBase64);
    const compressed = await compressImage(file);
    setScanState('scanning'); setPartialCritique(null); setIsStreaming(false); setCritique(null);
    try { await runAnalysis(compressed); }
    catch { toast('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error'); setScanState('idle'); }
  };

  const retryAnalysis = async () => {
    if (!base64Image) return;
    setScanState('scanning'); setPartialCritique(null); setIsStreaming(false); setCritique(null);
    try {
      const blob = await (await fetch(base64Image)).blob();
      const compressed = await compressImage(new File([blob], 'retry.jpg', { type: blob.type }));
      await runAnalysis(compressed);
    } catch { toast('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error'); setScanState('idle'); }
  };

  const handleSaveToFeed = async () => {
    if (!base64Image || !critique || !user) return;
    setScanState('scanning');
    try {
      const base64Data = base64Image.split(',')[1];
      const mimeMatch = base64Image.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
      const byteCharacters = atob(base64Data);
      const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.charCodeAt(i));
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
      const fileName = `ootd_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error: uploadError } = await supabase.storage.from('clothes').upload(fileName, blob, { contentType: mimeType });
      if (uploadError) throw new Error('업로드 에러: ' + uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from('clothes').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('clothes').insert({
        category: 'ootd_feed',
        name: JSON.stringify({ score: critique.score, headline: critique.headline, tips: critique.tips }),
        image_url: publicUrl,
        user_id: user.id,
      });
      if (dbError) throw new Error('DB 에러: ' + dbError.message);
      toast('OOTD 갤러리에 저장되었습니다!\n(마이옷장 → OOTD Feeds 탭에서 확인하세요)', 'success');
      logEvent(user.id, 'ootd_saved_to_feed', { score: critique.score });
      setScanState('success');
    } catch (e: unknown) {
      toast('저장 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'), 'error');
      setScanState('success');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    await processFile(e.target.files[0]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) await processFile(file);
  }, [weather, userProfile]);

  const resetAnalysis = () => {
    setScanState('idle'); setCritique(null); setHasCustomImage(false); setOriginalImage(''); setBase64Image(null);
  };

  return {
    scanState, setScanState,
    critique, partialCritique,
    originalImage, hasCustomImage, base64Image,
    isStreaming, isRateLimited, isDragging,
    fileInputRef, galleryInputRef, desktopFileInputRef,
    handleFileChange, handleDragOver, handleDragLeave, handleDrop,
    processFile, retryAnalysis, handleSaveToFeed, resetAnalysis,
    triggerCamera: () => fileInputRef.current?.click(),
    triggerGallery: () => galleryInputRef.current?.click(),
    triggerDesktopUpload: () => desktopFileInputRef.current?.click(),
  };
}
