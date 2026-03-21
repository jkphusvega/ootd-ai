'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';

export interface LookbookCard {
  id: string;
  title: string;
  image: string;
  tags: string[];
}

interface SwipeCardProps {
  card: LookbookCard;
  isFront: boolean;
  onSwipe: (id: string, dir: 'left' | 'right') => void;
}

export function SwipeCard({ card, isFront, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  
  // Like/Nope Overlay Opacity
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe(card.id, 'right');
    } else if (info.offset.x < -100) {
      onSwipe(card.id, 'left');
    }
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing origin-bottom"
      style={{ x, rotate, opacity }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ scale: isFront ? 1 : 0.95, y: isFront ? 0 : 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div 
        className="w-full h-full bg-cover bg-center rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative" 
        style={{ backgroundImage: `url(${card.image})` }}
      >
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
        
        {/* Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
          <div className="border-4 border-emerald-400 rounded-full p-6 transform rotate-12 shadow-[0_0_30px_rgba(16,185,129,0.5)] bg-black/20">
            <Check className="w-20 h-20 text-emerald-400" strokeWidth={4} />
          </div>
          <h2 className="text-4xl font-extrabold text-emerald-400 mt-4 tracking-wider uppercase transform rotate-12 shadow-sm drop-shadow-lg">LIKE</h2>
        </motion.div>
        
        <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 bg-rose-500/20 flex flex-col items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
          <div className="border-4 border-rose-400 rounded-full p-6 transform -rotate-12 shadow-[0_0_30px_rgba(244,63,94,0.5)] bg-black/20">
            <X className="w-20 h-20 text-rose-400" strokeWidth={4} />
          </div>
          <h2 className="text-4xl font-extrabold text-rose-400 mt-4 tracking-wider uppercase transform -rotate-12 shadow-sm drop-shadow-lg">NOPE</h2>
        </motion.div>

        {/* Card Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-3 z-0">
          <h3 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{card.title}</h3>
          <div className="flex flex-wrap gap-2">
            {card.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-sm text-white font-medium border border-white/20 shadow-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
