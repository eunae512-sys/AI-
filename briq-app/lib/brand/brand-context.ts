// 브랜드 컨텍스트 헬퍼.
//
// 선택된 브랜드에서 페이지·컴포넌트가 필요로 하는 부속 데이터(핸들 / 워드마크 / 채널 / 검색 키워드)를
// 한 곳에서 파생한다. 하드코딩된 미옥당/@miokdang_seoul 같은 문자열을 페이지에 박지 않기 위해서.

import type { Brand } from "@/types";

/** 인스타·스레드 핸들. brand.id 기반. */
export function brandHandle(brand: Brand): string {
  const slug = brand.id.replace(/[^a-z0-9]/g, "_");
  return `@${slug}`;
}

/** 매거진식 워드마크 — 상단 라벨이나 카드뉴스 footer 에 들어가는 대문자 표기. */
export function brandWordmark(brand: Brand): string {
  // 영문/숫자/공백만 추출. 한국어 이름이면 그대로 사용 (e.g., "미옥당 본점" → "미옥당 본점").
  const ascii = brand.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (ascii.length >= 3) return ascii.toUpperCase();
  // 한국어 이름이면 마지막 (본점·강남점 등) 제외
  return brand.name.replace(/\s.*$/, "");
}

/** 네이버 블로그 URL slug. */
export function brandBlogHandle(brand: Brand): string {
  return `blog.naver.com/${brand.id.replace(/-/g, "")}`;
}

/** 카카오 채널 — 한국어 가게명 사용. */
export function brandKakaoHandle(brand: Brand): string {
  return brand.name;
}

/** Scheduler 페이지 채널 상태. */
export function brandChannels(brand: Brand) {
  return [
    { name: "Instagram", handle: brandHandle(brand), lastPost: "오늘 10:18", status: "ok" as const, note: "정상" },
    { name: "Naver Blog", handle: brandBlogHandle(brand), lastPost: "5/8 09:30", status: "ok" as const, note: "정상" },
    { name: "Kakao 채널", handle: brandKakaoHandle(brand), lastPost: "5/3 14:00", status: "warn" as const, note: "메시지 큐 3건 대기" },
    { name: "Threads", handle: brandHandle(brand), lastPost: "—", status: "off" as const, note: "미연결" },
  ];
}

/** Insights 검색 키워드 — 브랜드명 + 도시 + 업종 라벨 기반. */
export function brandSearchKeywords(brand: Brand) {
  const city = brand.city.replace(/구$/, ""); // 강남구 → 강남
  const cat = brand.industryLabel.split(/[·\s]/)[0]; // "스페셜티 카페" → "스페셜티"
  return [
    { kw: `${city} ${brand.industryLabel} 점심`, share: 32, delta: "+12%p" },
    { kw: `${city} ${brand.industryLabel} 예약`, share: 18, delta: "+4%p" },
    { kw: brand.name, share: 14, delta: "—" },
    { kw: `${city} ${cat || brand.industryLabel} 코스`, share: 9, delta: "신규" },
    { kw: `${city} 가족 외식`, share: 7, delta: "+2%p" },
  ];
}

/** 업종별 시즌 캠페인 헤드라인 — 시드 캠페인에 쓰는 미니 매트릭스. */
export function brandSeasonalCampaign(brand: Brand): {
  newKindHeadline: string;
  newKindLabel: string;
  newKindRationale: string;
  seasonHeadline: string;
} {
  switch (brand.industry) {
    case "cafe":
      return {
        newKindHeadline: "5월 콜드브루 시즌 한정",
        newKindLabel: "신메뉴",
        newKindRationale: `지난주 '${brand.city.replace(/구$/, "")} 카페 점심' 키워드 유입이 +14%. 그중 절반 이상이 신메뉴를 검색했어요. 시즌 한정 메뉴 발행이 가장 효과적인 시점입니다.`,
        seasonHeadline: "어버이날 — 부모님 선물 원두 세트",
      };
    case "stay":
      return {
        newKindHeadline: "장마 감성 한옥 — 6월 한정 패키지",
        newKindLabel: "신상품",
        newKindRationale: `'서촌 한옥스테이 6월' 키워드가 신규로 떴습니다. 장마철 머무는 결을 강조하는 매거진 톤이 잘 받는 시점입니다.`,
        seasonHeadline: "어버이날 — 부모님 1박 패키지",
      };
    case "dessert":
      return {
        newKindHeadline: "여름 수박 케이크 — 7월 한정",
        newKindLabel: "신메뉴",
        newKindRationale: `'성수동 디저트' 저장률이 7.2% — 시즌 한정 비주얼 컷이 가장 잘 받는 가게입니다. 다음 시즌 발행을 미리 잡아둡니다.`,
        seasonHeadline: "어버이날 — 부모님 케이크 선물",
      };
    case "beauty":
      return {
        newKindHeadline: "5월 봄 컬러 — 시즌 룩북",
        newKindLabel: "신상품",
        newKindRationale: `'${brand.city.replace(/구$/, "")} 헤어 봄 컬러' 키워드가 +18%. 시즌 컬러 룩북 발행이 신규 예약을 가장 빠르게 가져옵니다.`,
        seasonHeadline: "어버이날 — 어머니 시술 선물권",
      };
    case "local":
      return {
        newKindHeadline: "S/S 26 룩북 — 5월 신상",
        newKindLabel: "신상품",
        newKindRationale: `한남동 컨템포러리 패션 검색에서 신상 키워드 점유율이 가장 높아진 시기. 룩북 한 호흡 발행이 적기입니다.`,
        seasonHeadline: "어버이날 — 부모님 선물 컬렉션",
      };
    case "restaurant":
    default:
      return {
        newKindHeadline: "신메뉴 봄나물 코스 — 5월 한정",
        newKindLabel: "신메뉴",
        newKindRationale: `지난주 '${brand.city.replace(/구$/, "")} ${brand.industryLabel} 점심' 키워드로 들어온 손님이 +18%. 그중 절반 이상이 메뉴를 검색했습니다. 신메뉴 시즌 발행이 가장 효과적인 타이밍입니다.`,
        seasonHeadline: "어버이날 가족 예약 — 5/8",
      };
  }
}
