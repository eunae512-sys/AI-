import { describe, expect, it } from "vitest";
import type { Brand } from "@/types";
import { getShopHand, TONE_LIST, type VoiceTone } from "./today-shift";

// 신규 가짜수치 패턴 — 입력 signatureMenu 에 숫자가 없는 한 출력에 등장하면 안 됨.
const FAKE_NUMBER_RE = /\d+개|\+?\d+(\.\d+)?배|저장 상위|상위 \d/;

function makeBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: "brand-test-1",
    name: "한상차림",
    letter: "한",
    industry: "dessert",
    industryLabel: "디저트",
    city: "성수동",
    toneVersion: 1,
    brandColors: { primary: "#3F362C", secondary: "#EFE6D5" },
    gradient: "from-stone-400 via-stone-600 to-stone-800",
    campaign: "Linen & Clay · 첫 캠페인", // placeholder 형태 (· 첫 캠페인)
    mood: "warm",
    followers: 0,
    saveRate: 0,
    reachThisMonth: 0,
    ...overrides,
  };
}

const NOW = new Date("2026-06-08T10:00:00Z"); // 6월 = 여름

describe("getShopHand — 실주제 주입형 톤 래퍼", () => {
  it("Test 1: signatureMenu 주입 시 5개 톤 모두 실메뉴를 주제로 출력", () => {
    const brand = makeBrand();
    const menu = "휘낭시에";
    for (const tone of TONE_LIST) {
      const hand = getShopHand(brand, tone, NOW, { signatureMenu: [menu] });
      const blob = `${hand.today.slideTitle}\n${hand.today.caption}`;
      expect(blob, `tone=${tone} 에 실메뉴가 없음`).toContain(menu);
    }
  });

  it("Test 2: signatureMenu 없음 → 폴백 주제가 시즌/캠페인에서 도출 (하드코딩 '60개' 미포함)", () => {
    const brand = makeBrand();
    for (const tone of TONE_LIST) {
      const hand = getShopHand(brand, tone, NOW); // realData 없음
      const blob = `${hand.today.slideTitle}\n${hand.today.slideHint ?? ""}\n${hand.today.caption}`;
      expect(blob, `tone=${tone} 에 하드코딩 60개 회귀`).not.toContain("60개");
      expect(blob).not.toContain("Sixty pieces");
    }
  });

  it("Test 3: 같은 입력 2회 호출 → slideTitle/caption 동일 (결정론)", () => {
    const brand = makeBrand();
    const real = { signatureMenu: ["갈비찜", "냉이된장국"] };
    for (const tone of TONE_LIST) {
      const a = getShopHand(brand, tone, NOW, real);
      const b = getShopHand(brand, tone, NOW, real);
      expect(a.today.slideTitle).toBe(b.today.slideTitle);
      expect(a.today.caption).toBe(b.today.caption);
      expect(a.today.slideHint).toBe(b.today.slideHint);
    }
  });

  it("Test 4: 신규 가짜수치 패턴이 어떤 입력에서도 등장하지 않음", () => {
    const industries: Brand["industry"][] = [
      "restaurant", "cafe", "dessert", "stay", "beauty", "local",
    ];
    for (const industry of industries) {
      const brand = makeBrand({ industry });
      for (const tone of TONE_LIST) {
        // (a) 메뉴 주입 (숫자 없는 메뉴)
        const withMenu = getShopHand(brand, tone, NOW, { signatureMenu: ["제철 한 상"] });
        const blobMenu = `${withMenu.today.slideTitle}\n${withMenu.today.slideHint ?? ""}\n${withMenu.today.caption}`;
        expect(blobMenu, `[menu] ${industry}/${tone} 가짜수치`).not.toMatch(FAKE_NUMBER_RE);
        // (b) 폴백 (시즌)
        const fallback = getShopHand(brand, tone, NOW);
        const blobFb = `${fallback.today.slideTitle}\n${fallback.today.slideHint ?? ""}\n${fallback.today.caption}`;
        expect(blobFb, `[season] ${industry}/${tone} 가짜수치`).not.toMatch(FAKE_NUMBER_RE);
      }
    }
  });

  it("Test 5: 같은 실주제라도 5개 톤의 slideLabel/문체가 톤별로 다름", () => {
    const brand = makeBrand({ industry: "restaurant" });
    const real = { signatureMenu: ["갈비찜"] };
    const labels = TONE_LIST.map((tone: VoiceTone) => getShopHand(brand, tone, NOW, real).today.slideLabel);
    // 5개 라벨이 모두 동일하지는 않음 (톤별 정체성 유지)
    expect(new Set(labels).size).toBeGreaterThan(1);
    const captions = TONE_LIST.map((tone) => getShopHand(brand, tone, NOW, real).today.caption);
    expect(new Set(captions).size).toBeGreaterThan(1);
  });

  it("결정론 보강: realData 미지정 폴백도 2회 호출 동일", () => {
    const brand = makeBrand({ industry: "cafe" });
    const a = getShopHand(brand, "editorial", NOW);
    const b = getShopHand(brand, "editorial", NOW);
    expect(a.today.slideTitle).toBe(b.today.slideTitle);
    expect(a.today.caption).toBe(b.today.caption);
  });

  it("하위호환: 4번째 인자 없이 호출해도 동작 (기존 데모 호출 무손상)", () => {
    const brand = makeBrand();
    const hand = getShopHand(brand, "warm-shop", NOW);
    expect(hand.today.slideTitle).toBeTruthy();
    expect(hand.today.caption).toBeTruthy();
    expect(Array.isArray(hand.today.hashtags)).toBe(true);
  });

  it("reasoning 이 도출 출처를 정직하게 표기 (menu vs season)", () => {
    const brand = makeBrand();
    const menuHand = getShopHand(brand, "editorial", NOW, { signatureMenu: ["휘낭시에"] });
    expect(menuHand.today.reasoning).toContain("시그니처 메뉴");
    const seasonHand = getShopHand(brand, "editorial", NOW);
    expect(seasonHand.today.reasoning).toContain("시즌");
  });
});
