'use client';
import { motion } from 'framer-motion';
import type { ItemAnnotation } from '../../hooks/useOotdAnalysis';

// y% = 전신 사진 기준 해당 신체 부위 위치 (얼굴보다 아래에서 시작)
const ZONE_Y: Record<string, number> = { head: 12, upper: 33, mid: 49, lower: 65, feet: 84 };

export default function AnnotationOverlay({ annotations }: { annotations: ItemAnnotation[] }) {
  const sorted = [...annotations].sort((a, b) => (ZONE_Y[a.zone] ?? 50) - (ZONE_Y[b.zone] ?? 50));

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
    >
      {sorted.map((ann, i) => {
        const y = ZONE_Y[ann.zone] ?? 50;
        const isLeft = i % 2 === 0;
        const isStrength = ann.type === 'strength';
        const dotColor = isStrength ? '#16a34a' : '#d97706';
        const bgColor = isStrength ? 'rgba(22,163,74,0.88)' : 'rgba(217,119,6,0.88)';

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: isLeft ? -6 : 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.12, duration: 0.35, ease: 'easeOut' }}
          >
            {/* Dot */}
            <div
              className="absolute rounded-full border-[2px] border-white"
              style={{
                width: 10, height: 10,
                left: '50%', top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                background: dotColor,
                boxShadow: `0 0 0 3px ${dotColor}40, 0 1px 4px rgba(0,0,0,0.4)`,
              }}
            />
            {/* Line */}
            <div
              className="absolute"
              style={{
                height: 1.5,
                top: `${y}%`,
                background: `linear-gradient(${isLeft ? 'to left' : 'to right'}, transparent, ${dotColor}cc)`,
                ...(isLeft
                  ? { left: '35%', right: '50%' }
                  : { left: '50%', right: '33%' }
                ),
              }}
            />
            {/* Badge */}
            <div
              className="absolute flex items-center gap-1.5 rounded-xl text-white font-semibold shadow-lg max-w-[32%]"
              style={{
                fontSize: 10,
                lineHeight: 1.3,
                padding: '5px 9px',
                top: `${y}%`,
                transform: 'translateY(-50%)',
                background: bgColor,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                ...(isLeft ? { left: '2%' } : { right: '2%' }),
              }}
            >
              <span style={{ fontSize: 9, flexShrink: 0 }}>{isStrength ? '✓' : '!'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ann.text}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
