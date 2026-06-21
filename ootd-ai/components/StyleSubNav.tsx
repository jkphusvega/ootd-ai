'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ShoppingBag, Share2 } from 'lucide-react';

export default function StyleSubNav() {
  const pathname = usePathname();

  const TABS = [
    { href: '/stats', label: '스타일 분석', icon: BarChart3 },
    { href: '/shopping', label: 'AI 쇼핑 추천', icon: ShoppingBag },
    { href: '/share', label: '옷장 공유', icon: Share2 },
  ];

  return (
    <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl w-fit mb-8 border border-zinc-200/50 dark:border-zinc-800/40">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href}>
            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          </Link>
        );
      })}
    </div>
  );
}
