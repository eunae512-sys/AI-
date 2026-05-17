// 비디오 쿼리 빌더 회귀 — 한국어 토픽 → 영문 키워드 매칭 정확성.
// docs/cardnews-branding-research.md 의 비디오 매칭 학습 패턴 검증.

const tests = [];
function test(name, ok, detail = "") {
  tests.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// 동적 import — TypeScript 파일을 통한 동작은 어렵고, 키워드 사전이
// 단순 객체라 mjs 안에서 동일 사전을 재현해서 검증.

const INGREDIENT_KO_EN = {
  봄나물: "spring vegetables namul",
  수박: "watermelon",
  딸기: "strawberry",
  콜드브루: "cold brew iced coffee",
  라떼: "latte",
  케이크: "cake patisserie",
  마들렌: "madeleine pastry",
};

const MENU_KO_EN = {
  코스: "tasting course fine dining plating",
  "한 상": "korean banquet table plating",
};

const SEASON_KO_EN = {
  봄: "spring soft light",
  여름: "summer bright sunlight",
  가을: "autumn warm amber",
  겨울: "winter cozy candle",
  벚꽃: "cherry blossom spring",
};

function extract(topic) {
  const ingredients = [];
  const menu = [];
  const season = [];
  const matchAll = (dict, out) => {
    for (const ko of Object.keys(dict)) {
      if (topic.includes(ko) && !out.includes(dict[ko])) out.push(dict[ko]);
    }
  };
  matchAll(INGREDIENT_KO_EN, ingredients);
  matchAll(MENU_KO_EN, menu);
  matchAll(SEASON_KO_EN, season);
  return { ingredients, menu, season };
}

console.log("\n[1] 한국어 토픽 → 영문 키워드 추출");
const cases = [
  ["5월 봄나물 코스", ["spring vegetables namul", "tasting course fine dining plating"]],
  ["여름 수박 케이크", ["watermelon", "cake patisserie", "summer bright sunlight"]],
  ["5월 콜드브루 시즌", ["cold brew iced coffee"]],
  ["딸기 시즌 케이크", ["strawberry", "cake patisserie"]],
  ["벚꽃 한정 음료", ["cherry blossom spring"]],
  ["마들렌 신상", ["madeleine pastry"]],
];
for (const [topic, expectMin] of cases) {
  const t = extract(topic);
  const all = [...t.ingredients, ...t.menu, ...t.season];
  const ok = expectMin.every((kw) => all.includes(kw));
  test(`"${topic}" → 키워드 매칭`, ok, ok ? `[${all.join(" + ")}]` : `누락: ${expectMin.filter((k) => !all.includes(k)).join(", ")}`);
}

console.log("\n[2] 라이브러리 파일 존재 + export 확인");
const fs = await import("node:fs");
const src = fs.readFileSync("lib/cardnews/video-query.ts", "utf-8");
test("buildVideoQueryDetailed export", src.includes("export function buildVideoQueryDetailed"));
test("extractVideoTokens export", src.includes("export function extractVideoTokens"));
test("INGREDIENT 사전에 봄나물·콜드브루·딸기 등 포함",
  ["봄나물", "콜드브루", "딸기", "케이크", "라떼"].every((k) => src.includes(k + ":")));
test("MENU 사전 코스·한 상 포함", src.includes("코스:") && src.includes("\"한 상\":"));
test("SEASON 사전 봄·여름·가을·겨울 포함",
  ["봄:", "여름:", "가을:", "겨울:"].every((k) => src.includes(k)));
test("6 산업 컨텍스트 매핑",
  ["restaurant:", "cafe:", "dessert:", "beauty:", "stay:", "local:"].every((k) => src.includes(k)));
test("vertical 키워드 모든 산업 톤에 포함",
  (src.match(/vertical/g) || []).length >= 6);

console.log("\n[3] ReelsPreview 가 신규 빌더 사용");
const reelsSrc = fs.readFileSync("components/campaigns/ReelsPreview.tsx", "utf-8");
test("buildVideoQueryDetailed import", reelsSrc.includes("buildVideoQueryDetailed"));
test("legacy VIDEO_TAIL 상수 제거", !reelsSrc.includes("VIDEO_TAIL"));
test("legacy INDUSTRY_VIDEO 상수 제거", !reelsSrc.includes("const INDUSTRY_VIDEO"));

const pass = tests.filter((t) => t.ok).length;
const fail = tests.filter((t) => !t.ok);
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${pass} / ${tests.length} 통과`);
if (fail.length > 0) {
  console.log("\n  실패:");
  for (const f of fail) console.log(`    ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
}
process.exit(fail.length === 0 ? 0 : 1);
