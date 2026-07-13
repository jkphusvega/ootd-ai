'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Callout {
  label: string;
  desc: string;
  dotStyle: React.CSSProperties;
  lineStyle: React.CSSProperties;
  lineOrientation: 'vertical' | 'horizontal';
  bubbleStyle: React.CSSProperties;
}

const CALLOUTS: Callout[] = [
  // 삭제 버튼 — 우상단, 말풍선 아래
  {
    label: '삭제 모드',
    desc: '탭하면 아이템을 하나씩\n삭제할 수 있어요',
    dotStyle:    { top: 62, right: 26 },
    lineStyle:   { top: 80, right: 44, height: 26, width: 2 },
    lineOrientation: 'vertical',
    bubbleStyle: { top: 106, right: 10 },
  },
  // OOTD Feeds 탭 — 탭이 화면 중앙 우측에 있으므로 말풍선은 왼쪽, 수평선으로 연결
  {
    label: 'OOTD Feeds',
    desc: '저장한 착장 기록과\n과거 OOTD를 돌아봐요',
    dotStyle:    { top: 130, left: '60%' },
    // 수평 점선: 말풍선 오른쪽 끝(~180px)에서 dot 왼쪽까지
    lineStyle:   { top: 129, left: 180, right: 'calc(40% + 8px)', height: 2 },
    lineOrientation: 'horizontal',
    bubbleStyle: { top: 106, left: 10 },
  },
  // FAB — 우하단, 말풍선 위
  {
    label: '새 옷 추가',
    desc: '사진 한 장이면 AI가\n상의·하의·아우터를\n자동으로 분류해줘요',
    dotStyle:    { bottom: 100, right: 26 },
    lineStyle:   { bottom: 152, right: 44, height: 52, width: 2 },
    lineOrientation: 'vertical',
    bubbleStyle: { bottom: 200, right: 10 },
  },
];

export default function WardrobeGuideOverlay() {
  const [visible, setVisible] = useState(false);
  const [shownCount, setShownCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('ootd_wardrobe_guide_seen')) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setShownCount(0);
    const timers = [
      setTimeout(() => setShownCount(1), 300),
      setTimeout(() => setShownCount(2), 750),
      setTimeout(() => setShownCount(3), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ootd_wardrobe_guide_seen', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60"
        >
          {CALLOUTS.map((c, i) => (
            <AnimatePresence key={i}>
              {shownCount > i && (
                <>
                  {/* 점 */}
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="fixed w-4 h-4 rounded-full border-2 border-white bg-white/30 -translate-x-1/2 -translate-y-1/2"
                    style={c.dotStyle}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                      transition={{ duration: 1.3, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-white"
                    />
                  </motion.div>

                  {/* 점선 */}
                  {c.lineOrientation === 'vertical' ? (
                    <motion.div
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                      className="fixed origin-top"
                      style={{
                        ...c.lineStyle,
                        borderLeft: '2px dashed rgba(255,255,255,0.5)',
                      }}
                    />
                  ) : (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                      className="fixed origin-left"
                      style={{
                        ...c.lineStyle,
                        borderTop: '2px dashed rgba(255,255,255,0.5)',
                      }}
                    />
                  )}

                  {/* 말풍선 */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="fixed bg-white rounded-2xl px-3.5 py-2.5 shadow-xl"
                    style={{ ...c.bubbleStyle, maxWidth: 168 }}
                  >
                    <p className="text-[11px] font-extrabold text-zinc-900 mb-0.5">{c.label}</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed whitespace-pre-line">{c.desc}</p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          ))}

          {/* 확인 버튼 */}
          <AnimatePresence>
            {shownCount >= CALLOUTS.length && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 left-0 right-0 flex justify-center"
              >
                <button
                  onClick={dismiss}
                  className="px-8 py-3.5 bg-white text-zinc-900 font-extrabold text-[11px] tracking-widest uppercase rounded-2xl shadow-2xl active:scale-95 transition"
                >
                  확인했어요
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
