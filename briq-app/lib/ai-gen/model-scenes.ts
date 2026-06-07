// 소상공인 출연자 대체 — AI 모델/인물 씬 라이브러리
// 사장님이 직접 출연하기 어려운 상황을 대신, 자연스러운 출연자 씬을 자동 생성

export type Industry = "restaurant" | "cafe" | "dessert" | "stay" | "beauty" | "local";

export type SceneRole = "owner" | "staff" | "customer" | "product";
// owner    — 사장님 본인 대체 (정면 포함 가능)
// staff    — 직원/요리사/바리스타 (작업 중, 손 위주)
// customer — 손님 (즐기는 모습, 익명 친화적)
// product  — 사람 없음, 제품/공간만

export type ModelGender = "female" | "male" | "any";
export type ModelAge = "20s" | "30s" | "40s" | "50s" | "any";
export type FrameStyle = "portrait" | "lifestyle" | "overhead" | "closeup";
// portrait — 정면 인물
// lifestyle — 자연스러운 일상
// overhead — 위에서 본 컷
// closeup — 손/얼굴 일부 클로즈업

export type ModelScene = {
  id: string;
  industry: Industry;
  role: SceneRole;
  title: string;        // UI 라벨 (예: "라떼아트 만드는 바리스타")
  desc: string;         // 한 줄 설명
  frame: FrameStyle;
  defaultGender?: ModelGender;
  defaultAge?: ModelAge;
  // 영문 프롬프트 — gpt-image-1에 직접 전달
  promptEN: (opts: { gender?: ModelGender; age?: ModelAge; signatureMenu?: string }) => string;
};

const ageDescriptor = (age?: ModelAge): string => {
  switch (age) {
    case "20s": return "in their mid-20s";
    case "30s": return "in their early 30s";
    case "40s": return "in their early 40s";
    case "50s": return "in their late 40s to early 50s";
    default: return "of natural adult age";
  }
};

const genderDescriptor = (gender?: ModelGender): string => {
  switch (gender) {
    case "female": return "a Korean woman with East Asian features";
    case "male": return "a Korean man with East Asian features";
    default: return "a Korean person with East Asian features";
  }
};

// 공통 후미 — 출연자 익명성, 광고법 준수, 자연스러움
const COMMON_TAIL =
  "Natural editorial photography, soft window light, shallow depth of field, " +
  "subject face partially obscured or three-quarter angle for privacy, " +
  "muted earth tones, warm color grading, 9:16 vertical composition with negative space at top for overlay text. " +
  "Authentic, unstaged feel — not stock photo. " +
  "CRITICAL: no Korean text, no signage, no logos, no captions, no brand marks in the image.";

export const MODEL_SCENES: ModelScene[] = [
  // ─────────── 음식점 ───────────
  {
    id: "rest-chef-plating",
    industry: "restaurant",
    role: "staff",
    title: "요리사 플레이팅",
    desc: "정성스럽게 마지막 가니쉬를 올리는 손",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "30s",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a chef's hands carefully placing a final garnish on ${signatureMenu ? `a beautifully plated dish of ${signatureMenu}` : "a beautifully plated Korean dish"}, ` +
      `wooden counter, steam rising gently, ` + COMMON_TAIL,
  },
  {
    id: "rest-owner-greeting",
    industry: "restaurant",
    role: "owner",
    title: "사장님 인사",
    desc: "가게 입구에서 환영하는 자세",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "40s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} as a warm restaurant owner, ` +
      `standing at the entrance of a traditional Korean restaurant interior, ` +
      `wearing a simple apron, gentle smile, three-quarter angle to camera, ` + COMMON_TAIL,
  },
  {
    id: "rest-customer-eating",
    industry: "restaurant",
    role: "customer",
    title: "손님 식사",
    desc: "맛있게 한 입 먹는 순간",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age, signatureMenu }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customer enjoying ${signatureMenu ?? "a Korean dish"} at a cozy restaurant table, ` +
      `face partially turned away, focus on the food and hands, ` +
      `chopsticks lifting a bite, soft window light, ` + COMMON_TAIL,
  },
  {
    id: "rest-overhead-table",
    industry: "restaurant",
    role: "product",
    title: "테이블 위에서",
    desc: "한상차림 위에서 본 컷 (인물 없음)",
    frame: "overhead",
    promptEN: ({ signatureMenu }) =>
      `Overhead flat-lay of a Korean restaurant table with ${signatureMenu ?? "various side dishes and a main course"}, ` +
      `wooden table surface, two pairs of chopsticks resting at the edge suggesting people just out of frame, ` +
      `warm afternoon light, ` + COMMON_TAIL,
  },

  // ─────────── 카페 ───────────
  {
    id: "cafe-barista-latte",
    industry: "cafe",
    role: "staff",
    title: "라떼아트 만드는 바리스타",
    desc: "스팀밀크 따르는 손",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: () =>
      `Close-up of a barista's hands pouring steamed milk into espresso, creating delicate latte art in a ceramic cup, ` +
      `wooden cafe counter, soft morning light through window, ` + COMMON_TAIL,
  },
  {
    id: "cafe-owner-counter",
    industry: "cafe",
    role: "owner",
    title: "카페 사장님",
    desc: "카운터 뒤에서 환영하는 모습",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} cafe owner behind a warm wooden counter, ` +
      `holding a freshly made specialty coffee, gentle smile, three-quarter angle, ` +
      `dried flowers and ceramics in soft background, ` + COMMON_TAIL,
  },
  {
    id: "cafe-customer-reading",
    industry: "cafe",
    role: "customer",
    title: "손님 — 책 읽는 오후",
    desc: "창가에서 커피 한 모금",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customer sitting by a sunlit cafe window, ` +
      `holding a coffee cup with both hands, an open book on the table, face mostly turned toward the window, ` +
      `peaceful afternoon mood, ` + COMMON_TAIL,
  },
  {
    id: "cafe-overhead-drink",
    industry: "cafe",
    role: "product",
    title: "테이블 위 — 음료만",
    desc: "라떼와 디저트 (인물 없음)",
    frame: "overhead",
    promptEN: ({ signatureMenu }) =>
      `Overhead flat-lay of ${signatureMenu ?? "a specialty latte and a small dessert"} on a marble cafe table, ` +
      `one hand just entering frame from the side reaching for the cup, ` +
      `dried flowers, linen napkin, ` + COMMON_TAIL,
  },

  // ─────────── 디저트 ───────────
  {
    id: "dessert-piping",
    industry: "dessert",
    role: "staff",
    title: "디저트 만드는 손",
    desc: "크림 짜는 순간 클로즈업",
    frame: "closeup",
    promptEN: () =>
      `Close-up of pastry chef's hands piping cream onto a delicate dessert, marble surface, ` +
      `fresh berries scattered nearby, soft daylight, ` + COMMON_TAIL,
  },
  {
    id: "dessert-owner-tray",
    industry: "dessert",
    role: "owner",
    title: "사장님 — 디저트 들고",
    desc: "갓 만든 트레이 들고 미소",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ gender, age, signatureMenu }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} dessert shop owner holding a wooden tray of freshly made ${signatureMenu ?? "pastries"}, ` +
      `warm pastel shop interior, apron, soft smile, three-quarter angle, ` + COMMON_TAIL,
  },
  {
    id: "dessert-customer-bite",
    industry: "dessert",
    role: "customer",
    title: "손님 — 한 입 베어 무는 순간",
    desc: "디저트와 표정",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age, signatureMenu }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customer about to bite into ${signatureMenu ?? "a beautifully plated dessert"}, ` +
      `eyes closed in anticipation, face partially obscured, soft cafe lighting, ` + COMMON_TAIL,
  },
  {
    id: "dessert-overhead-plate",
    industry: "dessert",
    role: "product",
    title: "디저트 플랫레이",
    desc: "위에서 본 컷 (인물 없음)",
    frame: "overhead",
    promptEN: ({ signatureMenu }) =>
      `Overhead flat-lay of ${signatureMenu ?? "an artisan dessert"} on a ceramic plate, fork resting beside, ` +
      `linen napkin, dried flowers, marble surface, ` + COMMON_TAIL,
  },

  // ─────────── 숙박/스테이 ───────────
  {
    id: "stay-host-welcome",
    industry: "stay",
    role: "owner",
    title: "호스트 환영",
    desc: "한옥 마루 앞에서 인사",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "40s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} stay host standing on a wooden veranda of a traditional Korean hanok, ` +
      `gentle welcoming gesture, soft linen clothing, three-quarter angle, ` +
      `warm late afternoon light, ` + COMMON_TAIL,
  },
  {
    id: "stay-staff-prep",
    industry: "stay",
    role: "staff",
    title: "객실 준비 손길",
    desc: "이불 정리, 차 준비",
    frame: "closeup",
    promptEN: () =>
      `Close-up of hands smoothing a clean white linen on a traditional Korean floor mattress, ` +
      `dried flowers and a small tea tray nearby, soft morning light, ` + COMMON_TAIL,
  },
  {
    id: "stay-guest-tea",
    industry: "stay",
    role: "customer",
    title: "손님 — 마루에서 차 한잔",
    desc: "한옥 마루에서의 평화로운 순간",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} guest sitting on a traditional Korean hanok wooden veranda, ` +
      `holding a small tea cup, looking out at a serene garden, face mostly in profile, ` +
      `linen clothing, soft morning light, ` + COMMON_TAIL,
  },
  {
    id: "stay-room-empty",
    industry: "stay",
    role: "product",
    title: "객실 내부 — 인물 없음",
    desc: "햇살 드는 마루방",
    frame: "lifestyle",
    promptEN: () =>
      `Empty traditional Korean hanok interior, sunlight streaming through wooden lattice door, ` +
      `clean futon, low wooden table with a tea set, dried persimmons hanging in the background, ` + COMMON_TAIL,
  },

  // ─────────── 미용/뷰티 ───────────
  {
    id: "beauty-stylist-work",
    industry: "beauty",
    role: "staff",
    title: "디자이너 시술 중",
    desc: "고객 머리 손질하는 손",
    frame: "closeup",
    promptEN: () =>
      `Close-up of a hair stylist's hands working with shears on a client's hair, ` +
      `soft salon lighting, focus on the precise hand motion, mirrors blurred in background, ` + COMMON_TAIL,
  },
  {
    id: "beauty-owner-portrait",
    industry: "beauty",
    role: "owner",
    title: "원장님 — 살롱 앞에서",
    desc: "환영 자세, 시술복 차림",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} hair salon director standing in a minimalist beauty salon, ` +
      `wearing a clean black professional apron, holding scissors gently, soft smile, three-quarter angle, ` +
      `warm light, ` + COMMON_TAIL,
  },
  {
    id: "beauty-customer-mirror",
    industry: "beauty",
    role: "customer",
    title: "손님 — 거울 앞 만족",
    desc: "시술 직후 표정",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} salon customer looking at their freshly styled hair in a mirror, ` +
      `gentle satisfied smile, face slightly turned, soft salon lighting, ` + COMMON_TAIL,
  },
  {
    id: "beauty-station-tools",
    industry: "beauty",
    role: "product",
    title: "시술 도구 정돈",
    desc: "도구만, 인물 없음",
    frame: "overhead",
    promptEN: () =>
      `Overhead flat-lay of professional hair styling tools — wooden brush, scissors, comb — ` +
      `arranged neatly on a clean marble salon counter, soft daylight, ` + COMMON_TAIL,
  },

  // ─────────── 로컬/패션/잡화 ───────────
  {
    id: "local-owner-store",
    industry: "local",
    role: "owner",
    title: "사장님 — 매장 안",
    desc: "옷걸이 사이에서 정리 중",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} boutique owner adjusting clothes on a wooden rack in a contemporary Korean fashion store, ` +
      `linen apron, three-quarter angle, gentle expression, ` + COMMON_TAIL,
  },
  {
    id: "local-customer-fitting",
    industry: "local",
    role: "customer",
    title: "손님 — 매장 둘러보기",
    desc: "옷 살펴보는 자연스러운 순간",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customer gently touching the fabric of a hanging garment in a quiet Korean boutique, ` +
      `face mostly in profile, warm afternoon light, ` + COMMON_TAIL,
  },
  {
    id: "local-product-flatlay",
    industry: "local",
    role: "product",
    title: "제품 플랫레이",
    desc: "제품만 (인물 없음)",
    frame: "overhead",
    promptEN: () =>
      `Overhead flat-lay of a folded linen garment, a small leather accessory, and dried flowers, ` +
      `on a soft neutral surface, warm window light, ` + COMMON_TAIL,
  },

  // ─────────── 음식점 (변형) ───────────
  {
    id: "rest-owner-cooking",
    industry: "restaurant",
    role: "owner",
    title: "사장님 — 불 앞에서",
    desc: "웍을 흔드는 진지한 표정",
    frame: "lifestyle",
    defaultGender: "male",
    defaultAge: "40s",
    promptEN: ({ gender, age, signatureMenu }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} restaurant owner working at a hot stove, tossing ingredients in a wok with rising flame, ` +
      `${signatureMenu ? `preparing ${signatureMenu}, ` : ""}focused expression, three-quarter angle, steam and warm kitchen light, ` + COMMON_TAIL,
  },
  {
    id: "rest-staff-serving",
    industry: "restaurant",
    role: "staff",
    title: "직원 — 음식 서빙",
    desc: "접시를 테이블로 옮기는 손",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a server's hands lowering a hot plate of ${signatureMenu ?? "a Korean main dish"} onto a wooden table, ` +
      `gentle steam, other dishes softly blurred around, warm dinner light, ` + COMMON_TAIL,
  },
  {
    id: "rest-customer-cheers",
    industry: "restaurant",
    role: "customer",
    title: "손님 — 건배하는 순간",
    desc: "잔 부딪히는 손과 분위기",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customers raising glasses for a toast at a lively Korean restaurant table, ` +
      `focus on the clinking glasses and hands, faces softly out of focus, warm evening ambience, ` + COMMON_TAIL,
  },
  {
    id: "rest-product-closeup",
    industry: "restaurant",
    role: "product",
    title: "대표 메뉴 클로즈업",
    desc: "김 오르는 한 그릇 (인물 없음)",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up of ${signatureMenu ?? "a signature Korean dish"} freshly served in a ceramic bowl, gentle steam rising, ` +
      `rich texture and glistening surface, dark wooden table, dramatic warm side light, no people, ` + COMMON_TAIL,
  },

  // ─────────── 카페 (변형) ───────────
  {
    id: "cafe-owner-roasting",
    industry: "cafe",
    role: "owner",
    title: "사장님 — 원두 고르는 손",
    desc: "로스팅 원두를 살피는 모습",
    frame: "closeup",
    defaultGender: "male",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} cafe owner cupping freshly roasted coffee beans in both hands, inspecting them closely, ` +
      `warm roastery light, burlap sack softly blurred behind, ` + COMMON_TAIL,
  },
  {
    id: "cafe-staff-handoff",
    industry: "cafe",
    role: "staff",
    title: "바리스타 — 음료 건네는 손",
    desc: "완성 음료를 내미는 순간",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a barista's hand offering a finished ${signatureMenu ?? "specialty drink"} across a wooden counter to a customer just out of frame, ` +
      `soft morning light, condensation on the cup, ` + COMMON_TAIL,
  },
  {
    id: "cafe-customer-laptop",
    industry: "cafe",
    role: "customer",
    title: "손님 — 작업하는 오후",
    desc: "노트북과 커피 한 잔",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} customer working on a laptop at a quiet cafe table, a coffee cup beside, ` +
      `face mostly in profile lit by window, calm focused mood, warm wood tones, ` + COMMON_TAIL,
  },
  {
    id: "cafe-product-pour",
    industry: "cafe",
    role: "product",
    title: "음료 클로즈업 — 따르는 순간",
    desc: "잔에 부어지는 음료 (인물 없음)",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up of ${signatureMenu ?? "iced specialty coffee"} being poured into a glass with ice, splash and texture frozen in motion, ` +
      `marble surface, bright clean side light, no people, ` + COMMON_TAIL,
  },

  // ─────────── 디저트 (변형) ───────────
  {
    id: "dessert-staff-decorate",
    industry: "dessert",
    role: "staff",
    title: "데코레이션 손길",
    desc: "베리·금박 올리는 순간",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up of pastry chef's hands arranging fresh berries and edible flowers on top of ${signatureMenu ?? "a delicate cake"}, ` +
      `tweezers in hand, marble surface, soft daylight, ` + COMMON_TAIL,
  },
  {
    id: "dessert-owner-counter",
    industry: "dessert",
    role: "owner",
    title: "사장님 — 쇼케이스 앞",
    desc: "디저트 진열장 정리하는 모습",
    frame: "portrait",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} dessert shop owner standing beside a glass pastry showcase, gently arranging a plate, ` +
      `warm pastel interior, apron, soft smile, three-quarter angle, ` + COMMON_TAIL,
  },
  {
    id: "dessert-customer-share",
    industry: "dessert",
    role: "customer",
    title: "손님 — 함께 나누는 순간",
    desc: "두 손이 같은 접시로",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age, signatureMenu }) =>
      `Two ${genderDescriptor(gender).replace("a ", "")} ${ageDescriptor(age)} friends sharing ${signatureMenu ?? "a dessert"} with two forks reaching toward the same plate, ` +
      `hands and dessert in focus, faces softly out of frame, cozy cafe light, ` + COMMON_TAIL,
  },
  {
    id: "dessert-product-stack",
    industry: "dessert",
    role: "product",
    title: "디저트 클로즈업 — 단면",
    desc: "레이어가 보이는 한 컷 (인물 없음)",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up cross-section of ${signatureMenu ?? "a layered cake slice"} on a ceramic plate, showing rich layers and texture, ` +
      `fresh fruit beside, soft natural light, marble surface, no people, ` + COMMON_TAIL,
  },

  // ─────────── 숙박/스테이 (변형) ───────────
  {
    id: "stay-host-checkin",
    industry: "stay",
    role: "owner",
    title: "호스트 — 열쇠 건네는 손",
    desc: "체크인 환영 순간",
    frame: "closeup",
    defaultGender: "female",
    defaultAge: "40s",
    promptEN: () =>
      `Close-up of a stay host's hands offering a traditional brass key on a wooden tray to a guest, ` +
      `hanok entrance softly blurred behind, warm afternoon light, ` + COMMON_TAIL,
  },
  {
    id: "stay-staff-tea",
    industry: "stay",
    role: "staff",
    title: "차 내어주는 손",
    desc: "찻잔과 다과 준비",
    frame: "closeup",
    promptEN: () =>
      `Close-up of hands placing a traditional Korean tea cup and small sweets on a low wooden tray, ` +
      `hanok floor, dried flowers nearby, soft morning light, ` + COMMON_TAIL,
  },
  {
    id: "stay-guest-window",
    industry: "stay",
    role: "customer",
    title: "손님 — 창밖 바라보며",
    desc: "한지창 앞 평화로운 순간",
    frame: "lifestyle",
    defaultGender: "any",
    defaultAge: "30s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} guest sitting cross-legged by a traditional Korean paper window, gazing outside, ` +
      `a tea cup beside, linen clothing, face in soft profile, serene morning light, ` + COMMON_TAIL,
  },
  {
    id: "stay-product-detail",
    industry: "stay",
    role: "product",
    title: "공간 디테일 — 다탁",
    desc: "찻상과 햇살 (인물 없음)",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a low wooden tea table with ${signatureMenu ? `${signatureMenu} and ` : ""}a ceramic tea set and a single dried flower, ` +
      `sunlight casting soft lattice shadows across a hanok floor, no people, ` + COMMON_TAIL,
  },

  // ─────────── 미용/뷰티 (변형) ───────────
  {
    id: "beauty-staff-color",
    industry: "beauty",
    role: "staff",
    title: "컬러 바르는 손",
    desc: "염색 브러시 작업 클로즈업",
    frame: "closeup",
    promptEN: () =>
      `Close-up of a hair colorist's gloved hands applying color with a brush to sectioned hair, ` +
      `foils softly blurred, clean salon light, focus on precise motion, ` + COMMON_TAIL,
  },
  {
    id: "beauty-staff-blowdry",
    industry: "beauty",
    role: "staff",
    title: "드라이 마무리",
    desc: "브러시와 드라이어로 마무리",
    frame: "closeup",
    promptEN: () =>
      `Close-up of a stylist's hands finishing a blow-dry with a round brush and hair dryer, ` +
      `soft flowing hair, warm salon light, mirrors blurred behind, ` + COMMON_TAIL,
  },
  {
    id: "beauty-owner-consult",
    industry: "beauty",
    role: "owner",
    title: "원장님 — 상담 중",
    desc: "거울 앞 스타일 상담",
    frame: "lifestyle",
    defaultGender: "female",
    defaultAge: "40s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} salon director gently advising a client in front of a mirror, hand near the client's hair, ` +
      `warm minimalist salon, client face out of frame, three-quarter angle on the director, ` + COMMON_TAIL,
  },
  {
    id: "beauty-customer-relax",
    industry: "beauty",
    role: "customer",
    title: "손님 — 샴푸 받는 순간",
    desc: "눈 감고 이완된 표정",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} salon customer lying back at a shampoo basin with eyes gently closed, relaxed expression, ` +
      `soft warm salon light, water and lather softly suggested, face three-quarter, ` + COMMON_TAIL,
  },
  {
    id: "beauty-product-shelf",
    industry: "beauty",
    role: "product",
    title: "제품 진열 — 케어 라인",
    desc: "헤어 제품만 (인물 없음)",
    frame: "overhead",
    promptEN: ({ signatureMenu }) =>
      `Overhead flat-lay of premium hair care products${signatureMenu ? ` featuring ${signatureMenu}` : ""} — bottles and a wooden comb — arranged on a clean marble counter, ` +
      `a folded linen towel and dried eucalyptus beside, soft daylight, no people, ` + COMMON_TAIL,
  },

  // ─────────── 로컬/패션/잡화 (변형, staff 제외) ───────────
  {
    id: "local-owner-wrapping",
    industry: "local",
    role: "owner",
    title: "사장님 — 포장하는 손",
    desc: "구매 상품을 정성껏 포장",
    frame: "closeup",
    defaultGender: "female",
    defaultAge: "30s",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a boutique owner's hands carefully wrapping ${signatureMenu ?? "a purchased item"} in kraft paper and twine, ` +
      `warm store counter, dried flowers beside, soft afternoon light, ` + COMMON_TAIL,
  },
  {
    id: "local-owner-display",
    industry: "local",
    role: "owner",
    title: "사장님 — 진열 매만지는 모습",
    desc: "선반 상품을 정돈",
    frame: "lifestyle",
    defaultGender: "female",
    defaultAge: "40s",
    promptEN: ({ gender, age }) =>
      `${genderDescriptor(gender)} ${ageDescriptor(age)} boutique owner arranging items on a wooden shelf in a warm Korean lifestyle store, ` +
      `gentle expression, three-quarter angle, soft natural light, ` + COMMON_TAIL,
  },
  {
    id: "local-customer-browse",
    industry: "local",
    role: "customer",
    title: "손님 — 제품 살펴보는 손",
    desc: "물건을 들어 살피는 순간",
    frame: "closeup",
    defaultGender: "any",
    defaultAge: "20s",
    promptEN: ({ signatureMenu }) =>
      `Close-up of a customer's hands gently lifting and examining ${signatureMenu ?? "a small handcrafted item"} in a quiet Korean boutique, ` +
      `shelves softly blurred behind, warm afternoon light, ` + COMMON_TAIL,
  },
  {
    id: "local-product-detail",
    industry: "local",
    role: "product",
    title: "제품 디테일 클로즈업",
    desc: "질감이 보이는 한 컷 (인물 없음)",
    frame: "closeup",
    promptEN: ({ signatureMenu }) =>
      `Close-up of ${signatureMenu ?? "a handcrafted product"} showing rich material texture, resting on a soft neutral linen surface, ` +
      `dried flower beside, warm directional window light, no people, ` + COMMON_TAIL,
  },
];

// 업종별 씬 필터
export function getScenesForIndustry(industry: Industry): ModelScene[] {
  return MODEL_SCENES.filter((s) => s.industry === industry);
}

// 추천 씬 — 업종별로 가장 자주 쓰이는 4종
const RECOMMENDED_BY_INDUSTRY: Record<Industry, SceneRole[]> = {
  restaurant: ["staff", "customer", "owner", "product"],
  cafe: ["staff", "customer", "owner", "product"],
  dessert: ["staff", "customer", "product", "owner"],
  stay: ["owner", "customer", "product", "staff"],
  beauty: ["staff", "customer", "owner", "product"],
  local: ["owner", "customer", "product"],
};

// 문자열 → 32비트 양의 정수 (결정론, Math.random 금지). FNV-1a 변형.
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 추천 씬 — 역할별로 변형 중 seed로 결정론적 1개 선택.
// seed 생략(=0) 시 각 역할의 첫 변형 → 기존 동작과 호환.
export function getRecommendedScenes(industry: Industry, seed: number = 0): ModelScene[] {
  const all = getScenesForIndustry(industry);
  const order = RECOMMENDED_BY_INDUSTRY[industry] || ["staff", "customer", "owner", "product"];
  const seen = new Set<string>();
  const out: ModelScene[] = [];
  order.forEach((role, roleIndex) => {
    const variants = all.filter((s) => s.role === role);
    if (variants.length === 0) return;
    // seed + roleIndex 로 역할마다 다른 변형이 뽑히게 한다.
    const pick = variants[(seed + roleIndex) % variants.length];
    if (!seen.has(pick.id)) {
      seen.add(pick.id);
      out.push(pick);
    }
  });
  return out;
}

// 한국어 라벨 매핑
export const ROLE_LABELS: Record<SceneRole, string> = {
  owner: "사장님",
  staff: "직원·작업",
  customer: "손님",
  product: "제품·공간만",
};

export const FRAME_LABELS: Record<FrameStyle, string> = {
  portrait: "정면 인물",
  lifestyle: "자연스러운 일상",
  overhead: "위에서 본 컷",
  closeup: "손·디테일 클로즈업",
};

export const GENDER_LABELS: Record<ModelGender, string> = {
  female: "여성",
  male: "남성",
  any: "자동",
};

export const AGE_LABELS: Record<ModelAge, string> = {
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  any: "자동",
};
