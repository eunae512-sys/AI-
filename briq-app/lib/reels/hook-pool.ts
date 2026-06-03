// 릴스 후크 풀 — 업종별 12개 다양한 카피 + 사용자 데이터 (tagline/시그니처) 인터리브
// 목적: ReelsScreen 의 "변형 생성" 버튼이 진짜 다양한 후크를 순환하도록

import type { Industry } from "@/types";

// 업종별 12개 후크 — 시간대·시즌·소재·감각 골고루
const INDUSTRY_HOOK_POOL: Record<Industry, string[]> = {
  restaurant: [
    "이 동네 오면 여기부터예요",
    "솥뚜껑 열리는 이 순간",
    "이 한 상 보고 저장했잖아요",
    "재료는 그날 아침에 들어와요",
    "혼밥도 눈치 안 보이는 집",
    "부모님 모시고 가면 점수 따는 곳",
    "예약 안 하면 자리 없어요",
    "남기고 가는 사람을 못 봤어요",
    "사장님이 직접 상 봐요",
    "단골은 메뉴판을 안 봐요",
    "다 먹고 또 예약하고 나가요",
    "오늘 점심, 여기로 정했다",
  ],
  cafe: [
    "이 동네 오면 여기부터 들러요",
    "콜드브루 내리는 데만 6시간",
    "창가 자리는 일찍 가야 잡아요",
    "노트북 들고 반나절 있기 좋아요",
    "원두 향이 문 앞부터 나요",
    "이 한 잔에 오후가 바뀌어요",
    "사진보다 실물이 예쁜 잔",
    "평일 오픈 직후가 제일 한적해요",
    "이 원두, 시즌 끝나면 못 마셔요",
    "조용히 혼자 있기 좋아요",
    "한 모금 하고 바로 저장함",
    "주말 브런치는 여기 찜",
  ],
  dessert: [
    "단면 보고 바로 저장했어요",
    "이거 먹으러 멀리서들 와요",
    "한 입 먹고 또 시켰어요",
    "오늘 구운 거, 나가기 전에",
    "선물하면 무조건 성공해요",
    "비주얼만큼 맛도 진짜예요",
    "시즌 한정 — 지금 아니면 못 먹어요",
    "친구한테 보내면 약속 잡혀요",
    "줄 서서라도 먹는 이유",
    "포장이 예뻐서 들고 다니고 싶어요",
    "안 달아서 어른들도 좋아해요",
    "오픈런 해도 안 아까워요",
  ],
  stay: [
    "하룻밤 자고 바로 또 예약했어요",
    "도착하면 사진부터 찍게 돼요",
    "마당에 비 오는 소리가 들려요",
    "아침 햇살 들 때가 제일 예뻐요",
    "진짜 쉬려고 잡는 한옥",
    "온돌방 이불 위에 누우면 끝",
    "주말은 한 달 전에 마감돼요",
    "조식 한 상이 여행의 시작",
    "혼자 와도, 둘이 와도 좋아요",
    "휴대폰 꺼두기 좋은 곳",
    "체크인하면 차 한 잔 내드려요",
    "다음 휴가도 여기로 정했다",
  ],
  beauty: [
    "한 번 받고 단골 됐어요",
    "거울 보는 순간 표정이 바뀌어요",
    "결 살아나는 게 눈에 보여요",
    "석 달 전이랑 완전 달라졌어요",
    "원장님 손이 진짜 달라요",
    "예약 어렵지만 그럴 만해요",
    "이 컬러, 다음에 꼭 해보려고요",
    "두피부터 챙겨주는 곳",
    "끝나고 사진 안 찍을 수가 없어요",
    "얼굴형 보고 톤을 잡아줘요",
    "강남에서 흔치 않은 실력",
    "친구한테 제일 먼저 추천했어요",
  ],
  local: [
    "이 옷은 실물로 봐야 해요",
    "원단 만져보면 차이가 느껴져요",
    "온라인 사진보다 실물이 나아요",
    "이 핏, 흔한 데서 안 보여요",
    "룩북 보고 사러 왔잖아요",
    "이 동네 오면 들러야 하는 곳",
    "신상은 이번 주에 들어왔어요",
    "사이즈 추천을 진짜 잘해줘요",
    "단골들이 조용히 다시 와요",
    "이번 시즌 지나면 재입고 안 돼요",
    "거울 앞에서 한참 고민하게 돼요",
    "하나 사면 또 입고 싶은 핏",
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
