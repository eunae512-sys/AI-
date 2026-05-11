// 브랜드별 상세 더미 — 콘텐츠 · 톤 · 스케줄 · 컬러
export type BrandDetail = {
  id: string;
  hero: { tagline: string; description: string };
  toneSummary: string;
  topHooks: string[];
  forbiddenWords: string[];
  preferredWords: string[];
  colorPalette: { hex: string; name: string }[];
  recentContents: { id: string; type: "reels" | "cardnews" | "blog"; title: string; metric: string; gradient: string }[];
  upcoming: { date: string; time: string; title: string; channel: string }[];
  reviews: { author: string; rating: number; body: string; type: "regular" | "new" | "difficult" }[];
};

export const BRAND_DETAILS: Record<string, BrandDetail> = {
  miokdang: {
    id: "miokdang",
    hero: {
      tagline: "한 그릇의 시간",
      description: "양평 시장 새벽 식재료로 한정식 9가지 코스를 단정한 톤으로 운영합니다.",
    },
    toneSummary:
      "단정한 존댓말로 한식의 정성과 새벽 시장의 발걸음을 담는 에디토리얼 톤. 직설적 칭찬보다 풍경·계절·재료의 시간을 짧게 끊어 보여준다.",
    topHooks: ["새벽 4시, 시장이 깨어납니다", "한 입에 봄이 옵니다", "한 그릇의 시간", "조용히 데워둔 한 그릇"],
    forbiddenWords: ["최고의", "단연 1위", "100%", "대박", "탁월한", "선사하는"],
    preferredWords: ["새벽 4시 시장", "한 입에 봄이", "단정한 정성", "한 그릇의 시간"],
    colorPalette: [
      { hex: "#7B2D26", name: "와인 레드" },
      { hex: "#E9DCC0", name: "크림 앰버" },
      { hex: "#2D1810", name: "에스프레소" },
      { hex: "#C2A876", name: "샌드" },
      { hex: "#F4E4C1", name: "한지" },
      { hex: "#3E2C20", name: "오크" },
    ],
    recentContents: [
      { id: "c1", type: "reels", title: "새벽 4시 시장", metric: "저장 8.1%", gradient: "from-amber-200 via-rose-300 to-amber-400" },
      { id: "c2", type: "cardnews", title: "5월 봄나물 코스 6장", metric: "저장 5.8%", gradient: "from-amber-100 via-amber-200 to-orange-300" },
      { id: "c3", type: "reels", title: "한 그릇의 시간", metric: "저장 5.4%", gradient: "from-stone-700 to-stone-900" },
      { id: "c4", type: "blog", title: "양평 시장 이야기", metric: "조회 4,820", gradient: "from-amber-200 to-rose-300" },
      { id: "c5", type: "cardnews", title: "여정식 메뉴 공개", metric: "저장 4.2%", gradient: "from-rose-200 to-orange-300" },
      { id: "c6", type: "reels", title: "정성 ASMR", metric: "저장 6.1%", gradient: "from-amber-300 to-stone-700" },
    ],
    upcoming: [
      { date: "5/11", time: "11:30", title: "장마 감성 릴스", channel: "인스타 릴스" },
      { date: "5/13", time: "11:00", title: "비 오는 날 한정식", channel: "인스타 + 블로그" },
      { date: "5/19", time: "19:00", title: "여정식 카드뉴스 6장", channel: "인스타 캐러셀" },
      { date: "5/29", time: "12:00", title: "5월 마무리 V-log", channel: "릴스 + Threads" },
    ],
    reviews: [
      { author: "김**", rating: 5, body: "봄정식 또 먹고 갑니다. 두릅무침 진심 최고예요.", type: "regular" },
      { author: "박**", rating: 5, body: "외국인 친구 데려갔는데 모두 만족했어요.", type: "new" },
      { author: "정**", rating: 2, body: "가격이 너무 비싸요.", type: "difficult" },
    ],
  },
  "roastery-1985": {
    id: "roastery-1985",
    hero: {
      tagline: "1985 since",
      description: "서촌 골목 스페셜티 카페. 매주 새 원두 · 핸드드립 14종 · 콜드브루 시즌.",
    },
    toneSummary:
      "바리스타 1인칭으로 원두 산지·로스팅 시간을 친근하게 풀어 설명. 단어는 짧고 사진은 길게.",
    topHooks: ["오늘 새 원두", "콜드브루 시즌 시작", "바리스타가 직접", "한 잔에 6시간"],
    forbiddenWords: ["대박", "갓성비", "미친", "단연 1위"],
    preferredWords: ["원두", "바리스타", "핸드드립", "한 잔에"],
    colorPalette: [
      { hex: "#3B2A20", name: "에스프레소" },
      { hex: "#D4B895", name: "웜 탄" },
      { hex: "#8B6F4E", name: "캐러멜" },
      { hex: "#F5E6D3", name: "라떼" },
      { hex: "#1A0F08", name: "다크 로스팅" },
      { hex: "#C9A875", name: "크레마" },
    ],
    recentContents: [
      { id: "c1", type: "reels", title: "오늘 새 원두 도착", metric: "저장 6.2%", gradient: "from-amber-700 to-stone-800" },
      { id: "c2", type: "cardnews", title: "콜드브루 6시간 추출", metric: "저장 4.8%", gradient: "from-amber-100 to-amber-300" },
      { id: "c3", type: "reels", title: "바리스타의 하루", metric: "저장 5.1%", gradient: "from-stone-600 to-amber-900" },
      { id: "c4", type: "blog", title: "에티오피아 예가체프 노트", metric: "조회 2,140", gradient: "from-amber-200 to-stone-400" },
      { id: "c5", type: "cardnews", title: "5월 신메뉴 라떼", metric: "저장 3.9%", gradient: "from-amber-50 to-amber-200" },
      { id: "c6", type: "reels", title: "핸드드립 ASMR", metric: "저장 7.1%", gradient: "from-stone-800 to-amber-700" },
    ],
    upcoming: [
      { date: "5/12", time: "08:30", title: "콜드브루 신메뉴 카드뉴스", channel: "인스타 + 블로그" },
      { date: "5/15", time: "09:00", title: "스승의날 핸드드립 세트", channel: "카카오 채널" },
      { date: "5/22", time: "10:00", title: "원두 산지 V-log 릴스", channel: "릴스" },
    ],
    reviews: [
      { author: "이**", rating: 5, body: "예가체프 진짜 향이 미쳤어요. 단골 갑니다.", type: "regular" },
      { author: "김**", rating: 5, body: "분위기도 좋고 사장님 친절해요.", type: "new" },
      { author: "박**", rating: 4, body: "주말엔 좀 시끄러워서 아쉬워요.", type: "regular" },
    ],
  },
  "seochon-stay": {
    id: "seochon-stay",
    hero: {
      tagline: "서촌 한옥에서 하룻밤",
      description: "북촌 근처 한옥 4채. 사장님 직접 운영하는 1박 한옥스테이.",
    },
    toneSummary:
      "한옥의 시간을 묘사하는 차분한 톤. 객실보다 마당·창호·소반의 디테일을 짧게 보여준다.",
    topHooks: ["창호로 드는 새벽 빛", "마당의 시간", "한옥에서 하룻밤", "조용한 5월의 밤"],
    forbiddenWords: ["럭셔리한", "프리미엄", "특급", "최고급"],
    preferredWords: ["창호", "마당", "소반", "한옥의 시간"],
    colorPalette: [
      { hex: "#4A3528", name: "오크" },
      { hex: "#F5EBD6", name: "한지" },
      { hex: "#7C5C42", name: "원목" },
      { hex: "#C4A985", name: "기와" },
      { hex: "#2A1F18", name: "먹" },
      { hex: "#E8D9C0", name: "삼베" },
    ],
    recentContents: [
      { id: "c1", type: "reels", title: "한옥 새벽 빛", metric: "저장 6.4%", gradient: "from-amber-100 via-stone-200 to-amber-300" },
      { id: "c2", type: "cardnews", title: "객실 4채 비교", metric: "저장 5.2%", gradient: "from-amber-200 to-stone-500" },
      { id: "c3", type: "reels", title: "마당의 비 소리", metric: "저장 7.8%", gradient: "from-stone-400 to-amber-300" },
      { id: "c4", type: "blog", title: "북촌 5월 산책 코스", metric: "조회 3,210", gradient: "from-amber-50 to-amber-200" },
      { id: "c5", type: "reels", title: "조반 한 상", metric: "저장 5.9%", gradient: "from-amber-100 to-orange-200" },
      { id: "c6", type: "cardnews", title: "한복 대여 안내", metric: "저장 4.1%", gradient: "from-rose-100 to-amber-200" },
    ],
    upcoming: [
      { date: "5/13", time: "10:00", title: "장마 감성 V-log", channel: "릴스 + 블로그" },
      { date: "5/14", time: "11:30", title: "효도 스테이 카드뉴스", channel: "인스타 + 카카오" },
      { date: "5/25", time: "16:00", title: "부처님오신날 패키지", channel: "전 채널" },
    ],
    reviews: [
      { author: "Sarah", rating: 5, body: "Beautiful hanok, the host was very kind. Loved the morning light.", type: "new" },
      { author: "윤**", rating: 5, body: "부모님 모시고 갔는데 너무 좋아하셨어요.", type: "regular" },
      { author: "장**", rating: 4, body: "주차가 조금 불편해요.", type: "new" },
    ],
  },
  "dolce-dessert": {
    id: "dolce-dessert",
    hero: {
      tagline: "달콤한 한 입",
      description: "성수동 케이크 · 마카롱 · 시즌 한정 디저트샵.",
    },
    toneSummary:
      "친근한 반말로 디저트의 색감과 단맛을 발랄하게. 이모지 1개 까지 허용.",
    topHooks: ["오늘 새로 구운", "녹는 단 한 입", "5월 한정", "달콤 멈춤 주의"],
    forbiddenWords: ["프리미엄", "고급", "단연 1위"],
    preferredWords: ["달콤", "한 입", "녹는", "오늘 새로"],
    colorPalette: [
      { hex: "#E8A8B6", name: "체리 핑크" },
      { hex: "#FFF5F0", name: "크림" },
      { hex: "#D4736B", name: "딸기" },
      { hex: "#F4D4A8", name: "버터" },
      { hex: "#A8528C", name: "라즈베리" },
      { hex: "#FFE8E8", name: "마시멜로" },
    ],
    recentContents: [
      { id: "c1", type: "reels", title: "수박 케이크 ASMR", metric: "저장 9.2%", gradient: "from-pink-200 via-rose-300 to-amber-200" },
      { id: "c2", type: "cardnews", title: "5월 한정 마카롱", metric: "저장 6.4%", gradient: "from-rose-200 to-pink-300" },
      { id: "c3", type: "reels", title: "딸기 단면컷", metric: "저장 8.7%", gradient: "from-rose-300 to-orange-300" },
      { id: "c4", type: "blog", title: "디저트 트렌드 2026", metric: "조회 5,840", gradient: "from-pink-100 to-rose-200" },
      { id: "c5", type: "reels", title: "오븐에서 갓 나온", metric: "저장 7.1%", gradient: "from-amber-200 to-rose-300" },
      { id: "c6", type: "cardnews", title: "팀 인터뷰 V-log", metric: "저장 5.3%", gradient: "from-pink-100 to-amber-100" },
    ],
    upcoming: [
      { date: "5/13", time: "11:30", title: "장마 한정 푸딩", channel: "인스타 릴스" },
      { date: "5/18", time: "14:00", title: "성년의 날 선물 박스", channel: "인스타 + 카카오" },
      { date: "5/30", time: "10:00", title: "여름 빙수 출시", channel: "전 채널" },
    ],
    reviews: [
      { author: "정**", rating: 5, body: "수박 케이크 진짜 단면 미쳤어요!! 인스타 보고 왔는데 사진보다 더 예뻐요.", type: "new" },
      { author: "유**", rating: 5, body: "딸이 너무 좋아해요. 매주 단골 가요.", type: "regular" },
      { author: "오**", rating: 4, body: "주말엔 줄이 너무 길어요 ㅠㅠ", type: "regular" },
    ],
  },
  "luna-hair": {
    id: "luna-hair",
    hero: {
      tagline: "결이 살아요",
      description: "강남 헤어살롱. ASMR 시술 컷 + 5월 봄 컬러 시즌.",
    },
    toneSummary:
      "감각적 친근함. 시술 디테일을 짧은 문장으로. 손님 이름으로 단골 호명.",
    topHooks: ["결이 살아요", "5월 봄 컬러", "시술 ASMR", "오늘의 컬러"],
    forbiddenWords: ["최고급", "단연 1위", "완벽한"],
    preferredWords: ["결", "광택", "5초", "오늘의"],
    colorPalette: [
      { hex: "#1B1B1F", name: "잉크 블랙" },
      { hex: "#D9B6A1", name: "더스티 로즈" },
      { hex: "#5A4A42", name: "토프" },
      { hex: "#E8D5C4", name: "샴페인" },
      { hex: "#2D1F1A", name: "다크 모카" },
      { hex: "#C9A893", name: "라떼 베이지" },
    ],
    recentContents: [
      { id: "c1", type: "reels", title: "결이 살아요 ASMR", metric: "저장 6.4%", gradient: "from-zinc-700 via-zinc-900 to-stone-800" },
      { id: "c2", type: "cardnews", title: "5월 봄 컬러 추천 6", metric: "저장 5.8%", gradient: "from-rose-200 to-zinc-300" },
      { id: "c3", type: "reels", title: "오늘의 컬러", metric: "저장 4.9%", gradient: "from-stone-500 to-zinc-700" },
      { id: "c4", type: "blog", title: "장마철 헤어 관리", metric: "조회 3,820", gradient: "from-stone-300 to-zinc-500" },
      { id: "c5", type: "cardnews", title: "수국축제 컬러 매칭", metric: "저장 7.2%", gradient: "from-fuchsia-200 to-violet-300" },
      { id: "c6", type: "reels", title: "고객 변신 V-log", metric: "저장 5.5%", gradient: "from-zinc-600 to-stone-800" },
    ],
    upcoming: [
      { date: "5/11", time: "19:45", title: "결 살아요 카드뉴스", channel: "인스타 캐러셀" },
      { date: "5/22", time: "11:00", title: "ASMR 시술 릴스", channel: "인스타 릴스" },
      { date: "5/26", time: "14:00", title: "수국 컬러 매칭", channel: "전 채널" },
    ],
    reviews: [
      { author: "이**", rating: 5, body: "머리결 진짜 부드러워졌어요. 컬도 잘 잡히고.", type: "regular" },
      { author: "박**", rating: 4, body: "예약 시간보다 20분 늦게 시작해서 별 4개.", type: "new" },
      { author: "최**", rating: 5, body: "단골 됐어요. 항상 만족.", type: "regular" },
    ],
  },
  "forum-fashion": {
    id: "forum-fashion",
    hero: {
      tagline: "FORUM. S/S 26",
      description: "한남동 컨템포러리 패션. 룩북·웰메이드·미니멀.",
    },
    toneSummary:
      "에디토리얼 톤. 짧고 단정한 영문+한글 혼용. 색·소재·실루엣을 한 단어로 압축.",
    topHooks: ["S/S 26 LOOKBOOK", "ONE FABRIC, TWO WAYS", "오프 화이트", "한 벌의 무게"],
    forbiddenWords: ["럭셔리", "프리미엄", "단연 1위", "고급스러운"],
    preferredWords: ["lookbook", "fabric", "silhouette", "한 벌"],
    colorPalette: [
      { hex: "#111111", name: "딥 차콜" },
      { hex: "#E5E1DB", name: "웜 본" },
      { hex: "#5A5048", name: "올리브 그레이" },
      { hex: "#C4B8A8", name: "오트밀" },
      { hex: "#1F1A15", name: "잉크" },
      { hex: "#A89888", name: "샌드 베이지" },
    ],
    recentContents: [
      { id: "c1", type: "cardnews", title: "S/S 26 룩북 12장", metric: "저장 5.4%", gradient: "from-slate-700 to-zinc-900" },
      { id: "c2", type: "reels", title: "ONE FABRIC, TWO WAYS", metric: "저장 6.8%", gradient: "from-stone-500 to-zinc-800" },
      { id: "c3", type: "cardnews", title: "디자이너 인터뷰", metric: "저장 4.2%", gradient: "from-zinc-300 to-stone-600" },
      { id: "c4", type: "blog", title: "5월 매거진 픽", metric: "조회 2,840", gradient: "from-stone-200 to-zinc-400" },
      { id: "c5", type: "reels", title: "쇼룸 데일리", metric: "저장 3.9%", gradient: "from-zinc-700 to-stone-900" },
      { id: "c6", type: "cardnews", title: "스타일링 5가지", metric: "저장 4.6%", gradient: "from-stone-300 to-zinc-600" },
    ],
    upcoming: [
      { date: "5/12", time: "19:00", title: "5월 룩북 카드뉴스 12장", channel: "인스타 + Threads" },
      { date: "5/16", time: "16:00", title: "팝업 안내", channel: "전 채널" },
      { date: "5/30", time: "10:00", title: "여름 라인 티저 릴스", channel: "인스타 릴스" },
    ],
    reviews: [
      { author: "신**", rating: 5, body: "원단도 좋고 핏도 깔끔해요. 단골 갑니다.", type: "regular" },
      { author: "조**", rating: 4, body: "사이즈 한 단계 큰게 더 잘 맞는 것 같아요.", type: "new" },
      { author: "안**", rating: 5, body: "스타일링 추천 받고 샀는데 다 잘 어울려요.", type: "regular" },
    ],
  },
};

export const getBrandDetail = (id: string) => BRAND_DETAILS[id];
