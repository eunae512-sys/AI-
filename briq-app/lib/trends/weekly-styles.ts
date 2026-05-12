// 이번주 인기 릴스 스타일 — /reels 페이지 캐러셀용
// Pexels Videos 검색 — 매거진·에디토리얼 톤 우선 (viral/asmr/satisfying 같은 클릭베이트 단어 X)
// 키워드 전략:
//   - editorial / magazine / minimal / natural light / muted / moody → Pinterest 톤
//   - cinematic / slow / soft → 무드 영상
//   - 9:16 vertical (orientation=portrait 로 강제됨)

export type WeeklyStyle = {
  id: string;
  title: string;
  format: string;
  saveDelta: string;
  hooks: string[];
  pexelsQuery: string;
};

export const WEEKLY_REEL_STYLES_BY_INDUSTRY: Record<string, WeeklyStyle[]> = {
  restaurant: [
    { id: "first-bite",     title: "첫 한 입",         format: "디테일 · 4컷",   saveDelta: "+412%", hooks: ["한 입"],        pexelsQuery: "korean food close up natural light editorial minimal" },
    { id: "plating",        title: "플레이팅 30초",     format: "타임랩스 · 6컷", saveDelta: "+286%", hooks: ["플레이팅"],     pexelsQuery: "chef plating fine dining editorial magazine soft light" },
    { id: "ingredients",    title: "재료 손질",         format: "디테일 · 5컷",  saveDelta: "+218%", hooks: ["재료"],         pexelsQuery: "fresh ingredients knife wood cutting board editorial minimal" },
    { id: "course-reveal",  title: "풀코스 한 상",      format: "공간 무드 · 8컷", saveDelta: "+174%", hooks: ["코스"],         pexelsQuery: "korean banquet table flat lay editorial muted" },
    { id: "evening-mood",   title: "저녁 영업 시작",     format: "공간 · 5컷",    saveDelta: "+148%", hooks: ["저녁"],         pexelsQuery: "restaurant interior evening warm light cinematic editorial" },
    { id: "chef-hands",     title: "셰프의 손",         format: "디테일 · 4컷",  saveDelta: "+126%", hooks: ["손"],           pexelsQuery: "chef hands cooking macro soft light editorial" },
  ],
  cafe: [
    { id: "pour-over",      title: "푸어오버 3분",       format: "디테일 · 5컷",  saveDelta: "+342%", hooks: ["3분", "드립"],   pexelsQuery: "pour over coffee hands ceramic editorial minimal" },
    { id: "latte-art",      title: "라떼아트",          format: "디테일 · 4컷",  saveDelta: "+278%", hooks: ["라떼"],          pexelsQuery: "latte art milk pour minimal editorial natural light" },
    { id: "bean-detail",    title: "원두 디테일",        format: "디테일 · 4컷",  saveDelta: "+218%", hooks: ["원두"],          pexelsQuery: "coffee beans wood spoon macro editorial muted" },
    { id: "cold-brew",      title: "콜드브루",          format: "디테일 · 6컷",  saveDelta: "+184%", hooks: ["콜드브루"],      pexelsQuery: "cold brew coffee glass condensation editorial magazine" },
    { id: "morning-open",   title: "아침 오픈",         format: "공간 · 7컷",    saveDelta: "+162%", hooks: ["오픈"],          pexelsQuery: "specialty cafe morning interior warm light editorial minimal" },
    { id: "espresso",       title: "에스프레소",        format: "디테일 · 4컷",  saveDelta: "+138%", hooks: ["에스프레소"],    pexelsQuery: "espresso machine portafilter macro editorial muted" },
  ],
  dessert: [
    { id: "cake-cut",       title: "케이크 단면",        format: "디테일 · 4컷",  saveDelta: "+512%", hooks: ["단면"],          pexelsQuery: "cake slice cross section pastel editorial minimal" },
    { id: "fresh-fruit",    title: "신선 과일",         format: "디테일 · 5컷",  saveDelta: "+342%", hooks: ["과일"],          pexelsQuery: "fresh berries fruit flat lay pastel editorial natural light" },
    { id: "chocolate-pour", title: "초콜릿 드리즐",      format: "디테일 · 4컷",  saveDelta: "+286%", hooks: ["초콜릿"],        pexelsQuery: "chocolate ganache pour dessert editorial muted minimal" },
    { id: "macaron",        title: "마카롱 컬러",        format: "디테일 · 5컷",  saveDelta: "+218%", hooks: ["마카롱"],        pexelsQuery: "macaron pastel arrangement minimal editorial soft light" },
    { id: "patisserie",     title: "파티세리 무드",      format: "공간 · 5컷",    saveDelta: "+196%", hooks: ["파티세리"],      pexelsQuery: "boutique patisserie interior pastel minimal editorial magazine" },
    { id: "powder-finish",  title: "파우더 마감",       format: "디테일 · 4컷",  saveDelta: "+168%", hooks: ["파우더"],        pexelsQuery: "powdered sugar dust pastry macro editorial minimal" },
  ],
  stay: [
    { id: "morning-light",  title: "한옥 새벽 빛",      format: "공간 · 5컷",    saveDelta: "+388%", hooks: ["새벽"],         pexelsQuery: "hanok korean traditional window morning light minimal editorial" },
    { id: "courtyard",      title: "마당의 시간",        format: "공간 · 4컷",    saveDelta: "+286%", hooks: ["마당"],         pexelsQuery: "korean traditional courtyard spring editorial aesthetic minimal" },
    { id: "ondol-bed",      title: "온돌 이불",          format: "디테일 · 4컷",  saveDelta: "+224%", hooks: ["이불"],          pexelsQuery: "minimal bedroom linen morning light wabi sabi editorial" },
    { id: "korean-bf",      title: "조반 한 상",        format: "디테일 · 6컷",  saveDelta: "+196%", hooks: ["조반"],          pexelsQuery: "korean breakfast flat lay magazine editorial minimal" },
    { id: "tea-pour",       title: "차 한 잔",          format: "디테일 · 5컷",  saveDelta: "+168%", hooks: ["차"],            pexelsQuery: "tea pouring ceramic teapot minimal editorial soft light" },
    { id: "candle-night",   title: "촛불 밤",           format: "공간 · 5컷",    saveDelta: "+142%", hooks: ["밤"],            pexelsQuery: "candlelight cozy interior warm cinematic editorial muted" },
  ],
  beauty: [
    { id: "hair-flow",      title: "결의 흐름",          format: "디테일 · 4컷",  saveDelta: "+412%", hooks: ["결"],            pexelsQuery: "glossy hair texture soft light editorial minimal" },
    { id: "color-swatch",   title: "오늘의 컬러",       format: "디테일 · 5컷",  saveDelta: "+286%", hooks: ["컬러"],          pexelsQuery: "hair color palette swatch minimal editorial muted" },
    { id: "scalp-care",     title: "두피 케어",         format: "디테일 · 6컷",  saveDelta: "+218%", hooks: ["케어"],          pexelsQuery: "hair care close up soft light editorial minimal" },
    { id: "brush-detail",   title: "빗질 디테일",       format: "디테일 · 4컷",  saveDelta: "+196%", hooks: ["빗질"],          pexelsQuery: "hair brushing glossy editorial natural light magazine" },
    { id: "tools-flat-lay", title: "도구 플랫레이",     format: "디테일 · 4컷",  saveDelta: "+162%", hooks: ["도구"],          pexelsQuery: "beauty tools flat lay minimal editorial muted neutral" },
    { id: "salon-window",   title: "살롱 창가",         format: "공간 · 5컷",    saveDelta: "+138%", hooks: ["공간"],          pexelsQuery: "modern minimal hair salon interior editorial natural light" },
  ],
  local: [
    { id: "lookbook",       title: "스튜디오 룩북",      format: "에디토리얼 · 8컷", saveDelta: "+342%", hooks: ["룩북"],        pexelsQuery: "minimal fashion editorial neutral linen lookbook magazine" },
    { id: "fabric-detail",  title: "원단 디테일",       format: "디테일 · 5컷",  saveDelta: "+264%", hooks: ["원단"],          pexelsQuery: "linen wool fabric texture macro editorial neutral minimal" },
    { id: "styling",        title: "스타일링",          format: "디테일 · 4컷",  saveDelta: "+218%", hooks: ["스타일링"],      pexelsQuery: "fashion styling minimal editorial neutral natural light" },
    { id: "showroom",       title: "쇼룸 무드",         format: "공간 · 6컷",    saveDelta: "+186%", hooks: ["쇼룸"],          pexelsQuery: "minimal boutique fashion showroom interior gallery editorial" },
    { id: "portrait-pose",  title: "포트레이트",        format: "포트레이트 · 5컷", saveDelta: "+162%", hooks: ["포트레이트"],   pexelsQuery: "fashion portrait minimal natural light editorial neutral" },
    { id: "atelier-day",    title: "아틀리에 일상",      format: "공간 · 7컷",    saveDelta: "+138%", hooks: ["아틀리에"],      pexelsQuery: "fashion designer atelier studio neutral light editorial minimal" },
  ],
};
