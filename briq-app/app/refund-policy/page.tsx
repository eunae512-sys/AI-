// 환불 / 정기결제 정책.
//
// 한국 전자상거래법 제17조(청약철회 등) + 콘텐츠산업진흥법(디지털 콘텐츠)
// 의 적용을 정리. 디지털 SaaS 는 사용 시작 시 청약철회권이 제한되는 점을 명시.

import type { Metadata } from "next";
import {
  BUSINESS_INFO,
  SERVICE_NAME,
  TRIAL_DAYS,
} from "@/app/legal/business-info";

export const metadata: Metadata = {
  title: "환불 정책",
  description: `${SERVICE_NAME} 환불 및 정기결제 정책`,
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 prose prose-zinc dark:prose-invert">
      <p className="text-[11px] uppercase tracking-widest text-zinc-400">Legal</p>
      <h1>{SERVICE_NAME} 환불 및 정기결제 정책</h1>
      <p className="text-sm text-zinc-500">
        시행일: {BUSINESS_INFO.lastUpdated}
      </p>

      <h2>1. 무료체험</h2>
      <ul>
        <li>
          유료 플랜에 카드 등록 후 {TRIAL_DAYS}일간 무료체험을 제공합니다.
        </li>
        <li>
          무료체험 기간 중에는 어떠한 청구도 발생하지 않으며, 체험 기간 내 해지
          시 결제가 발생하지 않습니다.
        </li>
        <li>
          무료체험 기간이 만료되면 자동으로 정기결제가 시작됩니다. 자동결제 시작
          1일 전 이메일로 안내드립니다.
        </li>
      </ul>

      <h2>2. 정기결제</h2>
      <ul>
        <li>
          이용자가 선택한 결제 주기(월/연)에 따라 매월(또는 매년) 같은 일자에
          자동으로 결제됩니다.
        </li>
        <li>
          결제는 토스페이먼츠(Toss Payments)를 통한 자동결제(빌링키)로 처리되며,
          회사는 카드 원본 정보를 보관하지 않습니다.
        </li>
        <li>
          결제가 실패한 경우 1일/3일/7일 간격으로 최대 3회 재시도하며, 모두
          실패한 경우 구독은 자동 해지됩니다.
        </li>
      </ul>

      <h2>3. 해지</h2>
      <ul>
        <li>
          ‘설정 → 결제·구독’ 메뉴에서 언제든지 해지할 수 있습니다.
        </li>
        <li>
          해지 신청 시 <strong>이미 결제된 사이클의 종료일까지는 기존 플랜
          기능을 유지</strong>하며, 해당 일자에 자동결제가 종료됩니다.
        </li>
        <li>해지 후에도 결제 사이클 종료 전까지는 ‘해지 취소’가 가능합니다.</li>
      </ul>

      <h2>4. 환불 기준</h2>
      <p>
        디지털 서비스 특성상 결제 후 서비스(콘텐츠 생성·발행 등)를 1회 이상
        이용한 경우 원칙적으로 청약철회 및 환불이 제한됩니다(전자상거래법 제17조
        제2항 제5호, 콘텐츠산업진흥법). 다만 회사는 다음의 경우 부분 또는 전액
        환불을 처리합니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>사유</th>
            <th>환불 범위</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>회사의 귀책사유로 7일 이상 서비스 이용 불가</td>
            <td>잔여 기간 일할 환불</td>
          </tr>
          <tr>
            <td>결제 후 서비스를 1회도 이용하지 않은 경우 (결제일로부터 7일 이내)</td>
            <td>전액 환불</td>
          </tr>
          <tr>
            <td>회사가 약관·정책을 중대하게 변경하여 이용자가 거부한 경우</td>
            <td>잔여 기간 일할 환불</td>
          </tr>
          <tr>
            <td>이용자의 단순 변심·미사용</td>
            <td>환불 불가 (다음 결제일에 자동결제 종료)</td>
          </tr>
        </tbody>
      </table>

      <h2>5. 환불 요청 방법</h2>
      <ol>
        <li>
          {BUSINESS_INFO.email} 로 ① 가입 이메일 ② 결제 주문번호(영수증에 기재)
          ③ 환불 사유를 보내주세요.
        </li>
        <li>
          영업일 기준 3일 이내 답변드리며, 승인된 환불은 7영업일 이내에 결제수단으로
          취소 처리됩니다.
        </li>
      </ol>

      <h2>6. 카드사 사정에 의한 환불 지연</h2>
      <p>
        카드사의 매입·승인 일정에 따라 카드 명세서에 환불이 반영되는 데 1~2회
        결제 주기가 소요될 수 있으며, 이에 대해 회사는 책임지지 않습니다.
      </p>

      <hr />
      <p className="text-sm text-zinc-500">
        문의: {BUSINESS_INFO.email} / {BUSINESS_INFO.phone}
        <br />
        {BUSINESS_INFO.companyName} · 통신판매업{" "}
        {BUSINESS_INFO.ecommerceRegistrationNo}
      </p>
    </main>
  );
}
