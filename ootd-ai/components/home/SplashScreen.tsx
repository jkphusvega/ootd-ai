'use client';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-[#FDFDFC] dark:bg-[#1a1a1e] flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center"
      >
        <img src="/logo.png" alt="OOTD Logo" className="w-[60vw] md:w-64 h-auto object-contain dark:invert" />
      </motion.div>
    </motion.div>
  );
}
