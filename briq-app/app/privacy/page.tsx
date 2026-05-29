// 개인정보처리방침.
//
// PIPA(개인정보보호법) 표준 항목 + 한국 SaaS 위탁/국외 이전 명시.
// 위탁업체: Supabase, OpenAI, Toss Payments, Pexels.

import type { Metadata } from "next";
import { BUSINESS_INFO, SERVICE_NAME } from "@/app/legal/business-info";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SERVICE_NAME} 개인정보처리방침`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 prose prose-zinc dark:prose-invert">
      <p className="text-[11px] uppercase tracking-widest text-zinc-400">Legal</p>
      <h1>{SERVICE_NAME} 개인정보처리방침</h1>
      <p className="text-sm text-zinc-500">
        시행일: {BUSINESS_INFO.lastUpdated}
      </p>

      <p>
        {BUSINESS_INFO.companyName}(이하 “회사”)은(는) 「개인정보 보호법」 제30조에
        따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
        처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
      </p>

      <h2>1. 처리 목적</h2>
      <p>회사는 다음 목적을 위해 개인정보를 처리합니다.</p>
      <ul>
        <li>회원 가입 및 본인 확인, 계정 관리</li>
        <li>유료 서비스 결제·해지·환불 처리</li>
        <li>AI 콘텐츠 생성 요청 처리 및 서비스 이용 통계 분석</li>
        <li>고객문의 응대, 공지사항 전달</li>
      </ul>

      <h2>2. 수집 항목 및 보유 기간</h2>
      <table>
        <thead>
          <tr>
            <th>구분</th>
            <th>수집 항목</th>
            <th>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>회원 가입</td>
            <td>이메일, 이름(선택), 소셜 로그인 고유번호</td>
            <td>회원 탈퇴 시까지</td>
          </tr>
          <tr>
            <td>결제</td>
            <td>
              카드사 정보, 마스킹된 카드번호 끝 4자리, 결제 일시·금액·승인번호
            </td>
            <td>전자상거래법 5년</td>
          </tr>
          <tr>
            <td>서비스 이용</td>
            <td>접속 로그, IP, 생성 콘텐츠 메타데이터(업종·톤·키워드)</td>
            <td>1년 (통신비밀보호법)</td>
          </tr>
          <tr>
            <td>고객 문의</td>
            <td>이메일, 문의 내용</td>
            <td>3년 (소비자보호법)</td>
          </tr>
        </tbody>
      </table>
      <p>
        카드 원본 번호·CVC·비밀번호 등 중요 결제정보는 회사가 직접 저장하지
        않으며, 결제대행사(토스페이먼츠)가 PCI-DSS 기준에 따라 보관합니다.
      </p>

      <h2>3. 제3자 제공</h2>
      <p>
        회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만
        법령에 정해진 경우는 예외로 합니다.
      </p>

      <h2>4. 처리 위탁</h2>
      <table>
        <thead>
          <tr>
            <th>수탁자</th>
            <th>위탁 업무</th>
            <th>국가</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>데이터베이스·인증·파일 저장 인프라</td>
            <td>일본 (Tokyo)</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>웹 호스팅 (서울 리전)</td>
            <td>대한민국 (Seoul)</td>
          </tr>
          <tr>
            <td>OpenAI, L.L.C.</td>
            <td>AI 콘텐츠·이미지 생성 API</td>
            <td>미국</td>
          </tr>
          <tr>
            <td>토스페이먼츠(주)</td>
            <td>결제 처리·자동결제 빌링키 보관</td>
            <td>대한민국</td>
          </tr>
          <tr>
            <td>Pexels GmbH</td>
            <td>스톡 이미지·영상 검색</td>
            <td>독일</td>
          </tr>
        </tbody>
      </table>
      <p>
        국외이전이 수반되는 수탁업무에 대하여 이용자는 「개인정보 보호법」 제28조의8에
        따라 거부할 권리가 있으나, 거부 시 일부 AI 생성 기능을 이용하실 수 없습니다.
      </p>

      <h2>5. 정보주체의 권리</h2>
      <p>
        이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요구할 수
        있으며, 회사는 지체 없이 응합니다. 요청은 {BUSINESS_INFO.email} 로 보내
        주시기 바랍니다.
      </p>

      <h2>6. 안전성 확보 조치</h2>
      <ul>
        <li>전송 구간 TLS 1.3 암호화</li>
        <li>RLS(Row-Level Security) 기반 테넌트별 데이터 격리</li>
        <li>서비스 운영자 외 직접 DB 접근 제한, 접근 로그 보존</li>
        <li>분기별 비밀번호·접근 키 회전</li>
      </ul>

      <h2>7. 쿠키 사용</h2>
      <p>
        회사는 로그인 상태 유지 및 사용자 환경 최적화를 위해 쿠키를 사용합니다.
        브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 거부 시 로그인이 정상
        동작하지 않을 수 있습니다.
      </p>

      <h2>8. 개인정보 보호책임자</h2>
      <ul>
        <li>책임자: {BUSINESS_INFO.representative}</li>
        <li>연락처: {BUSINESS_INFO.email}</li>
      </ul>

      <h2>9. 변경 사항</h2>
      <p>
        본 방침은 법령·서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 시행 7일
        전에 공지합니다.
      </p>

      <hr />
      <p className="text-sm text-zinc-500">
        {BUSINESS_INFO.companyName} · 호스팅 {BUSINESS_INFO.hostingProvider}
      </p>
    </main>
  );
}
