'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ChevronRight, LayoutDashboard, CloudSun, Shirt } from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
    title: 'OOTD 객관적 분석',
    desc: '오늘의 코디 사진을 올리면 AI 스타일리스트가 0-100점 점수와 함께 구체적인 피드백을 제공합니다.',
    tag: '실시간 점수',
  },
  {
    icon: <CloudSun className="w-5 h-5 text-amber-500" />,
    title: '날씨 기반 코디 추천',
    desc: '내 옷장에 등록된 아이템들을 활용하여 오늘의 날씨와 기온에 딱 맞는 완성된 코디를 제안합니다.',
    tag: '매일 아침 추천',
  },
  {
    icon: <Shirt className="w-5 h-5 text-emerald-500" />,
    title: '옷장 분석 & 아이템 큐레이션',
    desc: '내 옷장에 부족한 필수 아이템을 분석하고, 무신사 및 29CM 등에서 바로 구매할 수 있는 링크를 제공합니다.',
    tag: '스마트 쇼핑',
  },
];

export default function LandingContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 overflow-x-hidden">
      
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white dark:text-black" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight">OOTD AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-[13px] font-bold rounded-full transition-colors active:scale-95 shadow-sm">
                로그인 / 시작하기
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Subtle background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-zinc-100 dark:bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 max-w-3xl leading-[1.15] tracking-tight">
            당신의 옷장을 가장 완벽하게<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-zinc-900 dark:from-zinc-400 dark:to-white">
              활용하는 방법
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
            사진 한 장으로 코디 점수를 받고, 날씨에 맞는 옷차림을 매일 추천받으세요. 나만의 개인 AI 스타일리스트가 지금 대기 중입니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
            <Link href="/login">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black text-[15px] font-extrabold rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2">
                무료로 시작하기 <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">핵심 기능</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">OOTD AI가 제공하는 스마트한 스타일링 경험</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="rounded-3xl p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                  {f.icon}
                </div>
                <span className="px-2.5 py-1 bg-zinc-200/50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold rounded-lg tracking-wide">
                  {f.tag}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── UI PREVIEW SECTION ── */}
      <section className="py-24 px-6 max-w-4xl mx-auto border-t border-zinc-100 dark:border-zinc-800/50">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">지금 바로 경험해보세요</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">간단한 구글 로그인 후 모든 기능을 무료로 사용할 수 있습니다.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[32px] p-8 md:p-12 bg-zinc-50 dark:bg-zinc-900/80 shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-2xl mx-auto relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-600 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center text-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700 mb-2">
              <LayoutDashboard className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-2">나만의 패션 대시보드</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                날씨 확인, OOTD 업로드, AI 피드백, 그리고 옷장 관리까지.
                하나의 대시보드에서 패션에 관한 모든 것을 해결하세요.
              </p>
            </div>

            <Link href="/login" className="w-full sm:w-auto mt-4">
              <button className="w-full sm:w-auto px-10 py-3.5 bg-black dark:bg-white text-white dark:text-black text-[14px] font-extrabold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md active:scale-95">
                대시보드 입장하기
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white dark:text-black" />
                </div>
                <span className="font-extrabold text-[16px] tracking-tight text-zinc-900 dark:text-white">OOTD AI</span>
              </div>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-sm">
                AI 기술을 통해 당신의 옷장을 디지털화하고,<br />
                매일 최적의 스타일을 찾아드리는 개인 패션 어시스턴트입니다.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900 dark:text-white">서비스</h4>
                <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
                  <li><Link href="/wardrobe" className="hover:text-zinc-900 dark:hover:text-white transition-colors">디지털 옷장</Link></li>
                  <li><Link href="/curation" className="hover:text-zinc-900 dark:hover:text-white transition-colors">AI 코디 추천</Link></li>
                  <li><Link href="/shopping" className="hover:text-zinc-900 dark:hover:text-white transition-colors">AI 쇼핑</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900 dark:text-white">법적 고지</h4>
                <ul className="space-y-2 text-zinc-500 dark:text-zinc-400">
                  <li><Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">개인정보 처리방침</Link></li>
                  <li><Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">이용약관</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Service</p>
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                <span>상호: OOTD AI</span>
                <span>문의: ootdai.help@gmail.com</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">© 2026 OOTD AI. All rights reserved.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                <p className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400">SYSTEM STATUS: OPERATIONAL</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
