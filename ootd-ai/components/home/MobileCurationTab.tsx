'use client';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, RefreshCw, ExternalLink, Shirt } from 'lucide-react';
import Link from 'next/link';
import type { CurationResult } from '../../hooks/useMobileCuration';

interface WeatherInfo { temperature: number; condition: string; }

interface Props {
  weather: WeatherInfo | null;
  wardrobeCount: number;
  curation: CurationResult | null;
  isCurating: boolean;
  curationError: string | null;
  generateCuration: () => void;
}

const getSearchUrls = (name: string) => {
  const q = encodeURIComponent(name);
  return {
    musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
    cm29: `https://www.29cm.co.kr/search?query=${q}`,
  };
};

export default function MobileCurationTab({ weather, wardrobeCount, curation, isCurating, curationError, generateCuration }: Props) {
  return (
    <motion.div
      key="curation-tab"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col pt-32 pb-28 px-6 overflow-y-auto [&::-webkit-scrollbar]:hidden"
    >
      {weather && (
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full flex items-center gap-2 shadow-md">
            <MapPin className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500">{weather.temperature}°C {weather.condition.toUpperCase()}</span>
          </div>
        </div>
      )}

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

      {isCurating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full" />
          <p className="text-sm font-bold text-zinc-500">AI 스타일리스트가 고민 중...</p>
        </div>
      )}

      {curationError && !isCurating && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-red-500 font-bold">{curationError}</p>
          <button onClick={generateCuration}
            className="px-6 py-3 bg-zinc-900 text-white text-[11px] font-extrabold tracking-widest uppercase rounded-xl active:scale-95 transition">
            다시 시도
          </button>
        </div>
      )}

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
  );
}
