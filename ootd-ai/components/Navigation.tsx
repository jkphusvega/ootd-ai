'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Shirt, Zap, BookOpen, Scissors, Sparkles, Settings } from 'lucide-react';

// 데스크탑 사이드바에 표시될 항목
const DESKTOP_NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/wardrobe', label: '옷장', icon: Shirt },
  { href: '/curation', label: '큐레이션', icon: Zap },
  { href: '/journal', label: '저널', icon: BookOpen },
  { href: '/test-bg', label: 'AI 추출', icon: Scissors },
  { href: '/settings', label: '설정', icon: Settings },
];

// 모바일 하단 탭바에 표시될 항목 (5개 제한 — 핵심 기능만)
const MOBILE_NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/wardrobe', label: '옷장', icon: Shirt },
  { href: '/curation', label: '코디', icon: Sparkles },
  { href: '/journal', label: '저널', icon: BookOpen },
  { href: '/settings', label: '설정', icon: Settings },
];

// 네비게이션을 숨길 페이지 경로
const HIDDEN_PATHS = ['/login', '/signup', '/onboarding', '/auth'];

export default function Navigation() {
  const pathname = usePathname();

  // 로그인, 회원가입, 온보딩 등에서는 네비게이션 숨김
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  return (
    <>
      {/* ============ DESKTOP: Left Sidebar (lg 이상) ============ */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] bg-white/80 backdrop-blur-xl border-r border-zinc-200/80 flex-col z-50">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold tracking-tight text-zinc-900 leading-none">OOTD AI</h1>
              <p className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase mt-0.5">AI Stylist</p>
            </div>
          </div>
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
                      ? 'bg-zinc-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
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
        {/* Gradient fade */}
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
        
        <div className="bg-white/85 backdrop-blur-2xl border-t border-zinc-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
            {MOBILE_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center gap-0.5 py-1">
                    <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-black shadow-[0_2px_10px_rgba(0,0,0,0.12)]' 
                        : ''
                    }`}>
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-white' : 'text-zinc-400'}`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <span className={`text-[9px] tracking-wider transition-colors duration-200 ${
                      isActive ? 'text-black font-extrabold' : 'text-zinc-400 font-medium'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
