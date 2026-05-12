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
        <p className="text-xs text-zinc-400 mb-8">최종 수정일: 2026년 5월 12일</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 OOTD AI(이하 &quot;서비스&quot;)가 제공하는 AI 패션 분석 및 옷장 관리 서비스의
              이용 조건과 절차에 관한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제2조 (서비스의 제공 및 변경)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>AI를 활용한 OOTD 분석 및 점수 산정</li>
              <li>의류 사진 자동 배경 제거 및 디지털 옷장 저장</li>
              <li>사용자 데이터를 바탕으로 한 맞춤 코디 추천</li>
              <li>서비스는 기술적 사양의 변경 또는 운영상 필요에 따라 내용을 변경할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제3조 (지식재산권)</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-600">
              <li>사용자가 서비스에 업로드한 사진의 저작권은 <strong>사용자 본인</strong>에게 귀속됩니다.</li>
              <li>단, 사용자는 서비스 제공을 위해 필요한 범위 내(AI 분석, 데이터 처리 등)에서 서비스 운영자에게 해당 사진의 이용 권한을 부여합니다.</li>
              <li>서비스가 제공하는 AI 분석 결과, 디자인, 텍스트 등에 대한 지식재산권은 서비스 운영자에게 귀속됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제4조 (이용 제한 및 면책)</h2>
            <p>서비스의 안정적 운영을 위해 다음과 같은 사항이 적용됩니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-2 text-zinc-600">
              <li>타인의 사진을 무단으로 업로드하여 발생하는 법적 책임은 사용자에게 있습니다.</li>
              <li>AI 분석 결과는 알고리즘에 의한 참고 수치이며, 서비스는 분석 결과의 절대적인 정확성을 보장하지 않습니다.</li>
              <li>무료 서비스의 경우, 서비스 중단이나 변경으로 인해 발생하는 손해에 대해 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제5조 (계정 해지 및 데이터 처리)</h2>
            <p>
              사용자는 언제든지 서비스 내 설정 페이지를 통해 계정을 삭제할 수 있으며, 이 경우 사용자의 모든 데이터(옷장 정보, 분석 기록 등)는 즉시 영구 파기됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제6조 (준거법 및 관할법원)</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>본 약관의 해석 및 서비스 이용과 관련한 분쟁에 대해서는 대한민국 법률을 준거법으로 합니다.</li>
              <li>서비스 이용과 관련하여 발생한 분쟁의 소송은 사용자의 주소지 또는 운영자의 소재지를 관할하는 법원을 합의 관할 법원으로 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">제7조 (문의)</h2>
            <p>본 약관 및 서비스 이용에 관한 문의사항은 아래의 방법을 통해 연락하시기 바랍니다.</p>
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

