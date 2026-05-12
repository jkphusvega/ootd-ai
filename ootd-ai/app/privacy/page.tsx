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
        <p className="text-xs text-zinc-400 mb-8">최종 수정일: 2026년 5월 12일</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">1. 수집하는 개인정보</h2>
            <p>OOTD AI(이하 &quot;서비스&quot;)는 원활한 서비스 제공을 위해 다음의 정보를 수집합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li><strong>계정 관리:</strong> 이메일 주소, 이름(닉네임)</li>
              <li><strong>스타일 분석:</strong> 키, 몸무게, 선호 스타일, 의류 사진, 코디 사진</li>
              <li><strong>서비스 이용 기록:</strong> 방문 일시, 서비스 이용 기록, 기기 정보</li>
              <li><strong>위치 정보:</strong> 날씨 정보 제공을 위한 대략적인 지역 정보 (정확한 좌표는 저장하지 않음)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">2. 개인정보의 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>AI를 활용한 의류 분석 및 스타일링 조언 제공</li>
              <li>사용자 맞춤형 코디 큐레이션 및 아이템 추천</li>
              <li>현재 위치의 날씨 기반 적정 옷차림 가이드 제공</li>
              <li>회원 관리 및 본인 확인, 고객 문의 응대</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">3. 개인정보의 국외 이전 (AI 분석)</h2>
            <p>서비스는 AI 분석 기능을 위해 다음과 같이 개인정보를 국외로 이전하여 처리합니다:</p>
            <div className="mt-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
              <ul className="space-y-2">
                <li><strong>이전되는 항목:</strong> 사용자가 업로드한 사진 데이터</li>
                <li><strong>이전 국가 및 대상:</strong> 미국 (Google LLC - Gemini API)</li>
                <li><strong>이전 목적:</strong> 이미지 내 의류 속성 분석 및 스타일 피드백 생성</li>
                <li><strong>이전 시점:</strong> 사용자가 분석 버튼을 클릭하여 데이터를 전송할 때</li>
                <li><strong>보유 및 이용 기간:</strong> Google Gemini API는 전송된 이미지를 모델 학습에 사용하지 않으며, 분석 완료 후 보관하지 않습니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">4. 개인정보의 보유 및 파기</h2>
            <p>
              서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li>회원 탈퇴 시 사용자의 모든 개인정보와 업로드한 이미지는 <strong>즉시 영구 삭제</strong>됩니다.</li>
              <li>단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">5. 사용자의 권리</h2>
            <p>사용자는 언제든지 자신의 개인정보를 열람, 수정하거나 삭제를 요청할 수 있습니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600">
              <li>앱 내 설정 페이지를 통해 프로필 정보를 직접 수정 및 삭제할 수 있습니다.</li>
              <li>회원 탈퇴를 통해 동의 철회 및 모든 데이터 삭제가 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">6. 개인정보 보호책임자</h2>
            <p>개인정보 보호와 관련한 문의사항은 아래의 방법을 통해 문의하시기 바랍니다.</p>
            <div className="mt-2 text-zinc-600">
              <p>담당: OOTD AI 운영팀</p>
              <p>문의: 앱 내 설정 &gt; 문의하기 또는 ootdai.help@gmail.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
