// 사업자 정보 — 사용자가 직접 채워 넣을 단일 출처.
//
// 약관/개인정보/환불정책/Footer 가 모두 이 객체를 참조.
// 정기결제 사업자라면 통신판매업 신고는 필수.

export type BusinessInfo = {
  /** 상호명 */
  companyName: string;
  /** 대표자 */
  representative: string;
  /** 사업자등록번호 */
  businessRegistrationNo: string;
  /** 통신판매업 신고번호 (정기결제 운영에 필수) */
  ecommerceRegistrationNo: string;
  /** 사업장 주소 */
  address: string;
  /** 고객센터 전화 */
  phone: string;
  /** 고객센터 이메일 */
  email: string;
  /** 호스팅 제공자 (개인정보처리방침 명시 의무) */
  hostingProvider: string;
  /** 마지막 개정일 (ISO 날짜) */
  lastUpdated: string;
};

/**
 * ⚠️  TODO(사용자 입력): 사용자가 사업자 정보를 보내주면 이 값을 채워야 합니다.
 *     placeholder 가 그대로 노출되면 사용자 신뢰가 깨지므로 운영 배포 전 반드시 갱신.
 */
export const BUSINESS_INFO: BusinessInfo = {
  companyName: "(주)준비중",
  representative: "—",
  businessRegistrationNo: "000-00-00000",
  ecommerceRegistrationNo: "제 0000-서울XX-0000호",
  address: "서울특별시 ○○구 ○○로 ○○",
  phone: "02-0000-0000",
  email: "support@briq.kr",
  hostingProvider: "Vercel Inc. + Supabase Inc.",
  lastUpdated: "2026-05-29",
};

export const SERVICE_NAME = "BRIQ";

export const TRIAL_DAYS = 14;
