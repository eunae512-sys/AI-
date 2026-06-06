/**
 * jiti probe — imageQueryFor 역할 모디파이어 검증
 * 6업종 × 3토픽 → 7슬라이드 imageQuery 어서트
 *
 * 실행: cd briq-app && node scripts/probe-image-query.mjs
 */

import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

const jiti = createJiti(import.meta.url, {
  alias: { "@": appRoot },
});

const mod = await jiti.import(path.join(appRoot, "lib/cardnews/hook-generator.ts"));
const { generateCardnewsCampaign } = mod;

// 6업종
const INDUSTRIES = [
  { industry: "restaurant", industryLabel: "한정식", catShort: "한정식" },
  { industry: "cafe",       industryLabel: "스페셜티 카페", catShort: "카페" },
  { industry: "dessert",    industryLabel: "돌체 디저트", catShort: "디저트" },
  { industry: "beauty",     industryLabel: "헤어살롱", catShort: "헤어" },
  { industry: "stay",       industryLabel: "한옥스테이", catShort: "한옥스테이" },
  { industry: "local",      industryLabel: "로컬패션", catShort: "패션" },
];

// 3토픽 — 음식 키워드 포함
const TOPICS = [
  "시즌 딸기 케이크",
  "여름 망고 빙수",
  "크리스마스 슈톨렌",
];

// 금지어 (a)
const BANNED = ["welcoming entrance", "quiet corner", "candid"];

// 음식 토픽 → 기대 영단어 매핑 (c) — 쿼리 앞 60자에서 확인
const FOOD_KW = {
  "시즌 딸기 케이크": "cake",
  "여름 망고 빙수": "mango",
  "크리스마스 슈톨렌": "stollen",
};

let totalPass = 0;
let totalFail = 0;

function makeBrand(ind) {
  return {
    id: `probe-${ind.industry}`,
    name: `테스트 ${ind.catShort}`,
    letter: "T",
    industry: ind.industry,
    industryLabel: ind.industryLabel,
    city: "마포",
    toneVersion: 1,
    brandColors: { primary: "#000", secondary: "#fff" },
    gradient: "linear-gradient(#000,#fff)",
    campaign: "시즌 캠페인",
    mood: "warm",
    followers: 8000,
    saveRate: 5.4,
    reachThisMonth: 40000,
  };
}

for (const ind of INDUSTRIES) {
  const brand = makeBrand(ind);
  for (const topic of TOPICS) {
    const result = generateCardnewsCampaign(topic, brand);
    const queries = result.slides.map((s) => s.imageQuery);
    const valueQueries = result.slides
      .filter((s) => s.role === "value")
      .map((s) => s.imageQuery);

    // (a) 금지어 검사
    const bannedFound = queries.flatMap((q) =>
      BANNED.filter((b) => q.toLowerCase().includes(b))
    );
    const aPass = bannedFound.length === 0;

    // (b) value 3개 쿼리 모두 다른지
    const valueSet = new Set(valueQueries);
    const bPass = valueSet.size === 3;

    // (c) 음식 토픽 키워드 앞 60자 포함 여부
    const expectedKw = FOOD_KW[topic];
    const cPass = expectedKw
      ? queries.some((q) => q.slice(0, 60).toLowerCase().includes(expectedKw))
      : true;

    // (d) 모든 쿼리에 'no people' 포함
    const dPass = queries.every((q) => q.includes("no people"));

    const rowPass = aPass && bPass && cPass && dPass;
    if (rowPass) totalPass++;
    else totalFail++;

    const status = rowPass ? "PASS" : "FAIL";
    const detail = [
      aPass ? "" : `[a:FAIL banned=${bannedFound.join(",")}]`,
      bPass ? "" : `[b:FAIL value-set-size=${valueSet.size}]`,
      cPass ? "" : `[c:FAIL kw=${expectedKw} not in first60]`,
      dPass ? "" : `[d:FAIL no-people missing]`,
    ]
      .filter(Boolean)
      .join(" ");

    const label = `${ind.industry.padEnd(10)} | ${topic.padEnd(18)} | ${status}${detail ? " " + detail : ""}`;
    console.log(label);

    // 샘플 출력 — dessert × 딸기 케이크 CTA 와 value 3개
    if (ind.industry === "dessert" && topic === "시즌 딸기 케이크") {
      const ctaQ = result.slides.find((s) => s.role === "cta")?.imageQuery ?? "";
      console.log(`  [SAMPLE dessert/딸기케이크 CTA  ] ${ctaQ}`);
      valueQueries.forEach((q, i) => {
        console.log(`  [SAMPLE dessert/딸기케이크 value${i + 1}] ${q}`);
      });
    }
  }
}

console.log("\n────────────────────────────────────────────");
console.log(`TOTAL: ${totalPass + totalFail} combos — PASS ${totalPass} / FAIL ${totalFail}`);
if (totalFail > 0) {
  console.error("PROBE FAILED");
  process.exit(1);
} else {
  console.log("ALL ASSERTS PASS");
  process.exit(0);
}
