'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError('비밀번호 재설정 이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-stone-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-stone-300/30 dark:bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">비밀번호 재설정</h1>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          {sent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{email}</span>으로<br />
                재설정 링크를 발송했습니다.<br />이메일을 확인해주세요.
              </p>
              <Link href="/login" className="mt-2 w-full bg-black dark:bg-white text-white dark:text-zinc-900 font-bold tracking-widest uppercase text-xs py-4 rounded-xl flex items-center justify-center shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition">
                로그인으로 돌아가기
              </Link>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입한 이메일 주소"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-black dark:bg-white text-white dark:text-zinc-900 font-bold tracking-widest uppercase text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '재설정 링크 보내기'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> 로그인으로 돌아가기
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
