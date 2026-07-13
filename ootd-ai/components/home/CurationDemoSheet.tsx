'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import Link from 'next/link';

const DEMO_ITEMS = [
  { emoji: '👕', category: '상의', name: '오버핏 크루넥 티셔츠', reason: '시즌리스 아이템으로 어떤 하의와도 잘 어울려요' },
  { emoji: '👖', category: '하의', name: '슬림 스트레이트 데님', reason: '발목이 깔끔하게 보여 키가 커 보이는 효과가 있어요' },
  { emoji: '👟', category: '신발', name: '클린 화이트 스니커즈', reason: '밝은 신발로 전체 룩을 가볍게 마무리해줘요' },
];

type Phase = 'loading' | 'title' | 'items' | 'done';

export default function CurationDemoSheet() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [shownItems, setShownItems] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('ootd_demo_seen')) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // 애니메이션 시퀀스
  useEffect(() => {
    if (!visible) return;
    setPhase('loading');
    setShownItems(0);

    const t1 = setTimeout(() => setPhase('title'), 1800);
    const t2 = setTimeout(() => { setPhase('items'); setShownItems(1); }, 2600);
    const t3 = setTimeout(() => setShownItems(2), 3200);
    const t4 = setTimeout(() => setShownItems(3), 3800);
    const t5 = setTimeout(() => setPhase('done'), 4400);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ootd_demo_seen', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-40"
            onClick={dismiss}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 rounded-t-3xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-3">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-extrabold tracking-widest text-indigo-500 uppercase">AI 코디 추천 미리보기</span>
                  </div>
                  <p className="text-[13px] font-extrabold text-zinc-800 dark:text-zinc-100">
                    옷 5장이면 이런 추천을 매일 받아요
                  </p>
                </div>
                <button onClick={dismiss} className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 데모 카드 */}
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 mb-4 min-h-[200px]">

                {/* Phase: 로딩 */}
                <AnimatePresence mode="wait">
                  {phase === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 gap-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-indigo-500 rounded-full"
                      />
                      <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500"
                      >
                        AI 스타일리스트가 고민 중...
                      </motion.p>
                    </motion.div>
                  )}

                  {/* Phase: 제목 + 아이템 */}
                  {(phase === 'title' || phase === 'items' || phase === 'done') && (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-3"
                      >
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white mb-1">미니멀 캐주얼 데일리룩</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">오늘 기온에 딱 맞는 깔끔한 조합이에요. 어디서든 잘 어울려요.</p>
                        <div className="flex gap-1.5 mt-2">
                          {['미니멀', '모노톤'].map(tag => (
                            <span key={tag} className="text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">{tag}</span>
                          ))}
                        </div>
                      </motion.div>

                      <div className="flex flex-col gap-2">
                        {DEMO_ITEMS.slice(0, shownItems).map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700"
                          >
                            <span className="text-lg shrink-0">{item.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block">{item.category}</span>
                              <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</p>
                            </div>
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                              className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                            >
                              <span className="text-white text-[9px] font-black">✓</span>
                            </motion.div>
                          </motion.div>
                        ))}

                        {/* 로딩 중인 다음 아이템 placeholder */}
                        {shownItems < DEMO_ITEMS.length && phase === 'items' && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700"
                          >
                            <div className="w-7 h-7 bg-zinc-100 dark:bg-zinc-700 rounded-lg animate-pulse" />
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className="h-2 w-8 bg-zinc-100 dark:bg-zinc-700 rounded-full animate-pulse" />
                              <div className="h-2.5 w-28 bg-zinc-100 dark:bg-zinc-700 rounded-full animate-pulse" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA */}
              <AnimatePresence>
                {phase === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link href="/add-clothes" onClick={dismiss}>
                      <button className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-zinc-900 font-extrabold text-[11px] tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition shadow-lg mb-2">
                        <Sparkles className="w-3.5 h-3.5" /> 옷 등록 시작하기
                      </button>
                    </Link>
                    <button onClick={dismiss} className="w-full py-2.5 text-[11px] text-zinc-400 font-semibold">
                      나중에 할게요
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
