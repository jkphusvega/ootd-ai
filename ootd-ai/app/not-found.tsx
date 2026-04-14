import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-8xl font-black text-zinc-200 mb-4">404</h1>
      <h2 className="text-xl font-extrabold text-zinc-800 mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-zinc-400 mb-8 max-w-sm">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link href="/">
        <button className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm tracking-widest uppercase hover:bg-zinc-800 transition active:scale-95 shadow-xl">
          홈으로 돌아가기
        </button>
      </Link>
    </div>
  );
}
