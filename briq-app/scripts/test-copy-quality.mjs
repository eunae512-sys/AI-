// 작가 톤 회귀 — 발행되는 카피에 어색한 패턴 없는지.
//
// 체크:
//   1. fallback 표기 (XX(YY)) 0건
//   2. "결" 단어 비율 — 한 캠페인 안 과사용 X
//   3. "한 곳" "또렷한" 등 반복 어휘 — 한 페이지 3회 이하
//   4. 같은 문장 반복 X

import { execSync } from "node:child_process";

const tests = [];
function test(name, ok, detail = "") {
  tests.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n[1] fallback 표기 (XX(YY)) — 발행 카피에 노출되면 안 됨");
const fallbacks = ["을(를)", "이(가)", "은(는)", "와(과)", "으로(로)"];
for (const pat of fallbacks) {
  const cmd = `grep -F "${pat}" lib/cardnews/hook-generator.ts lib/content/multi-channel-generator.ts 2>/dev/null | wc -l`;
  const n = parseInt(execSync(cmd, { encoding: "utf-8" }).trim(), 10);
  test(`"${pat}" 미포함`, n === 0, n > 0 ? `${n}건 남음` : "");
}

console.log("\n[2] 어휘 다양성 — 한 페이지 안 같은 표현 과사용 방지");
// 카피 생성 코드에서 실 노출되는 문자열만 추려 빈도 측정
// (코멘트·변수명·import 등은 제외)
const sources = ["lib/cardnews/hook-generator.ts", "lib/content/multi-channel-generator.ts"];
function countInStrings(word) {
  let total = 0;
  for (const f of sources) {
    const cmd = `grep -oE "[\\"\\\`'][^\\"\\\`']*${word}[^\\"\\\`']*[\\"\\\`']" "${f}" 2>/dev/null | wc -l`;
    total += parseInt(execSync(cmd, { encoding: "utf-8" }).trim(), 10);
  }
  return total;
}

const wordChecks = [
  ["결", 25],          // 함수명 "결정"도 들어가 다소 높음, 의미적으로 OK
  ["또렷한", 8],
  ["한 곳", 12],
  ["가게", 5],         // 너무 부족하면 단조로움 — 최소 5건 이상이어야 어휘 분산
];

for (const [word, ceiling] of wordChecks) {
  const c = countInStrings(word);
  if (word === "가게") {
    test(`"${word}" 최소 ${ceiling}건 이상 (어휘 분산용)`, c >= ceiling, `${c}건`);
  } else {
    test(`"${word}" 한 코드베이스 ${ceiling}건 이하`, c <= ceiling, `${c}건`);
  }
}

console.log("\n[3] 문법 안전 — 받침 헬퍼 (은/이/을/과/으로) import 됨");
const hookGenHasImport = execSync(`grep -c "korean-particles" lib/cardnews/hook-generator.ts`, { encoding: "utf-8" }).trim() === "1";
const mcGenHasImport = execSync(`grep -c "korean-particles" lib/content/multi-channel-generator.ts`, { encoding: "utf-8" }).trim() === "1";
test("hook-generator 에 헬퍼 import", hookGenHasImport);
test("multi-channel-generator 에 헬퍼 import", mcGenHasImport);

console.log("\n[4] 톤 분리 — 인스타·페북 친근체 사용 확인");
// industryTone 의 casualEssence/casualDetail 필드 — 친근체 (~예요/해요)
const mcSrc = execSync("cat lib/content/multi-channel-generator.ts", { encoding: "utf-8" });
test("industryTone 에 casualEssence 필드", mcSrc.includes("casualEssence"));
test("industryTone 에 casualDetail 필드", mcSrc.includes("casualDetail"));
test("스레드 카피에 친근체 사용 (~돼요/예요)", /casualEssence|casualDetail/.test(mcSrc.match(/function buildThreads[\s\S]+?\n}/)?.[0] || ""));

console.log("\n[5] 거짓 디테일 회귀 — 자동 생성 코드에 단정 숫자 없음");
const fdPatterns = ["새벽 4시", "별점 4.9", "재방문율 62", "후기 247", "한 코스 3시간", "20년차"];
for (const pat of fdPatterns) {
  const cmd = `grep "${pat}" lib/cardnews/hook-generator.ts lib/content/multi-channel-generator.ts 2>/dev/null | grep -v "정책:" | grep -v "// " | wc -l`;
  const n = parseInt(execSync(cmd, { encoding: "utf-8" }).trim(), 10);
  test(`"${pat}" 자동 생성 경로 0건`, n === 0, n > 0 ? `${n}건` : "");
}

const pass = tests.filter((t) => t.ok).length;
const fail = tests.filter((t) => !t.ok);
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${pass} / ${tests.length} 통과`);
if (fail.length > 0) {
  console.log("\n  실패:");
  for (const f of fail) console.log(`    ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
}
process.exit(fail.length === 0 ? 0 : 1);
