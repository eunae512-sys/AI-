// 검증용 — 공개 자료 기반의 실제 운영 가게 5곳
// 각 항목은 해당 가게의 공식 채널·언론·공개 메뉴판에서 확인 가능한 정보만 사용.
// "샘플 검증 모드" — 생성된 본문이 실제 가게에 맞는지 사용자가 직접 대조 검증하기 위함.
// ⚠ 실제 발행물이 아님 · 가게 공식 자료가 아님 · 사실 추정 금지 (가격/시간/메뉴 변경은 가게 공식 채널 확인 필수)

export type SampleRealBrand = {
  id: string;
  name: string;
  industry: "restaurant" | "cafe" | "dessert" | "stay" | "beauty" | "local";
  industryLabel: string;
  city: string;
  district: string;            // 동 단위까지 — 검색 노출 키워드와 매칭됨
  tagline: string;             // 공개된 가게 한 줄 소개·소개문 발췌
  signatureMenu: string[];     // 공개 메뉴판/언론 기사에 등장하는 대표 메뉴 (가격은 제외)
  publicSource: string;        // 정보 출처 (공식 인스타·홈페이지 등)
  // 사용자가 검증할 때 비교할 수 있도록 출처 노출
  suggestedTopic: string;      // 이 가게라면 작성해봄직한 블로그 주제
  suggestedKeywords: string[]; // 네이버 검색 시도해볼 키워드
  // 가게에 대한 기본 사실 (생성 본문이 이걸 지키는지 검증용)
  knownFacts: string[];
};

export const SAMPLE_REAL_BRANDS: SampleRealBrand[] = [
  {
    id: "terarosa-gangneung",
    name: "테라로사 강릉 본점",
    industry: "cafe",
    industryLabel: "스페셜티 커피 로스터리",
    city: "강원 강릉",
    district: "구정면",
    tagline: "산지에서 잔까지, 우리가 직접 본 원두만.",
    signatureMenu: ["스페셜티 핸드드립", "콜드브루", "원두 패키지"],
    publicSource: "terarosa.com · 공식 채널",
    suggestedTopic: "테라로사 강릉 본점 — 산지 직거래 원두 이야기",
    suggestedKeywords: ["강릉 카페", "테라로사 강릉", "스페셜티 커피"],
    knownFacts: [
      "강원도 강릉시 구정면에 본점 위치",
      "산지 직거래(direct trade) 원두 로스팅으로 알려짐",
      "원두 자체 로스팅 + 패키지 판매 병행",
    ],
  },
  {
    id: "gwanghwamun-mijin",
    name: "광화문 미진",
    industry: "restaurant",
    industryLabel: "메밀국수 노포",
    city: "서울 종로",
    district: "광화문",
    tagline: "1954년 그 자리, 그 메밀.",
    signatureMenu: ["메밀국수", "온메밀", "메밀전병"],
    publicSource: "공개 언론 기사 · 광화문 노포 가이드",
    suggestedTopic: "광화문 점심 — 70년 노포 메밀국수 한 그릇",
    suggestedKeywords: ["광화문 메밀국수", "광화문 점심", "노포 메밀"],
    knownFacts: [
      "1954년 창업 — 70년 노포",
      "서울 종로구 광화문 인근 위치",
      "메밀국수가 대표 메뉴 — 차가운 메밀, 온메밀 둘 다 제공",
    ],
  },
  {
    id: "nudake-dosan",
    name: "누데이크 도산",
    industry: "dessert",
    industryLabel: "컨템포러리 디저트",
    city: "서울 강남",
    district: "신사동 도산공원",
    tagline: "Fantasy who made you?",
    signatureMenu: ["피크-닉 크루아상(Peak)", "ToCo(투코) 타르트", "시즌 한정 케이크"],
    publicSource: "nudake.com · @nu_dake 공식 인스타그램",
    suggestedTopic: "도산공원 디저트 — 누데이크 피크 크루아상 시그니처",
    suggestedKeywords: ["도산공원 디저트", "누데이크", "신사동 디저트"],
    knownFacts: [
      "젠틀몬스터(Gentle Monster) 산하 디저트 브랜드",
      "서울 강남구 신사동 도산공원 인근 본점",
      "피크(Peak) 시리즈 크루아상이 시그니처 — 산 모양의 비주얼",
      "ToCo(투코) 타르트도 대표 메뉴 중 하나",
    ],
  },
  {
    id: "sogeumjip-deli",
    name: "소금집 델리",
    industry: "restaurant",
    industryLabel: "샌드위치·델리",
    city: "서울 / 제주",
    district: "성수·해방촌 외 다지점",
    tagline: "정직한 한 끼, 잠봉뵈르.",
    signatureMenu: ["잠봉뵈르 샌드위치", "햄·살라미 자가 가공", "샐러드"],
    publicSource: "@sogeumjip 공식 인스타그램 · 다지점 공개 정보",
    suggestedTopic: "성수 점심 — 소금집 잠봉뵈르 샌드위치",
    suggestedKeywords: ["성수 샌드위치", "소금집 델리", "잠봉뵈르"],
    knownFacts: [
      "서울 성수·해방촌, 제주 등 다지점 운영",
      "잠봉뵈르(Jambon-beurre) 샌드위치가 시그니처",
      "햄·살라미를 자체 가공해 사용",
    ],
  },
  {
    id: "rakkojae-bukchon",
    name: "락고재 한옥호텔",
    industry: "stay",
    industryLabel: "북촌 한옥스테이",
    city: "서울 종로",
    district: "가회동 북촌",
    tagline: "Old days, slow days — 130년 한옥에서의 하룻밤.",
    signatureMenu: ["사랑채·안채 객실", "조반 한 상", "한복 체험"],
    publicSource: "rkj.co.kr · 공식 홈페이지",
    suggestedTopic: "북촌 한옥스테이 — 락고재 조반과 마루의 아침",
    suggestedKeywords: ["북촌 한옥스테이", "락고재", "서울 전통 숙소"],
    knownFacts: [
      "서울 종로구 가회동 북촌 한옥마을 위치",
      "130년 이상 된 한옥을 리모델링한 한옥호텔",
      "사랑채/안채 등 전통 한옥 구조의 객실",
      "조반(아침 식사) 한 상 제공",
    ],
  },
];

export function getSampleRealBrand(id: string): SampleRealBrand | undefined {
  return SAMPLE_REAL_BRANDS.find((b) => b.id === id);
}
