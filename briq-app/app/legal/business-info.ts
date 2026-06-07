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
  companyName: "주식회사 어블러",
  representative: "허은애",
  businessRegistrationNo: "745-88-00998",
  // TODO: 통신판매업 신고 후 신고번호 입력 (정기결제 운영 전 필수)
  ecommerceRegistrationNo: "준비 중",
  address: "울산광역시 중구 종가로 406-21, 838호",
  // TODO: 고객센터 전화번호 확정 후 입력
  phone: "준비 중",
  // TODO: 도메인 단일화 확정 후 이메일 도메인 정정
  email: "support@briq.kr",
  hostingProvider: "Vercel Inc. + Supabase Inc.",
  lastUpdated: "2026-06-08",
};

export const SERVICE_NAME = "BRIQ";

export const TRIAL_DAYS = 14;
