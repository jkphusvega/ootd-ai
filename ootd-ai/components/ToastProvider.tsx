'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    error: <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />,
    success: <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />,
    info: <Info className="w-4 h-4 shrink-0 text-blue-500" />,
  };

  const bg: Record<ToastType, string> = {
    error: 'border-red-200 bg-red-50',
    success: 'border-emerald-200 bg-emerald-50',
    info: 'border-zinc-200 bg-white',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[min(90vw,380px)] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg pointer-events-auto ${bg[t.type]}`}
            >
              {icons[t.type]}
              <p className="flex-1 text-sm font-medium text-zinc-800 leading-snug whitespace-pre-line">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-600 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
