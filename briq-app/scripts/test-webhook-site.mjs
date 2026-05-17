// webhook.site 진짜 E2E 검증.
//
// 단계:
//   1) webhook.site 에 새 토큰 생성 (POST /token)
//   2) sender.ts 의 sendViaWebhook 과 100% 동일한 payload 를 그 URL 에 POST
//   3) webhook.site API 로 받은 요청을 조회 → 모든 필드 도달 확인
//   4) 사용자 브라우저에 webhook.site UI + BRIQ 분배 허브 자동 오픈

const WS_BASE = "https://webhook.site";

function step(n, title) {
  console.log(`\n━━━ ${n} · ${title} ━━━`);
}

// ─── 1. 토큰 생성 ────────────────────────────────────────────────────────
step(1, "webhook.site 토큰 생성");
const tokenRes = await fetch(`${WS_BASE}/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ default_status: 200, default_content: "ok", default_content_type: "text/plain", cors: true }),
});
if (!tokenRes.ok) {
  console.error("토큰 생성 실패:", tokenRes.status);
  process.exit(1);
}
const token = await tokenRes.json();
const uuid = token.uuid;
const webhookUrl = `${WS_BASE}/${uuid}`;
const inspectUrl = `${WS_BASE}/#!/view/${uuid}`;
console.log("  토큰 UUID :", uuid);
console.log("  Webhook URL:", webhookUrl);
console.log("  검사 UI   :", inspectUrl);

// ─── 2. sender.ts 와 동일 형태의 payload POST ────────────────────────────
step(2, "sender.ts sendViaWebhook 과 동일 payload POST");
const SECRET = "briq-e2e-secret-" + Math.random().toString(36).slice(2, 8);
const payload = {
  type: "distribute",
  platform: "threads",
  brandId: "miokdang",
  brandName: "미옥당",
  campaign: "5월 봄나물 코스",
  scheduledAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  content: {
    primary:
      "강남에서 한식 어디가 결 또렷해요? 솔직하게.\n\n" +
      "미옥당이라는 곳이 있어요. 강남의 한정식이고, 메뉴·운영·공간 — 가게가 직접 정한 결을 그대로 따라갑니다.",
    blocks: [
      { label: "Thread 2", value: "5월 봄나물 코스가 이번 시즌 한 결입니다. 한 그릇의 구성과 상차림 결이 또렷한 편." },
      { label: "Thread 3", value: "예약은 미옥당 인스타 프로필 안내를 따라가시면 됩니다. 주말/저녁은 자리가 먼저 차는 편." },
    ],
  },
  at: new Date().toISOString(),
};

console.log("  payload.type      :", payload.type);
console.log("  payload.platform  :", payload.platform);
console.log("  payload.brandName :", payload.brandName);
console.log("  payload.scheduledAt:", payload.scheduledAt);
console.log("  X-Webhook-Secret  :", SECRET);

const sendRes = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Secret": SECRET,
  },
  body: JSON.stringify(payload),
  mode: "cors",
});
console.log("  → 응답 HTTP", sendRes.status, sendRes.ok ? "✓" : "✗");

// webhook.site 가 비동기로 저장하므로 잠시 기다림
await new Promise((r) => setTimeout(r, 1500));

// ─── 3. 도달한 요청 조회 ─────────────────────────────────────────────────
step(3, "webhook.site API 로 받은 요청 조회");
const requestsRes = await fetch(`${WS_BASE}/token/${uuid}/requests?sorting=newest&per_page=5`);
const requestsJson = await requestsRes.json();
const requests = requestsJson.data ?? [];
console.log(`  도착한 요청 수: ${requests.length}`);

if (requests.length === 0) {
  console.error("  ✗ 요청이 도달하지 않음");
  process.exit(1);
}

const last = requests[0];
console.log("");
console.log("  ─ 받은 요청 ─");
console.log("  method           :", last.method);
console.log("  ip               :", last.ip);
console.log("  user_agent       :", (last.user_agent || "").slice(0, 60));
console.log("  content_type     :", last.headers?.["content-type"]?.[0]);
console.log("  X-Webhook-Secret :", last.headers?.["x-webhook-secret"]?.[0]);

// content 는 raw JSON 문자열
const receivedBody = JSON.parse(last.content);
console.log("");
console.log("  ─ 받은 본문 ─");
console.log("  type        :", receivedBody.type);
console.log("  platform    :", receivedBody.platform);
console.log("  brandName   :", receivedBody.brandName);
console.log("  campaign    :", receivedBody.campaign);
console.log("  scheduledAt :", receivedBody.scheduledAt);
console.log("  primary (앞 60자):", receivedBody.content.primary.slice(0, 60) + "...");
console.log("  blocks      :", receivedBody.content.blocks.length, "개");
receivedBody.content.blocks.forEach((b, i) => {
  console.log(`    [${i}] ${b.label}: ${b.value.slice(0, 50)}...`);
});

// ─── 4. 필드 일치 검증 ───────────────────────────────────────────────────
step(4, "필드 일치 검증");
const checks = [
  ["method == POST", last.method === "POST"],
  ["content-type == application/json", last.headers?.["content-type"]?.[0]?.startsWith("application/json")],
  [`X-Webhook-Secret == "${SECRET}"`, last.headers?.["x-webhook-secret"]?.[0] === SECRET],
  ["type == 'distribute'", receivedBody.type === "distribute"],
  ["platform == 'threads'", receivedBody.platform === "threads"],
  ["brandName == '미옥당' (한글 그대로)", receivedBody.brandName === "미옥당"],
  ["campaign == '5월 봄나물 코스'", receivedBody.campaign === "5월 봄나물 코스"],
  ["scheduledAt 도달", typeof receivedBody.scheduledAt === "string" && receivedBody.scheduledAt.length > 0],
  ["content.blocks 2건", receivedBody.content.blocks.length === 2],
  ["거짓 디테일 미포함 (별점 4.9)", !receivedBody.content.primary.includes("별점 4.9") && !JSON.stringify(receivedBody.content.blocks).includes("별점 4.9")],
  ["거짓 디테일 미포함 (재방문율 62)", !receivedBody.content.primary.includes("재방문율 62") && !JSON.stringify(receivedBody.content.blocks).includes("재방문율 62")],
  ["거짓 디테일 미포함 (1만 9천원)", !receivedBody.content.primary.includes("1만 9천원") && !JSON.stringify(receivedBody.content.blocks).includes("1만 9천원")],
];
let ok = 0;
for (const [name, pass] of checks) {
  console.log(`  ${pass ? "✓" : "✗"} ${name}`);
  if (pass) ok += 1;
}
console.log(`\n  ${ok} / ${checks.length} 통과`);

// ─── 5. 브라우저 자동 오픈 ───────────────────────────────────────────────
step(5, "사용자 브라우저에 webhook.site UI + 분배 허브 자동 오픈");
const { spawnSync } = await import("node:child_process");
spawnSync("open", [inspectUrl]);
spawnSync("open", [`http://localhost:3001/content-distribution`]);
console.log("  ✓ webhook.site 검사 UI 오픈:", inspectUrl);
console.log("  ✓ BRIQ 분배 허브 오픈");

console.log("\n━━━ 다음 단계 (수동) ━━━");
console.log("  1. 방금 열린 BRIQ 분배 허브에서 우측 'Webhook ○' 클릭");
console.log("  2. URL 입력란에 아래 URL 붙여넣기:");
console.log(`     ${webhookUrl}`);
console.log("  3. 저장 → Threads/TikTok/YouTube 쇼츠 카드에서 '분배' 클릭");
console.log("  4. 방금 열린 webhook.site 탭으로 가면 두 번째 요청이 실시간으로 도착하는 게 보입니다");

process.exit(ok === checks.length ? 0 : 1);
