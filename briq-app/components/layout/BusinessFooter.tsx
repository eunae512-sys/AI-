// 사업자 정보 표시 — 전자상거래법 표시 의무 항목.
//
// 통신판매업 운영자는 사이트에 ① 상호 ② 대표자 ③ 사업자등록번호 ④ 통신판매업
// 신고번호 ⑤ 주소 ⑥ 연락처 ⑦ 이메일을 표시할 의무가 있다.

import * as React from "react";
import Link from "next/link";

import { BUSINESS_INFO } from "@/app/legal/business-info";
import { INK_MUTE, RULE, SERIF_HANGUL } from "@/lib/landing/tokens";

export function BusinessFooter() {
  const labelCls = "text-[10px] tracking-[0.16em] uppercase";
  const labelStyle: React.CSSProperties = { color: INK_MUTE };

  return (
    <div
      className="border-t"
      style={{
        borderColor: RULE,
        background: "rgba(0,0,0,0.015)",
      }}
    >
      <div
        className="max-w-[1240px] mx-auto px-6 sm:px-14 py-7 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-[11.5px] leading-[1.7]"
        style={{ fontFamily: SERIF_HANGUL, color: INK_MUTE }}
      >
        <dl className="space-y-1">
          <div>
            <dt className={labelCls} style={labelStyle}>상호</dt>
            <dd>{BUSINESS_INFO.companyName}</dd>
          </div>
          <div>
            <dt className={labelCls} style={labelStyle}>대표자</dt>
            <dd>{BUSINESS_INFO.representative}</dd>
          </div>
          <div>
            <dt className={labelCls} style={labelStyle}>사업자등록번호</dt>
            <dd>{BUSINESS_INFO.businessRegistrationNo}</dd>
          </div>
          <div>
            <dt className={labelCls} style={labelStyle}>통신판매업</dt>
            <dd>{BUSINESS_INFO.ecommerceRegistrationNo}</dd>
          </div>
        </dl>
        <dl className="space-y-1">
          <div>
            <dt className={labelCls} style={labelStyle}>사업장 주소</dt>
            <dd>{BUSINESS_INFO.address}</dd>
          </div>
          <div>
            <dt className={labelCls} style={labelStyle}>고객센터</dt>
            <dd>
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </dd>
          </div>
          <div>
            <dt className={labelCls} style={labelStyle}>호스팅 제공자</dt>
            <dd>{BUSINESS_INFO.hostingProvider}</dd>
          </div>
        </dl>
      </div>
      <div
        className="max-w-[1240px] mx-auto px-6 sm:px-14 pb-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px]"
        style={{ fontFamily: SERIF_HANGUL, color: INK_MUTE }}
      >
        <Link href="/terms" className="hover:opacity-100">이용약관</Link>
        <span style={{ color: "rgba(0,0,0,0.15)" }}>·</span>
        <Link href="/privacy" className="hover:opacity-100 font-medium">
          개인정보처리방침
        </Link>
        <span style={{ color: "rgba(0,0,0,0.15)" }}>·</span>
        <Link href="/refund-policy" className="hover:opacity-100">환불 정책</Link>
      </div>
    </div>
  );
}
