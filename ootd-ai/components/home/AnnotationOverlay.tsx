'use client';
import { motion } from 'framer-motion';
import type { ItemAnnotation } from '../../hooks/useOotdAnalysis';

const ZONE_Y: Record<string, number> = { head: 8, upper: 25, mid: 42, lower: 60, feet: 80 };

export default function AnnotationOverlay({ annotations }: { annotations: ItemAnnotation[] }) {
  const sorted = [...annotations].sort((a, b) => (ZONE_Y[a.zone] ?? 50) - (ZONE_Y[b.zone] ?? 50));
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {sorted.map((ann, i) => {
          const y = ZONE_Y[ann.zone] ?? 50;
          const isLeft = i % 2 === 0;
          const lineEndX = isLeft ? 37 : 63;
          const color = ann.type === 'strength' ? '#22c55e' : '#f59e0b';
          return (
            <g key={i}>
              <circle cx={50} cy={y} r="2" fill={color} opacity="0.85" />
              <circle cx={50} cy={y} r="0.9" fill="white" />
              <line x1={50} y1={y} x2={lineEndX} y2={y} stroke={color} strokeWidth="0.4" opacity="0.8" />
              <circle cx={lineEndX} cy={y} r="0.7" fill={color} />
            </g>
          );
        })}
      </svg>
      {sorted.map((ann, i) => {
        const y = ZONE_Y[ann.zone] ?? 50;
        const isLeft = i % 2 === 0;
        const isStrength = ann.type === 'strength';
        return (
          <div
            key={i}
            className={`absolute flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold backdrop-blur-md leading-tight max-w-[34%]
              ${isStrength ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'}`}
            style={{
              top: `${y}%`,
              transform: 'translateY(-50%)',
              ...(isLeft ? { left: '2%' } : { right: '2%' }),
              boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
            }}
          >
            <span className="shrink-0">{isStrength ? '✓' : '↑'}</span>
            <span className="truncate">{ann.text}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
