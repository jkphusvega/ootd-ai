'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message;
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('이미 가입된 이메일입니다. 로그인해주세요.');
      } else if (msg.includes('invalid') || msg.includes('valid email')) {
        setError('유효하지 않은 이메일 형식입니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background elements */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-stone-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-96 h-96 bg-stone-300/30 dark:bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black tracking-tight text-black dark:text-white mb-2 flex items-center justify-center gap-2">
              <span className="bg-black text-white px-3 py-1 rounded-xl">OOTD</span> AI
            </h1>
          </Link>
          <p className="text-sm font-semibold text-zinc-500 tracking-widest uppercase">나만의 패션 비서 가입하기</p>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)]">

          <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 mb-6">회원가입</h2>

          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm text-center text-zinc-600 font-bold mb-6 leading-relaxed">
                가입 확인 이메일을 발송했습니다.<br/>이메일을 확인하고 링크를 클릭해주세요!
              </p>
              <Link href="/login" className="w-full bg-black text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl flex items-center justify-center text-center shadow-lg hover:bg-zinc-800 transition">
                로그인 화면으로 돌아가기
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex flex-col items-center text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (6자리 이상)"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 확인"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 bg-black dark:bg-white text-white dark:text-zinc-900 font-bold tracking-widest uppercase text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '회원가입 완료'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}

        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500 font-medium">
            이미 계정이 있으신가요? <Link href="/login" className="text-black dark:text-white font-extrabold hover:underline ml-1">로그인하기</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
