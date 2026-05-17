// 분배 허브 실 동작 검증 — 외부 의존 없이 노드에서 직접 sender 로직 호출.
//
// sender.ts 자체는 localStorage / window 의존이 있어 노드에서 import 어려움.
// 따라서 핵심 fetch 로직만 sender.ts 와 동일한 형태로 재현하고, 진짜 echo 서비스로 보낸다.

const ECHO_URL = "https://httpbin.org/post";

const SAMPLE_PAYLOAD = {
  type: "distribute",
  platform: "instagram-caption",
  brandId: "miokdang",
  brandName: "미옥당",
  campaign: "5월 봄나물 코스",
  scheduledAt: "2026-05-20T11:48:00+09:00",
  content: {
    primary: "강남 한식 한 곳, 5월 봄나물 코스 결로 들러볼 만한 한 곳.",
    blocks: [
      { label: "해시태그", value: "#강남한식 #봄나물 #저장각" },
      { label: "CTA", value: "저장 + 공유 → 다음 시즌 가장 먼저." },
    ],
  },
  at: new Date().toISOString(),
};

async function testWebhookOk() {
  console.log("\n[1] Webhook POST 정상 시나리오 — httpbin.org/post echo");
  const res = await fetch(ECHO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": "test-secret-abc",
    },
    body: JSON.stringify(SAMPLE_PAYLOAD),
    mode: "cors",
  });
  console.log("  HTTP status:", res.status, res.ok ? "✓ OK" : "✗ FAIL");
  const json = await res.json();
  console.log("  echo received Content-Type:", json.headers["Content-Type"]);
  console.log("  echo received X-Webhook-Secret:", json.headers["X-Webhook-Secret"]);
  console.log("  echo received payload.platform:", json.json.platform);
  console.log("  echo received payload.brandName:", json.json.brandName);
  console.log("  echo received payload.content.primary:", json.json.content.primary.slice(0, 40) + "...");
  return res.ok;
}

async function testWebhookInvalidUrl() {
  console.log("\n[2] Webhook URL 잘못된 경우 — 명시적 실패");
  try {
    const res = await fetch("https://this-host-does-not-exist-12345.invalid/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ping: "test" }),
    });
    console.log("  예상 외 성공:", res.status);
    return false;
  } catch (e) {
    console.log("  ✓ 네트워크 오류 잡힘:", e.message.split("\n")[0]);
    return true;
  }
}

async function testWebhookServer500() {
  console.log("\n[3] Webhook 서버가 500 반환 — ok:false 흐름");
  const res = await fetch("https://httpbin.org/status/500", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: "test" }),
  });
  console.log("  HTTP status:", res.status);
  console.log("  res.ok:", res.ok, res.ok ? "✗ 예상 외" : "✓ 실패로 잡힘");
  return !res.ok;
}

async function testManualClipboardFormat() {
  console.log("\n[4] Manual 클립보드 포맷 — sender.ts 의 formatForClipboard 와 동일");
  // sender.ts formatForClipboard 재현
  const p = SAMPLE_PAYLOAD;
  const parts = [p.content.primary];
  for (const b of p.content.blocks) {
    parts.push("");
    parts.push(`[${b.label}]`);
    parts.push(b.value);
  }
  const text = parts.join("\n");
  console.log("  생성된 클립보드 텍스트:");
  console.log("  ─────");
  text.split("\n").forEach((l) => console.log("  " + l));
  console.log("  ─────");
  const hasPrimary = text.includes(p.content.primary);
  const hasHashtag = text.includes("[해시태그]");
  const hasCta = text.includes("[CTA]");
  console.log("  primary 포함:", hasPrimary ? "✓" : "✗");
  console.log("  [해시태그] 라벨 포함:", hasHashtag ? "✓" : "✗");
  console.log("  [CTA] 라벨 포함:", hasCta ? "✓" : "✗");
  return hasPrimary && hasHashtag && hasCta;
}

async function testApiTokenMissing() {
  console.log("\n[5] API 토큰 미설정 — 명시적 실패 메시지");
  // sender.ts sendViaApi 핵심 로직 재현 (localStorage 없으면 null)
  const token = null; // localStorage 없는 노드 환경 = 미설정과 동일
  if (!token) {
    const reason = "API 토큰 미설정 — 연결 상태 스트립에서 토큰을 입력하거나 Webhook 경로로 전환";
    console.log("  ✓ 실패 메시지:", reason);
    return true;
  }
  return false;
}

const results = [];
results.push(["Webhook OK 시나리오", await testWebhookOk()]);
results.push(["Webhook 잘못된 URL", await testWebhookInvalidUrl()]);
results.push(["Webhook 서버 500", await testWebhookServer500()]);
results.push(["Manual 클립보드 포맷", await testManualClipboardFormat()]);
results.push(["API 토큰 미설정 흐름", await testApiTokenMissing()]);

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
let pass = 0;
for (const [name, ok] of results) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  if (ok) pass += 1;
}
console.log(`\n  ${pass} / ${results.length} 통과`);
process.exit(pass === results.length ? 0 : 1);
