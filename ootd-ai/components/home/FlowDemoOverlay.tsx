'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Check, X, ImagePlus } from 'lucide-react';

type Phase =
  | 'upload-empty'
  | 'upload-done'
  | 'scanning'
  | 'scored'
  | 'wardrobe'
  | 'cta';

const ITEMS = [
  { emoji: '👕', cat: '상의', name: '크루넥 티셔츠' },
  { emoji: '👖', cat: '하의', name: '스트레이트 데님' },
  { emoji: '👟', cat: '신발', name: '화이트 스니커즈' },
];

const STEPS = ['사진 올리기', 'AI 분석', '옷장 등록'];

const PHASE_STEP: Record<Phase, number> = {
  'upload-empty': 0, 'upload-done': 0,
  'scanning': 1, 'scored': 1,
  'wardrobe': 2, 'cta': 2,
};

export default function FlowDemoOverlay() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('upload-empty');
  const [shownItems, setShownItems] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('ootd_flow_demo_seen')) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  // 시퀀스 타이머
  useEffect(() => {
    if (!visible) return;
    setPhase('upload-empty');
    setShownItems(0);
    setScore(0);

    const timers = [
      setTimeout(() => setPhase('upload-done'), 1400),
      setTimeout(() => setPhase('scanning'),    2400),
      setTimeout(() => setPhase('scored'),      4000),
      setTimeout(() => setPhase('wardrobe'),    5600),
      setTimeout(() => setShownItems(1),        5900),
      setTimeout(() => setShownItems(2),        6400),
      setTimeout(() => setShownItems(3),        6900),
      setTimeout(() => setPhase('cta'),         7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // 점수 카운트업
  useEffect(() => {
    if (phase !== 'scored') return;
    let n = 0;
    const iv = setInterval(() => {
      n += 4;
      if (n >= 78) { setScore(78); clearInterval(iv); }
      else setScore(n);
    }, 25);
    return () => clearInterval(iv);
  }, [phase]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ootd_flow_demo_seen', 'true');
  };

  const photoVisible = !['upload-empty'].includes(phase);
  const scanVisible  = phase === 'scanning';
  const scoreVisible = ['scored', 'wardrobe', 'cta'].includes(phase);
  const wardrobePhase = ['wardrobe', 'cta'].includes(phase);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center px-6 gap-6"
        >
          {/* 닫기 */}
          <button
            onClick={dismiss}
            className="absolute top-16 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 단계 표시 */}
          <div className="flex gap-2">
            {STEPS.map((label, i) => {
              const current = PHASE_STEP[phase];
              const done = i < current;
              const active = i === current;
              return (
                <motion.div
                  key={i}
                  animate={{ scale: active ? 1.05 : 1 }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1 transition-colors ${
                    done   ? 'bg-emerald-500 text-white' :
                    active ? 'bg-white text-zinc-900' :
                             'bg-white/10 text-white/30'
                  }`}
                >
                  {done && <Check className="w-3 h-3" />}
                  {label}
                </motion.div>
              );
            })}
          </div>

          {/* 폰 목업 */}
          <div className="w-52 bg-zinc-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" style={{ height: 340 }}>

            {/* 화면 영역 */}
            <div className="mx-3 mt-3 rounded-2xl overflow-hidden relative" style={{ height: 284 }}>

              {/* ── 업로드 / 분석 화면 ── */}
              <AnimatePresence mode="wait">
                {!wardrobePhase && (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: photoVisible ? undefined : '#18181b',
                      border: photoVisible ? 'none' : '2px dashed #3f3f46',
                      borderRadius: 16,
                    }}
                  >
                    {/* 빈 업로드 상태 */}
                    {!photoVisible && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
                          <ImagePlus className="w-7 h-7 text-zinc-500" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold">사진을 올려주세요</span>
                      </motion.div>
                    )}

                    {/* 사진 슬라이드 인 */}
                    {photoVisible && (
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        className="absolute inset-0 bg-gradient-to-b from-zinc-500 via-zinc-700 to-zinc-800 rounded-2xl overflow-hidden"
                      >
                        {/* 실루엣 */}
                        <div className="absolute inset-0 flex flex-col items-center pt-6 gap-1.5 opacity-20">
                          <div className="w-10 h-10 bg-white rounded-full" />
                          <div className="w-20 h-16 bg-white rounded-xl" />
                          <div className="w-16 h-20 bg-white/70 rounded-xl" />
                          <div className="flex gap-2">
                            <div className="w-7 h-10 bg-white/50 rounded-lg" />
                            <div className="w-7 h-10 bg-white/50 rounded-lg" />
                          </div>
                        </div>

                        {/* 스캔라인 */}
                        {scanVisible && (
                          <motion.div
                            initial={{ top: '0%' }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute left-0 right-0 h-[2px] bg-white/90 z-10"
                            style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.6)' }}
                          />
                        )}

                        {/* 점수 배지 */}
                        {scoreVisible && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className="absolute top-3 right-3 bg-black/65 backdrop-blur-md rounded-xl px-2.5 py-2 text-center"
                          >
                            <span className="text-2xl font-black text-white leading-none">{score}</span>
                            <span className="text-[8px] text-white/50 block font-bold tracking-widest uppercase">점</span>
                          </motion.div>
                        )}

                        {/* 헤드라인 */}
                        {scoreVisible && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute bottom-3 left-3 right-3"
                          >
                            <p className="text-[11px] font-extrabold text-white drop-shadow leading-snug">"스타일이 좋아요!"</p>
                          </motion.div>
                        )}

                        {/* 업로드 완료 체크 */}
                        {phase === 'upload-done' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                            className="absolute bottom-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── 옷장 등록 화면 ── */}
                {wardrobePhase && (
                  <motion.div
                    key="wardrobe"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    className="absolute inset-0 bg-zinc-950 rounded-2xl p-3 flex flex-col gap-2 justify-center"
                  >
                    <p className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase mb-1">옷장에 등록 중</p>
                    {ITEMS.slice(0, shownItems).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex items-center gap-2.5 bg-zinc-800 rounded-xl p-2.5"
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">{item.cat}</p>
                          <p className="text-[11px] text-white font-bold truncate">{item.name}</p>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.15, type: 'spring', stiffness: 500 }}
                          className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 하단 상태바 */}
            <div className="h-[calc(340px-284px-12px)] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'upload-empty' && (
                  <motion.p key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] text-zinc-600 font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3" /> 사진 업로드 대기
                  </motion.p>
                )}
                {phase === 'upload-done' && (
                  <motion.p key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> 사진 준비 완료
                  </motion.p>
                )}
                {phase === 'scanning' && (
                  <motion.p key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] text-white font-bold flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    AI 착장 분석 중...
                  </motion.p>
                )}
                {phase === 'scored' && (
                  <motion.p key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] text-yellow-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 분석 완료!
                  </motion.p>
                )}
                {wardrobePhase && (
                  <motion.p key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> 옷장 자동 등록 완료
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA */}
          <AnimatePresence>
            {phase === 'cta' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-3 w-full"
              >
                <p className="text-white font-extrabold text-[15px] text-center leading-snug">
                  지금 바로 시작해볼까요?
                </p>
                <button
                  onClick={dismiss}
                  className="w-full max-w-xs py-3.5 bg-white text-zinc-900 font-extrabold text-[11px] tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition shadow-xl"
                >
                  <Camera className="w-4 h-4" /> 첫 착장 찍으러 가기
                </button>
                <button onClick={dismiss} className="text-[11px] text-white/30 font-semibold">
                  건너뛰기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
