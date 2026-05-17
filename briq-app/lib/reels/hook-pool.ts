// 릴스 후크 풀 — 업종별 12개 다양한 카피 + 사용자 데이터 (tagline/시그니처) 인터리브
// 목적: ReelsScreen 의 "변형 생성" 버튼이 진짜 다양한 후크를 순환하도록

import type { Industry } from "@/types";

// 업종별 12개 후크 — 시간대·시즌·소재·감각 골고루
const INDUSTRY_HOOK_POOL: Record<Industry, string[]> = {
  restaurant: [
    "오늘의 한 상, 정성으로 차립니다",
    "시장에서 시작합니다",
    "한 점, 한 결의 시간",
    "솥의 김이 오릅니다",
    "장맛은 거짓말을 안 합니다",
    "오늘은 누구와 마주 앉으세요?",
    "재료가 먼저, 그다음이 손맛",
    "끓는 결을 보세요",
    "한 술의 시작, 한 마디의 인사",
    "오늘 준비한 한 그릇",
    "끝의 인사까지 정성으로",
    "마주 앉다 — 오늘의 자리",
  ],
  cafe: [
    "한 잔의 시간, 오늘 다시 내립니다",
    "원두에서 잔까지",
    "산미의 결을 느끼세요",
    "오늘 내린 첫 잔",
    "분쇄의 향, 추출의 시간",
    "콜드브루 6시간의 기다림",
    "한 모금의 리듬",
    "라떼아트, 한 줄의 무늬",
    "잔에서 만나요",
    "다음 시즌까지 — 원두 노트",
    "오늘의 한 잔, 천천히",
    "테이블 위의 시간",
  ],
  dessert: [
    "오늘 만든 한 조각",
    "단면이 말합니다",
    "한 입의 단맛, 한 입의 마침표",
    "오븐에서 막 나온 결",
    "리본의 결, 전하는 마음",
    "쇼케이스의 빛 아래",
    "한 결의 색을 보세요",
    "오늘의 디저트, 시즌 한정",
    "선물용 포장, 메시지 함께",
    "케이크 한 조각의 시간",
    "받는 분께 — 오늘의 마음",
    "한 입, 그리고 한 입 더",
  ],
  stay: [
    "창호로 드는 빛",
    "마당의 한 결",
    "조용한 객실의 시간",
    "차 한 잔의 환영",
    "오늘의 첫 인상, 한옥의 빛",
    "낮은 의자에 앉으세요",
    "저녁의 색이 내려앉습니다",
    "조반 한 상의 시작",
    "오래 머무세요",
    "다음 손님을 위해 — 오늘의 정돈",
    "창가의 빛, 그 한 줄기",
    "고맙습니다, 다녀가세요",
  ],
  beauty: [
    "오늘의 결, 한 가닥씩",
    "톤의 변화를 만나세요",
    "광택의 마침표 — 5초",
    "거울 앞에서 다시 보는 나",
    "3개월 전, 그리고 지금",
    "결을 살리는 시간",
    "한 단계, 한 단계의 정돈",
    "샴푸 바의 결, 두피의 시간",
    "물 한 줄기, 거품의 결",
    "오늘의 마무리",
    "톤 매칭, 피부와 결",
    "거품의 무게 끝의 안락",
  ],
  local: [
    "한 벌의 무게",
    "원단의 결정",
    "실루엣의 선택",
    "스튜디오의 시간",
    "한 사람의 무드",
    "오늘의 픽, 한 줄의 시그니처",
    "S/S 26 — 다음 시즌의 결",
    "쇼룸의 첫 인상",
    "거울 앞에서 — 오늘의 룩",
    "디테일 한 점이 말합니다",
    "한 땀의 시간",
    "원단이 먼저, 그다음이 핏",
  ],
};

// 사용자 브랜드 후크 풀 생성
// 1) 사용자 입력 (hook + tagline + signatureMenu) 을 앞쪽에 배치
// 2) 업종 풀에서 채워서 총 ≥12 개 보장
// 3) 변형 생성 시 활성 인덱스 +1 → 사용자 데이터부터 시작해서 풀로 확장 느낌
export function buildUserHookPool(
  industry: Industry | string,
  userHook?: { line1: string; line2: string; hashtag: string },
  tagline?: string,
  signatureMenu?: string[],
): string[] {
  const industryPool = INDUSTRY_HOOK_POOL[industry as Industry] ?? INDUSTRY_HOOK_POOL.restaurant;
  const userFirst: string[] = [];

  // 사용자 입력 우선 — 첫 노출에 사장님의 자기 카피가 나오게
  if (userHook) {
    userFirst.push(`${userHook.line1} ${userHook.line2}`.trim());
    if (userHook.line2 && userHook.line2 !== userHook.line1) userFirst.push(userHook.line2);
  }
  if (tagline) {
    userFirst.push(tagline);
  }
  if (signatureMenu && signatureMenu.length > 0) {
    signatureMenu.slice(0, 3).forEach((m) => {
      if (m.trim()) userFirst.push(`오늘의 ${m.trim()}`);
    });
  }

  // 중복 제거 + 업종 풀 합치기
  const seen = new Set<string>();
  const combined: string[] = [];
  for (const h of [...userFirst, ...industryPool]) {
    const norm = h.trim();
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    combined.push(norm);
  }

  // 최소 12개 보장 — userFirst 가 industryPool 중복으로 잘리면 부족할 수 있음
  return combined.slice(0, Math.max(12, combined.length));
}
