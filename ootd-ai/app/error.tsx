'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-6xl font-black text-zinc-200 mb-4">⚠️</h1>
      <h2 className="text-xl font-extrabold text-zinc-800 mb-2">문제가 발생했습니다</h2>
      <p className="text-sm text-zinc-400 mb-8 max-w-sm">
        일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm tracking-widest uppercase hover:bg-zinc-800 transition active:scale-95 shadow-xl"
        >
          다시 시도
        </button>
        <a href="/">
          <button className="px-8 py-3 bg-zinc-100 text-zinc-700 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-zinc-200 transition active:scale-95">
            홈으로
          </button>
        </a>
      </div>
    </div>
  );
}
