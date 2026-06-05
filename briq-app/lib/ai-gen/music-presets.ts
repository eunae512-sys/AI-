// AI 음악 생성 프리셋 — 가사 + 무드 → 음악 생성 프롬프트 빌더

export type MusicMood =
  | "warm-acoustic"   // 따뜻한 어쿠스틱 — 카페·디저트
  | "lofi-chill"      // 로파이 잔잔 — 새벽·작업
  | "indie-bright"    // 인디 밝음 — 일상·산뜻
  | "ballad-emo"      // 발라드 감성 — 야경·기념일
  | "city-pop"        // 시티팝 — 트렌디·세련
  | "kpop-energy"     // K-Pop 활기 — 오픈·이벤트
  | "rock-edge"       // 록 강렬함 — 헤어·패션
  | "ambient-spa";    // 앰비언트 — 숙소·스파

export type MusicTempo = "slow" | "mid" | "fast"; // 70 / 95 / 125 BPM
export type MusicLength = 15 | 30 | 60; // 초 단위

export type MusicPreset = {
  id: MusicMood;
  label: string;        // 한국어 라벨
  desc: string;         // 한 줄 설명
  emoji: string;
  tempo: MusicTempo;
  bpm: number;
  instruments: string;  // 영문 — 음악 생성 프롬프트에 들어감
  genre: string;        // 영문
  bestFor: string[];    // 추천 업종
};

export const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: "warm-acoustic",
    label: "따뜻한 어쿠스틱",
    desc: "통기타·핸드드럼 · 카페 오후",
    emoji: "🌿",
    tempo: "mid",
    bpm: 92,
    genre: "warm organic acoustic folk, cozy café, intimate and heartfelt",
    instruments:
      "fingerpicked nylon acoustic guitar, soft felt upright piano, warm upright bass, gentle brushed drums, light shaker percussion, subtle warm strings",
    bestFor: ["cafe", "dessert", "stay"],
  },
  {
    id: "lofi-chill",
    label: "로파이 잔잔",
    desc: "어쿠스틱 로파이 · 새벽 작업",
    emoji: "🌙",
    tempo: "slow",
    bpm: 72,
    genre: "warm acoustic lo-fi, mellow jazz café, calm and contemplative",
    instruments:
      "soft brushed drums, warm upright bass, mellow felt piano, gentle Rhodes electric piano played warmly, subtle vinyl and tape texture, light rim percussion",
    bestFor: ["cafe", "restaurant"],
  },
  {
    id: "indie-bright",
    label: "인디 산뜻함",
    desc: "어쿠스틱·우쿨렐레 · 일상 브이로그",
    emoji: "☀️",
    tempo: "mid",
    bpm: 110,
    genre: "modern indie folk, bright and sunny, organic daylight vlog",
    instruments:
      "bright fingerpicked acoustic guitar, warm ukulele, soft glockenspiel, light hand claps, warm upright bass, gentle brushed drums",
    bestFor: ["dessert", "local", "cafe"],
  },
  {
    id: "ballad-emo",
    label: "감성 발라드",
    desc: "피아노·스트링 · 기념일",
    emoji: "💌",
    tempo: "slow",
    bpm: 76,
    genre: "cinematic intimate ballad, tender and emotional, cozy low-key",
    instruments:
      "intimate felt grand piano, soft warm string section, gentle Rhodes electric piano, light brushed drums, warm upright bass, natural reverb",
    bestFor: ["restaurant", "stay", "dessert"],
  },
  {
    id: "city-pop",
    label: "시티팝",
    desc: "어쿠스틱 그루브 · 트렌디",
    emoji: "🌃",
    tempo: "mid",
    bpm: 105,
    genre: "soft nostalgic city pop, smooth and refined, mellow nighttime groove",
    instruments:
      "warm groovy electric bass, mellow Rhodes electric piano played warmly, clean jazzy electric guitar, brushed drums with soft snare, light tambourine",
    bestFor: ["local", "beauty", "cafe"],
  },
  {
    id: "kpop-energy",
    label: "K-Pop 활기",
    desc: "밝은 인디팝 · 오픈·이벤트",
    emoji: "✨",
    tempo: "fast",
    bpm: 125,
    genre: "bright uplifting indie pop, cheerful and warm, organic celebratory energy",
    instruments:
      "upbeat strummed acoustic guitar, warm ukulele, bright felt piano, hand claps and tambourine, warm upright bass, lively brushed drums, soft glockenspiel",
    bestFor: ["beauty", "local", "dessert"],
  },
  {
    id: "rock-edge",
    label: "록 따뜻함",
    desc: "어쿠스틱 인디록 · 헤어·패션",
    emoji: "🔥",
    tempo: "fast",
    bpm: 132,
    genre: "warm indie folk rock, driving but organic, earthy and confident",
    instruments:
      "driving strummed acoustic guitar, warm clean electric guitar, warm electric bass groove, tight live drum kit with brushed snare, light tambourine",
    bestFor: ["beauty", "local"],
  },
  {
    id: "ambient-spa",
    label: "앰비언트 스파",
    desc: "어쿠스틱 명상 · 숙소·휴식",
    emoji: "🍃",
    tempo: "slow",
    bpm: 65,
    genre: "minimal contemplative acoustic ambient, calm and airy, serene spa",
    instruments:
      "sparse felt piano, soft fingerpicked nylon guitar, warm cello and soft strings, gentle koto, light wind chimes, natural room reverb",
    bestFor: ["stay", "beauty"],
  },
];

export const TEMPO_LABEL: Record<MusicTempo, string> = {
  slow: "느림 (잔잔)",
  mid: "보통",
  fast: "빠름 (활기)",
};

export function getPreset(id: MusicMood): MusicPreset {
  return MUSIC_PRESETS.find((p) => p.id === id) ?? MUSIC_PRESETS[0];
}

// 업종별 추천 프리셋 — 상위 3개
export function getRecommendedPresets(industry: string): MusicPreset[] {
  const matched = MUSIC_PRESETS.filter((p) => p.bestFor.includes(industry));
  // 매칭 + 나머지로 채움 (최소 3개)
  const rest = MUSIC_PRESETS.filter((p) => !matched.includes(p));
  return [...matched, ...rest].slice(0, 4);
}

// 가사 + 무드 → 음악 생성 모델용 영문 프롬프트
// (Replicate musicgen 등은 instrumental prompt + lyrics 라인을 분리해서 받음)
export function buildMusicPrompt(opts: {
  lyrics: string;
  mood: MusicMood;
  brandName?: string;
  industry?: string;
  /** true=악기 전용 BGM(보컬 금지 명시), false=가사 보컬 곡(보컬 허용). 기본 true. */
  instrumental?: boolean;
}): {
  instrumentalPrompt: string;
  lyricsText: string;
  estimatedDurationSec: number;
  bpm: number;
} {
  const preset = getPreset(opts.mood);
  const lyrics = (opts.lyrics ?? "").trim();

  // 가사 라인 수에 따라 길이 추정 (한 줄 ≈ 3초)
  const lineCount = lyrics.split(/\n/).filter((l) => l.trim()).length;
  const estimatedDurationSec = Math.max(15, Math.min(60, lineCount * 3 || 15));

  // Instrumental prompt — 무드 + 악기 + 장르 + BPM
  // 작곡가 수준 디렉션: 유기적 악기 + 따뜻한 아날로그 프로덕션 + 전자음/EDM 명시 배제.
  // 전 무드 공통 골격 = "어쿠스틱·유기적 우선, 싸구려 신스 금지".
  const isInstrumental = opts.instrumental ?? true;
  // 보컬 곡이면 "no vocals/instrumental only" 만 빼고, 어쿠스틱·전자음배제 가드레일은 공통 유지.
  const negative = isInstrumental
    ? "instrumental only, acoustic and organic only, no vocals, no harsh saw or square synths, no aggressive EDM, no big drops, no sidechain pumping, no dubstep, no 8-bit or chiptune, no cheap GM MIDI, no abrasive electronic bass"
    : "acoustic and organic backing, no harsh saw or square synths, no aggressive EDM, no big drops, no sidechain pumping, no dubstep, no 8-bit or chiptune, no cheap GM MIDI, no abrasive electronic bass";
  const instrumentalPrompt = [
    preset.genre,
    `at ${preset.bpm} BPM`,
    preset.instruments,
    // 프로덕션/톤 — 따뜻·유기적·아날로그·시네마틱이지만 아늑함
    "warm and organic production, recorded with real acoustic instruments, gentle dynamics, natural reverb, subtle analog tape warmth, cinematic but cozy, studio-quality and well-mixed",
    // 네거티브 — 전자음/EDM/싸구려 사운드 명시 배제 (모델이 negative 미지원 → 문장으로)
    negative,
  ].join(", ");

  return {
    instrumentalPrompt,
    lyricsText: lyrics,
    estimatedDurationSec,
    bpm: preset.bpm,
  };
}
