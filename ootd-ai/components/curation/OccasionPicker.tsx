'use client';

const OCCASIONS = [
  { id: 'daily', label: '일상', emoji: '☀️' },
  { id: 'work', label: '출근', emoji: '💼' },
  { id: 'date', label: '데이트', emoji: '🌹' },
  { id: 'outdoor', label: '야외활동', emoji: '🏃' },
  { id: 'formal', label: '격식있는 자리', emoji: '🎩' },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}

export { OCCASIONS };

export default function OccasionPicker({ value, onChange, compact = false }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {OCCASIONS.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`flex items-center gap-2 rounded-full font-bold transition-all ${
            compact
              ? 'px-3 py-1.5 text-xs'
              : 'px-4 py-2.5 text-sm'
          } ${
            value === o.id
              ? `bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md ${compact ? '' : 'scale-105'}`
              : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
          }`}>
          <span>{o.emoji}</span> {o.label}
        </button>
      ))}
    </div>
  );
}
