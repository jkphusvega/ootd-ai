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
  { href: '/stats', label: '스타일', icon: Sparkles },
  { href: '/settings', label: '설정', icon: Settings },
];

// 모바일 하단 탭바에 표시될 항목
const MOBILE_NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/wardrobe', label: '옷장', icon: Shirt },
  { href: '/stats', label: '스타일', icon: Sparkles },
  { href: '/settings', label: '설정', icon: Settings },
];

// 네비게이션을 숨길 페이지 경로
const HIDDEN_PATHS = ['/login', '/signup', '/onboarding', '/auth', '/landing-minimal', '/landing-impact', '/shared'];

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 로그인, 회원가입, 온보딩 등에서는 네비게이션 숨김
  // 비로그인 상태에서 홈(/)은 랜딩 페이지를 표시하므로 숨김
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;
  if (pathname === '/' && !user) return null;

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
            const isActive = item.href === '/stats'
              ? (pathname === '/stats' || pathname === '/shopping' || pathname === '/share')
              : pathname === item.href;
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

      </aside>

      {/* ============ MOBILE: Bottom Tab Bar (lg 미만) ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/85 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-zinc-800/40 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom,6px),6px)]">
            {MOBILE_NAV.map((item) => {
              const isActive = item.href === '/stats'
                ? (pathname === '/stats' || pathname === '/shopping' || pathname === '/share')
                : pathname === item.href;
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
          </div>
        </div>
      </nav>
    </>
  );
}
