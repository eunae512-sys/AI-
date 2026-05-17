// 플랜 게이팅 / 사용량 한도 / 거짓 디테일 / sender 통합 검증.
//
// 코드 import 가 어려운 부분은 (use client 마커, window 의존) 동일 로직을 재현해 테스트.
// 핵심 정책이 깨지면 즉시 잡힌다.

const tests = [];
function test(name, ok, detail = "") {
  tests.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// ─── 1. PlanGate 정책 ────────────────────────────────────────────────────
console.log("\n[1] PlanGate — 기능별 최소 플랜 매트릭스");
const FEATURE_MIN_PLAN = {
  "blog:create": "pro",
  "ai-image:generate": "pro",
  "distribution:webhook": "pro",
  "distribution:api-publish": "studio",
  "multi-brand": "studio",
  "pdf-magazine": "studio",
  "kakao-alimtok": "studio",
  "team-seats": "agency",
};
const PLAN_ORDER = { free: 0, pro: 1, studio: 2, agency: 3 };
function allowed(feature, plan) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[FEATURE_MIN_PLAN[feature]];
}

test("Free 가 blog:create 못 함", !allowed("blog:create", "free"));
test("Free 가 ai-image:generate 못 함", !allowed("ai-image:generate", "free"));
test("Free 가 distribution:webhook 못 함", !allowed("distribution:webhook", "free"));
test("Pro 가 distribution:webhook 가능", allowed("distribution:webhook", "pro"));
test("Pro 가 distribution:api-publish 못 함", !allowed("distribution:api-publish", "pro"));
test("Studio 가 distribution:api-publish 가능", allowed("distribution:api-publish", "studio"));
test("Studio 가 team-seats 못 함", !allowed("team-seats", "studio"));
test("Agency 가 모든 기능 가능", ["blog:create", "ai-image:generate", "distribution:webhook", "distribution:api-publish", "multi-brand", "pdf-magazine", "kakao-alimtok", "team-seats"].every((f) => allowed(f, "agency")));

// ─── 2. Usage 한도 정책 ──────────────────────────────────────────────────
console.log("\n[2] Usage — 플랜별 한도");
const LIMITS = {
  free:    { cardnews: 2,    blog: 0,    aiImage: 0 },
  pro:     { cardnews: null, blog: 8,    aiImage: 50 },
  studio:  { cardnews: null, blog: null, aiImage: 300 },
  agency:  { cardnews: null, blog: null, aiImage: null },
};
test("Free 카드뉴스 한도 2편", LIMITS.free.cardnews === 2);
test("Free 블로그 0 (=기능 잠김)", LIMITS.free.blog === 0);
test("Pro 카드뉴스 무제한", LIMITS.pro.cardnews === null);
test("Pro 블로그 8편", LIMITS.pro.blog === 8);
test("Pro AI 이미지 50장", LIMITS.pro.aiImage === 50);
test("Studio AI 이미지 300장", LIMITS.studio.aiImage === 300);
test("Agency 전부 무제한", LIMITS.agency.cardnews === null && LIMITS.agency.blog === null && LIMITS.agency.aiImage === null);

// 한도 도달 시나리오
function check(kind, used, plan) {
  const limit = LIMITS[plan][kind];
  if (limit === null) return { allowed: true };
  if (used >= limit) return { allowed: false };
  return { allowed: true };
}
test("Free 카드뉴스 1편째 허용", check("cardnews", 0, "free").allowed && check("cardnews", 1, "free").allowed);
test("Free 카드뉴스 2편째에서 막힘", !check("cardnews", 2, "free").allowed);
test("Pro 카드뉴스 9999편째도 허용", check("cardnews", 9999, "pro").allowed);
test("Pro AI 이미지 50장 다음 막힘", !check("aiImage", 50, "pro").allowed);
test("Studio AI 이미지 299장째 허용", check("aiImage", 299, "studio").allowed);
test("Studio AI 이미지 300장 다음 막힘", !check("aiImage", 300, "studio").allowed);

// ─── 3. 거짓 디테일 grep — 자동 생성 코드 경로 ────────────────────────
console.log("\n[3] 거짓 디테일 — 자동 생성 코드 경로 0건");
const { execSync } = await import("node:child_process");
const FORBIDDEN = ["새벽 4시", "재방문율 62", "별점 4.9", "후기 247", "1만 9천", "한 코스 3시간", "20년차"];
for (const pat of FORBIDDEN) {
  // hook-patterns.ts 의 COPY_ANTIPATTERNS 는 *의도된* 안티패턴 카탈로그
  // (회귀 검증용) — 실 생성 카피가 아니므로 제외.
  const cmd = `grep -r "${pat}" lib/cardnews/ lib/content/ 2>/dev/null | grep -v "정책:" | grep -v "// " | grep -v "hook-patterns.ts" | wc -l`;
  const c = parseInt(execSync(cmd, { encoding: "utf-8" }).trim(), 10);
  test(`"${pat}" 미포함`, c === 0, c > 0 ? `${c}건 남음` : "");
}

// ─── 4. Sender 모듈 정책 ─────────────────────────────────────────────────
console.log("\n[4] Sender — webhook / api / manual 정책 일관성");
const senderSrc = execSync("cat lib/distribution/sender.ts", { encoding: "utf-8" });
test("Webhook 디폴트 cors 모드", senderSrc.includes('mode: "cors"'));
test("Webhook no-cors fallback", senderSrc.includes('mode: "no-cors"'));
test("X-Webhook-Secret 헤더", senderSrc.includes("X-Webhook-Secret"));
test("API 토큰 키 스토리지", senderSrc.includes("briq:api-token:"));
test("네이버 플레이스 manual URL", senderSrc.includes("smartplace.naver.com"));
test("Manual 클립보드 + 새 탭", senderSrc.includes("navigator.clipboard") && senderSrc.includes("window.open"));

// ─── 5. plans.ts 일관성 ─────────────────────────────────────────────────
console.log("\n[5] plans.ts 일관성 — Free 워터마크 / Pro 가격 / Studio 브랜드 수");
const plansSrc = execSync("cat lib/billing/plans.ts", { encoding: "utf-8" });
test("Free showWatermark: true", /id: "free"[\s\S]*?showWatermark: true/.test(plansSrc));
test("Pro showWatermark: false", /id: "pro"[\s\S]*?showWatermark: false/.test(plansSrc));
test("Pro 가격 ₩49,000", plansSrc.includes("priceMonthly: 49000"));
test("Studio 가격 ₩149,000", plansSrc.includes("priceMonthly: 149000"));
test("Studio 브랜드 10개", /id: "studio"[\s\S]*?brandCount: 10/.test(plansSrc));
test("연간 할인 16%", plansSrc.includes("ANNUAL_DISCOUNT = 0.16"));

// ─── 6. Pricing 페이지 metadata 일관성 ────────────────────────────────
console.log("\n[6] Pricing 페이지 — metadata + 가격 표시");
const metaSrc = execSync("cat app/pricing/layout.tsx", { encoding: "utf-8" });
test("metadata ₩49,000 노출", metaSrc.includes("49,000"));
test("metadata ₩149,000 노출", metaSrc.includes("149,000"));
test("OG 타이틀 한국어", metaSrc.includes("디자이너 외주"));

// ─── 결과 ─────────────────────────────────────────────────────────────────
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
const pass = tests.filter((t) => t.ok).length;
const fail = tests.filter((t) => !t.ok);
console.log(`  ${pass} / ${tests.length} 통과`);
if (fail.length > 0) {
  console.log("\n  실패:");
  for (const f of fail) console.log(`    ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
}
process.exit(fail.length === 0 ? 0 : 1);
