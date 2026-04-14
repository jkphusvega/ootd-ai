import Link from 'next/link';

export const metadata = {
  title: '이용약관 — OOTD AI',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 transition mb-8 block">← 홈으로</Link>

        <h1 className="text-2xl font-black text-zinc-900 mb-8">서비스 이용약관</h1>
        <p className="text-xs text-zinc-400 mb-8">최종 수정일: 2026년 4월 14일</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 OOTD AI(이하 &quot;서비스&quot;)가 제공하는 AI 패션 분석 및 옷장 관리 서비스의
              이용 조건과 절차에 관한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제2조 (서비스 내용)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>AI 기반 OOTD(오늘의 코디) 분석 및 스타일 점수 평가</li>
              <li>사진에서 의류 자동 추출(누끼) 및 옷장 저장</li>
              <li>날씨 기반 AI 코디 추천</li>
              <li>개인 스타일 프로필 관리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제3조 (이용 제한)</h2>
            <p>서비스의 안정적 운영을 위해 다음과 같은 이용 제한이 적용됩니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li>OOTD 분석: 1일 20회</li>
              <li>의류 추출: 1일 30회</li>
              <li>코디 추천: 1일 15회</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제4조 (사용자의 의무)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>타인의 사진을 무단으로 업로드하지 않아야 합니다</li>
              <li>서비스를 부정한 방법으로 이용하지 않아야 합니다</li>
              <li>AI 분석 API를 자동화된 방식으로 대량 호출하지 않아야 합니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제5조 (AI 분석 결과 면책)</h2>
            <p>
              본 서비스의 AI 분석 결과는 참고용이며, 패션 전문가의 조언을 대체하지 않습니다.
              AI 분석 결과에 기반한 의사결정은 사용자 본인의 책임입니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제6조 (계정 해지)</h2>
            <p>
              사용자는 언제든지 설정 페이지에서 계정을 삭제할 수 있습니다.
              계정 삭제 시 모든 데이터(프로필, 옷장, OOTD 기록)은 즉시 영구 삭제됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제7조 (서비스 변경 및 중단)</h2>
            <p>
              서비스 운영자는 운영상 또는 기술상의 이유로 서비스를 변경하거나 중단할 수 있으며,
              이 경우 사전에 공지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
