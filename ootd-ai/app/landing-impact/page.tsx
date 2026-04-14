'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '📸',
    title: 'OOTD 분석',
    desc: '사진 한 장으로 AI 스타일리스트의 점수와 솔직한 피드백을 받아보세요.',
    tag: '0-100점',
  },
  {
    icon: '✨',
    title: 'AI 코디 추천',
    desc: '내 옷장 × 오늘 날씨 × 내 무드. AI가 완성 코디를 바로 골라줍니다.',
    tag: '매일 새 코디',
  },
  {
    icon: '🛍️',
    title: 'AI 쇼핑 추천',
    desc: '옷장에서 부족한 것만 골라 무신사·29CM 링크와 함께 추천합니다.',
    tag: '무신사 · 29CM',
  },
];

export default function LandingImpact() {
  return (
    <div className="min-h-screen bg-[#080808] font-sans text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="OOTD AI" className="h-7 w-auto object-contain invert" />
          <Link href="/login">
            <button className="px-5 py-2.5 bg-white text-black text-[11px] font-extrabold tracking-widest uppercase rounded-full hover:bg-zinc-200 transition active:scale-95">
              시작하기
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-white/50">Powered by Gemini AI</span>
          </motion.div>

          <h1 className="text-6xl lg:text-[96px] font-black tracking-tight leading-[1] mb-6">
            <span className="block text-white">오늘</span>
            <span className="block text-white/20">뭐</span>
            <span className="block text-white">입지?</span>
          </h1>

          <p className="text-lg lg:text-xl text-white/40 leading-relaxed mb-12 max-w-lg mx-auto">
            AI 스타일리스트가 날씨·무드·내 옷장을 보고<br />
            매일 딱 맞는 코디를 추천해드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white text-black text-[12px] font-extrabold tracking-widest uppercase rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-shadow"
              >
                무료로 시작하기 →
              </motion.button>
            </Link>
            <span className="flex items-center justify-center text-xs text-white/25 font-medium">
              스타일리스트 비용 0원
            </span>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-white/25">Features</span>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mt-4 text-white">
              세 가지로<br />해결합니다
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="relative group rounded-3xl border border-white/8 bg-white/[0.03] p-8 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <span className="text-4xl mb-6 block">{f.icon}</span>
                <span className="inline-block text-[8px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10 text-white/30 mb-4">{f.tag}</span>
                <h3 className="text-xl font-extrabold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { num: 'AI', label: 'Gemini 2.5 Flash 기반' },
            { num: '3초', label: '분석 결과까지' },
            { num: '무료', label: '지금 당장 시작' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-4xl lg:text-5xl font-black text-white mb-2">{s.num}</p>
              <p className="text-[11px] font-bold text-white/30 tracking-widest uppercase">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] rounded-full blur-[80px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-xl mx-auto"
        >
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 text-white">
            지금 바로<br />시작해보세요
          </h2>
          <p className="text-white/30 text-base mb-12">구글 계정 하나면 됩니다. 30초면 충분해요.</p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-5 bg-white text-black text-[12px] font-extrabold tracking-widest uppercase rounded-2xl shadow-[0_0_60px_rgba(255,255,255,0.1)] hover:shadow-[0_0_80px_rgba(255,255,255,0.2)] transition-shadow"
            >
              무료로 시작하기 →
            </motion.button>
          </Link>
          <p className="mt-8 text-[11px] text-white/20">
            이미 계정이 있나요?{' '}
            <Link href="/login" className="text-white/40 font-bold underline underline-offset-2 hover:text-white/60 transition">로그인</Link>
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] text-white/20">
          <span>© 2026 OOTD AI</span>
          <span className="hidden sm:block">·</span>
          <Link href="/privacy" className="hover:text-white/40 transition">개인정보 처리방침</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/terms" className="hover:text-white/40 transition">이용약관</Link>
        </div>
      </footer>

    </div>
  );
}
