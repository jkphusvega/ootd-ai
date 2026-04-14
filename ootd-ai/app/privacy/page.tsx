import Link from 'next/link';

export const metadata = {
  title: '개인정보 처리방침 — OOTD AI',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 transition mb-8 block">← 홈으로</Link>

        <h1 className="text-2xl font-black text-zinc-900 mb-8">개인정보 처리방침</h1>
        <p className="text-xs text-zinc-400 mb-8">최종 수정일: 2026년 4월 14일</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">1. 수집하는 개인정보</h2>
            <p>OOTD AI(이하 &quot;서비스&quot;)는 서비스 제공을 위해 다음의 개인정보를 수집합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li><strong>필수 정보:</strong> 이메일 주소 (계정 생성 시)</li>
              <li><strong>선택 정보:</strong> 닉네임, 키, 몸무게, 스타일 선호도</li>
              <li><strong>업로드 데이터:</strong> 사용자가 업로드한 의류 사진, OOTD 사진</li>
              <li><strong>자동 수집:</strong> 기기 정보, 위치(날씨 제공 목적, 정확한 좌표는 저장하지 않음)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">2. 개인정보의 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>AI 기반 옷차림 분석 및 스타일 추천 서비스 제공</li>
              <li>사용자 맞춤 코디 큐레이션</li>
              <li>날씨 기반 옷차림 조언</li>
              <li>서비스 개선 및 오류 해결</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">3. 사진 데이터 처리</h2>
            <p>사용자가 업로드한 사진은 다음과 같이 처리됩니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li>AI 분석을 위해 Google Gemini API에 일시적으로 전송됩니다</li>
              <li>Gemini API는 분석 후 이미지를 보관하지 않습니다</li>
              <li>옷장에 저장한 이미지는 Supabase 클라우드 스토리지에 안전하게 보관됩니다</li>
              <li>사용자가 삭제를 요청하면 즉시 영구 삭제됩니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">4. 개인정보의 보유 및 파기</h2>
            <p>
              회원 탈퇴 시 모든 개인정보와 업로드된 사진은 <strong>즉시 영구 삭제</strong>됩니다.
              관련 법령에 의해 보존이 필요한 경우를 제외합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">5. 제3자 제공</h2>
            <p>
              서비스는 AI 분석을 위해 Google Gemini API를 사용합니다.
              이 외에 사용자의 개인정보를 제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">6. 사용자의 권리</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>개인정보 열람, 수정, 삭제 요청 (설정 페이지에서 직접 가능)</li>
              <li>계정 삭제 요청 (설정 → 계정 삭제)</li>
              <li>서비스 이용 동의 철회</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">7. 연락처</h2>
            <p>개인정보 관련 문의는 앱 내 설정 페이지를 통해 문의해주세요.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
