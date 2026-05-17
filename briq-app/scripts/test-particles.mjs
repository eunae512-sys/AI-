// 한국어 조사 헬퍼 검증.

const cases = [
  ["미옥당", "은", "미옥당은"],
  ["미옥당", "이", "미옥당이"],
  ["미옥당", "을", "미옥당을"],
  ["미옥당", "으로", "미옥당으로"],
  ["미옥당", "이라", "미옥당이라"],
  ["카페", "은", "카페는"],
  ["카페", "이", "카페가"],
  ["카페", "을", "카페를"],
  ["카페", "으로", "카페로"],
  ["카페", "이라", "카페라"],
  ["서울", "은", "서울은"],
  ["서울", "이", "서울이"],
  ["서울", "을", "서울을"],
  ["서울", "으로", "서울로"],
  ["봄나물 코스", "은", "봄나물 코스는"],
  ["손님", "이", "손님이"],
  ["손님", "과", "손님과"],
  ["손님", "와", "손님과"],
  ["BRIQ", "은", "BRIQ는"],
  ["BRIQ", "을", "BRIQ를"],
  ["미옥당", "와", "미옥당과"],
  ["Roastery1985", "이라", "Roastery1985라"],
  ["Luna Hair", "이라", "Luna Hair라"],
];

function lastJongseong(s) {
  if (!s) return -1;
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return -1;
  return (code - 0xac00) % 28;
}
function hasFinal(s) {
  const j = lastJongseong(s);
  return j !== -1 && j !== 0;
}
function applyParticle(word, particle) {
  const j = lastJongseong(word);
  switch (particle) {
    case "은": return word + (hasFinal(word) ? "은" : "는");
    case "이": return word + (hasFinal(word) ? "이" : "가");
    case "을": return word + (hasFinal(word) ? "을" : "를");
    case "과":
    case "와": return word + (hasFinal(word) ? "과" : "와");
    case "이라": return word + (hasFinal(word) ? "이라" : "라");
    case "으로":
      if (j === -1 || j === 0 || j === 8) return word + "로";
      return word + "으로";
  }
}

let pass = 0;
for (const [w, p, expected] of cases) {
  const got = applyParticle(w, p);
  const ok = got === expected;
  console.log(`  ${ok ? "✓" : "✗"} ${w} + ${p} → ${got}${ok ? "" : ` (기대 ${expected})`}`);
  if (ok) pass++;
}
console.log(`\n  ${pass} / ${cases.length} 통과`);
process.exit(pass === cases.length ? 0 : 1);
