import Link from 'next/link';

export default function LandingMinimal() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="OOTD AI" className="h-7 w-auto object-contain" />
          <Link href="/login">
            <button className="px-5 py-2.5 bg-black text-white text-[11px] font-extrabold tracking-widest uppercase rounded-full hover:bg-zinc-800 transition active:scale-95">
              시작하기
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-40 pb-24 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-[10px] font-extrabold tracking-[0.3em] uppercase text-zinc-400 mb-6 px-4 py-2 bg-zinc-100 rounded-full">
              Powered by Gemini AI
            </span>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              오늘<br />
              뭐 입지?
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              AI 스타일리스트가 날씨·무드·내 옷장을 분석해서
              매일 딱 맞는 코디를 추천해드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/login">
                <button className="px-8 py-4 bg-black text-white text-[12px] font-extrabold tracking-widest uppercase rounded-2xl shadow-xl hover:bg-zinc-800 transition active:scale-95">
                  무료로 시작하기
                </button>
              </Link>
              <span className="flex items-center justify-center text-xs text-zinc-400 font-medium">
                가입 30초 · 신용카드 불필요
              </span>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[260px] h-[520px] bg-zinc-900 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-[6px] border-zinc-800 overflow-hidden relative">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-zinc-900 z-10 flex items-end justify-center pb-1">
                  <div className="w-20 h-5 bg-zinc-800 rounded-full" />
                </div>
                {/* App UI preview */}
                <div className="absolute inset-0 pt-10 bg-[#F9F9F9] flex flex-col">
                  {/* Tab bar */}
                  <div className="mx-4 mt-4 flex p-1 bg-white rounded-full border border-zinc-200 shadow-sm">
                    <div className="flex-1 py-2 bg-black rounded-full text-center">
                      <span className="text-[8px] font-black text-white tracking-widest uppercase">AI 코디</span>
                    </div>
                    <div className="flex-1 py-2 text-center">
                      <span className="text-[8px] font-black text-zinc-400 tracking-widest uppercase">OOTD 분석</span>
                    </div>
                  </div>
                  {/* Weather chip */}
                  <div className="flex justify-center mt-3">
                    <div className="px-3 py-1.5 bg-white rounded-full border border-zinc-200 shadow-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[8px] font-bold text-zinc-500">18°C Clear</span>
                    </div>
                  </div>
                  {/* Outfit grid */}
                  <div className="flex-1 px-4 mt-4 grid grid-cols-2 gap-2">
                    {[
                      { color: '#e8e0d8', label: 'OUTER' },
                      { color: '#d4cfc9', label: 'TOPS' },
                      { color: '#c8c2bb', label: 'BOTTOMS' },
                      { color: '#bfb9b1', label: 'SHOES' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                        <div className="aspect-square flex items-center justify-center" style={{ background: item.color }}>
                          <div className="w-10 h-10 rounded-lg bg-white/60" />
                        </div>
                        <div className="p-2">
                          <span className="text-[7px] font-extrabold tracking-widest text-zinc-400 uppercase block">{item.label}</span>
                          <div className="flex gap-1 mt-1">
                            <div className="flex-1 h-3 bg-zinc-900 rounded-sm" />
                            <div className="flex-1 h-3 bg-zinc-100 rounded-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 mt-3">
                    <div className="w-full py-3 bg-black rounded-xl flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <span className="text-[9px] font-black text-white tracking-widest uppercase">다른 코디 추천받기</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-10 bg-zinc-900/20 blur-2xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-zinc-400">Features</span>
            <h2 className="text-4xl font-black tracking-tight mt-3">세 가지로 해결합니다</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'OOTD 분석',
                desc: '오늘의 코디를 찍으면 AI 스타일리스트가 점수와 함께 구체적인 피드백을 줍니다.',
                icon: '📸',
              },
              {
                num: '02',
                title: 'AI 코디 추천',
                desc: '내 옷장 + 날씨 + 무드를 조합해서 AI가 오늘 입을 완성 코디를 골라줍니다.',
                icon: '✨',
              },
              {
                num: '03',
                title: 'AI 쇼핑 추천',
                desc: '옷장에서 부족한 아이템을 분석해 무신사·29CM에서 딱 맞는 아이템을 추천합니다.',
                icon: '🛍️',
              },
            ].map((f) => (
              <div key={f.num} className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl mb-5 block">{f.icon}</span>
                <span className="text-[9px] font-extrabold tracking-[0.3em] uppercase text-zinc-300 block mb-2">{f.num}</span>
                <h3 className="text-xl font-extrabold text-zinc-900 mb-3">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-5xl font-black tracking-tight mb-6">지금 바로<br />시작해보세요</h2>
          <p className="text-zinc-400 text-base mb-10">구글 계정 하나면 됩니다. 30초면 충분해요.</p>
          <Link href="/login">
            <button className="px-10 py-5 bg-black text-white text-[12px] font-extrabold tracking-widest uppercase rounded-2xl shadow-xl hover:bg-zinc-800 transition active:scale-95">
              무료로 시작하기 →
            </button>
          </Link>
          <p className="mt-6 text-[11px] text-zinc-300">
            이미 계정이 있나요?{' '}
            <Link href="/login" className="text-zinc-500 font-bold underline underline-offset-2">로그인</Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 py-8 px-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] text-zinc-400">
          <span>© 2026 OOTD AI</span>
          <span className="hidden sm:block">·</span>
          <Link href="/privacy" className="hover:text-zinc-600 transition">개인정보 처리방침</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/terms" className="hover:text-zinc-600 transition">이용약관</Link>
        </div>
      </footer>

    </div>
  );
}
