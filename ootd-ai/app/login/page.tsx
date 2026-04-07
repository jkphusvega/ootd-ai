'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message);
      setIsLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError('소셜 로그인 연결 중 오류가 발생했습니다: ' + error.message);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-zinc-900 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-stone-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-stone-300/30 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black tracking-tight text-black mb-2 flex items-center justify-center gap-2">
              <span className="bg-black text-white px-3 py-1 rounded-xl">OOTD</span> AI
            </h1>
          </Link>
          <p className="text-sm font-semibold text-zinc-500 tracking-widest uppercase">당신만의 퍼스널 AI 옷장</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/60 p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          
          <h2 className="text-xl font-extrabold text-zinc-800 mb-6">로그인</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center justify-center text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소" 
                required
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호" 
                required
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl text-sm font-medium transition-all outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 bg-black text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '이메일로 시작하기'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-zinc-200" />
            <span className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">또는 간편 로그인</span>
            <div className="h-[1px] flex-1 bg-zinc-200" />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleOAuthLogin('kakao')}
              type="button"
              className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-extrabold text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#FEE500]"
            >
               카카오로 3초 만에 시작하기
            </button>
            <button 
              onClick={() => handleOAuthLogin('google')}
              type="button"
              className="w-full bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-extrabold text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 계속하기
            </button>
          </div>

        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500 font-medium">
            아직 계정이 없으신가요? <Link href="/signup" className="text-black font-extrabold hover:underline ml-1">이메일로 가입하기</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
