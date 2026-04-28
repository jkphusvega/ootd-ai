'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Home, Shirt, Sparkles, Settings, BarChart3, ShoppingBag, Share2, MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 데스크탑 사이드바에 표시될 항목
const DESKTOP_NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/wardrobe', label: '옷장', icon: Shirt },
  { href: '/curation', label: '큐레이션', icon: Sparkles },
  { href: '/stats', label: '통계', icon: BarChart3 },
  { href: '/shopping', label: 'AI 쇼핑', icon: ShoppingBag },
  { href: '/share', label: '옷장 공유', icon: Share2 },
  { href: '/settings', label: '설정', icon: Settings },
];

// 모바일 하단 탭바에 표시될 항목
const MOBILE_NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/wardrobe', label: '옷장', icon: Shirt },
  { href: '/curation', label: '코디', icon: Sparkles },
  { href: '/settings', label: '설정', icon: Settings },
];

// 모바일 "더보기" 메뉴에 표시될 항목
const MORE_NAV = [
  { href: '/stats', label: '스타일 통계', icon: BarChart3, desc: 'OOTD 점수·착장 빈도 분석' },
  { href: '/shopping', label: 'AI 쇼핑 추천', icon: ShoppingBag, desc: '부족한 아이템 추천' },
  { href: '/share', label: '옷장 공유', icon: Share2, desc: '친구에게 옷장 보여주기' },
];

// 네비게이션을 숨길 페이지 경로
const HIDDEN_PATHS = ['/login', '/signup', '/onboarding', '/auth', '/landing-minimal', '/landing-impact', '/shared'];

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 경로 변경 시 더보기 메뉴 닫기
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  // 외부 클릭 시 더보기 메뉴 닫기
  useEffect(() => {
    if (!showMore) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  // 로그인, 회원가입, 온보딩 등에서는 네비게이션 숨김
  // 비로그인 상태에서 홈(/)은 랜딩 페이지를 표시하므로 숨김
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;
  if (pathname === '/' && !user) return null;

  // 더보기 메뉴 항목 중 현재 활성 경로가 있는지 확인
  const isMoreActive = MORE_NAV.some(item => pathname === item.href);

  return (
    <>
      {/* ============ DESKTOP: Left Sidebar (lg 이상) ============ */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-200/80 dark:border-zinc-800/80 flex-col z-50">
        {/* Logo */}
        <div className="px-6 pt-8 pb-3">
          <Link href="/" className="flex flex-col items-start gap-1">
            <img src="/logo.png" alt="OOTD Logo" className="w-[100px] h-auto object-contain dark:invert" />
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-zinc-400 uppercase ml-1">AI Stylist</p>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-zinc-100" />

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {DESKTOP_NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[13px] tracking-wide ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-5 border-t border-zinc-100">
          <p className="text-[9px] font-bold tracking-[0.12em] text-zinc-300 uppercase text-center">
            Powered by Gemini AI
          </p>
        </div>
      </aside>

      {/* ============ MOBILE: Bottom Tab Bar (lg 미만) ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* 더보기 팝오버 메뉴 */}
        <AnimatePresence>
          {showMore && (
            <>
              {/* 배경 오버레이 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={() => setShowMore(false)}
              />
              {/* 메뉴 패널 */}
              <motion.div
                ref={moreRef}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed bottom-[calc(env(safe-area-inset-bottom,6px)+72px)] right-4 left-4 z-50 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-2"
              >
                <div className="flex items-center justify-between px-3 pt-2 pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-400">더보기</span>
                  <button onClick={() => setShowMore(false)} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
                {MORE_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}>
                      <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-white'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700'
                      }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-white/20 dark:bg-black/20' : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}>
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400'}`} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${isActive ? 'text-white dark:text-black' : 'text-zinc-800 dark:text-zinc-200'}`}>{item.label}</p>
                          <p className={`text-[10px] ${isActive ? 'text-white/60 dark:text-black/50' : 'text-zinc-400'}`}>{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="bg-white/85 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-zinc-800/40 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
            {MOBILE_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center gap-0.5 py-1">
                    <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-black dark:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)]'
                        : ''
                    }`}>
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-white dark:text-black' : 'text-zinc-400'}`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <span className={`text-[9px] tracking-wider transition-colors duration-200 ${
                      isActive ? 'text-black dark:text-white font-extrabold' : 'text-zinc-400 font-medium'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* 더보기 버튼 */}
            <button onClick={() => setShowMore(!showMore)} className="flex-1">
              <div className="flex flex-col items-center gap-0.5 py-1">
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isMoreActive || showMore
                    ? 'bg-black dark:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)]'
                    : ''
                }`}>
                  <MoreHorizontal
                    className={`w-5 h-5 transition-all duration-200 ${isMoreActive || showMore ? 'text-white dark:text-black' : 'text-zinc-400'}`}
                    strokeWidth={isMoreActive || showMore ? 2.2 : 1.8}
                  />
                </div>
                <span className={`text-[9px] tracking-wider transition-colors duration-200 ${
                  isMoreActive || showMore ? 'text-black dark:text-white font-extrabold' : 'text-zinc-400 font-medium'
                }`}>
                  더보기
                </span>
              </div>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
