// 플랜 게이팅 — 기능별 최소 플랜 한 곳에서 관리.
//
// 사용처:
//   · UI 잠금 — 버튼 disabled / 모달 안내
//   · 한도 체크 외 별개 — 한도는 usage.ts, 기능 자체 잠금은 여기
//
// 정책: 새 기능을 추가하면 반드시 FEATURE_MIN_PLAN 에 등록.

import type { PlanId } from "./plans";

export type FeatureKey =
  | "blog:create"             // 네이버 블로그 본문 생성
  | "ai-image:generate"       // AI 이미지 생성 (Gemini/OpenAI)
  | "ai-video:generate"       // AI 릴스 영상 생성 (Veo/Kling)
  | "distribution:webhook"    // Make/Zapier Webhook 분배
  | "distribution:api-publish" // Instagram Graph API 등 직결 발행
  | "multi-brand"             // 2번째 이상 브랜드 추가
  | "pdf-magazine"            // 매주 PDF 매거진 리포트
  | "kakao-alimtok"           // 카카오 알림톡 자동 응답
  | "team-seats";             // 다중 사용자 좌석

// 기능 → 최소 플랜
const FEATURE_MIN_PLAN: Record<FeatureKey, PlanId> = {
  "blog:create": "pro",
  "ai-image:generate": "pro",
  "ai-video:generate": "pro",
  "distribution:webhook": "pro",
  "distribution:api-publish": "studio",
  "multi-brand": "studio",
  "pdf-magazine": "studio",
  "kakao-alimtok": "studio",
  "team-seats": "agency",
};

// 사람이 읽을 수 있는 기능 라벨 — 잠금 모달에 노출
const FEATURE_LABEL: Record<FeatureKey, string> = {
  "blog:create": "네이버 블로그 본문",
  "ai-image:generate": "AI 이미지 생성 (Gemini)",
  "ai-video:generate": "AI 릴스 영상 생성 (Veo)",
  "distribution:webhook": "Webhook 자동 분배 (Make/Zapier)",
  "distribution:api-publish": "Instagram·페이스북 API 직결 발행",
  "multi-brand": "여러 브랜드 동시 관리",
  "pdf-magazine": "매주 PDF 매거진 리포트",
  "kakao-alimtok": "카카오 알림톡 자동 응답",
  "team-seats": "팀 사용자 (5명 이상)",
};

const PLAN_ORDER: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  studio: 2,
  agency: 3,
};

export function isFeatureAllowed(feature: FeatureKey, planId: PlanId): boolean {
  return PLAN_ORDER[planId] >= PLAN_ORDER[FEATURE_MIN_PLAN[feature]];
}

export function minPlanFor(feature: FeatureKey): PlanId {
  return FEATURE_MIN_PLAN[feature];
}

export function featureLabel(feature: FeatureKey): string {
  return FEATURE_LABEL[feature];
}

// 잠금 모달에 쓸 친화 메시지
export function gatePrompt(feature: FeatureKey, currentPlan: PlanId): {
  headline: string;
  body: string;
  requiredPlan: PlanId;
} {
  const required = FEATURE_MIN_PLAN[feature];
  const label = FEATURE_LABEL[feature];
  const planName = required === "pro" ? "Pro" : required === "studio" ? "Studio" : required === "agency" ? "Agency" : "Pro";
  return {
    headline: `${label}은(는) ${planName} 부터`,
    body:
      currentPlan === "free"
        ? `현재 Free 플랜에서는 ${label} 기능을 사용하실 수 없습니다. ${planName} 로 업그레이드하시면 14일 무료 체험 후 결제하실 수 있어요.`
        : `${planName} 플랜에서 ${label} 기능을 사용하실 수 있습니다.`,
    requiredPlan: required,
  };
}
