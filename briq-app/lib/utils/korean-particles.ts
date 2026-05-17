// 한국어 조사 자동 처리 — 받침 유무에 따라 정확한 조사 선택.
//
// 문제: 자동 생성 카피에서 `${name}을(를)` 같은 fallback 표기가 발행물에 그대로 노출되는 사고.
// 해결: 한글 마지막 음절의 종성(받침)을 코드포인트로 판별 → 매번 올바른 조사 부착.
//
// 정책:
//   · 한글이 아닌 단어(영문·숫자)는 받침 없음으로 가정 (한글 SNS 카피 맥락 99% 안전)
//   · 외래어는 발음상 받침 처리가 다양해 단순화 — 필요 시 외래어 사전 추가

// 한글 유니코드 종성 인덱스 0..27 (0=없음, 8=ㄹ 특수 — 으로 처리)
function lastJongseong(s: string): number {
  if (!s) return -1;
  const code = s.charCodeAt(s.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return -1; // 한글 아님
  return (code - 0xac00) % 28;
}

function hasFinal(s: string): boolean {
  const j = lastJongseong(s);
  if (j === -1) return false; // 한글 아니면 받침 없음 가정
  return j !== 0;
}

// 단일 조사 헬퍼 — 가독성 좋게 메서드별 함수
export function 을(word: string): string {
  return word + (hasFinal(word) ? "을" : "를");
}
export function 이(word: string): string {
  return word + (hasFinal(word) ? "이" : "가");
}
export function 은(word: string): string {
  return word + (hasFinal(word) ? "은" : "는");
}
export function 과(word: string): string {
  return word + (hasFinal(word) ? "과" : "와");
}
// 으로/로 — ㄹ 받침은 예외적으로 "로"
export function 으로(word: string): string {
  const j = lastJongseong(word);
  if (j === -1) return word + "로"; // 한글 아님 = 받침 없음
  if (j === 0 || j === 8) return word + "로"; // 받침 없음 OR ㄹ 받침
  return word + "으로";
}
// 아/야 (호격)
export function 아(word: string): string {
  return word + (hasFinal(word) ? "아" : "야");
}

// 이라/라 — "X(이)라는", "X(이)라고" 같은 인용·정의 표현
// "Luna Hair이라는" 어색 → "Luna Hair라는" 으로 자동 보정
export function 이라(word: string): string {
  return word + (hasFinal(word) ? "이라" : "라");
}
export const ira = 이라;

// 통합 인터페이스 — 한 함수에 모아두고 싶은 경우
export type Particle = "은" | "이" | "을" | "과" | "으로" | "아" | "이라";
export function p(word: string, particle: Particle): string {
  switch (particle) {
    case "은": return 은(word);
    case "이": return 이(word);
    case "을": return 을(word);
    case "과": return 과(word);
    case "으로": return 으로(word);
    case "아": return 아(word);
    case "이라": return 이라(word);
  }
}

// 짧은 syntax sugar — 자주 쓰는 패턴
//   `${name}이(가) 시그니처` → `${i(name)} 시그니처`
export const eun = 은;
export const i = 이;
export const eul = 을;
export const gwa = 과;
export const ro = 으로;
