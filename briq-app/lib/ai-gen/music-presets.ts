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
    genre: "warm acoustic folk",
    instruments: "fingerpicked acoustic guitar, soft hand percussion, gentle piano",
    bestFor: ["cafe", "dessert", "stay"],
  },
  {
    id: "lofi-chill",
    label: "로파이 잔잔",
    desc: "비트·재즈코드 · 새벽 작업",
    emoji: "🌙",
    tempo: "slow",
    bpm: 72,
    genre: "lofi hip-hop chill",
    instruments: "lo-fi drum loop, vinyl crackle, jazz piano, soft bass",
    bestFor: ["cafe", "restaurant"],
  },
  {
    id: "indie-bright",
    label: "인디 산뜻함",
    desc: "어쿠스틱·신스 · 일상 브이로그",
    emoji: "☀️",
    tempo: "mid",
    bpm: 110,
    genre: "indie pop bright",
    instruments: "bright acoustic strums, soft synth pad, light claps, ukulele",
    bestFor: ["dessert", "local", "cafe"],
  },
  {
    id: "ballad-emo",
    label: "감성 발라드",
    desc: "피아노·스트링 · 기념일",
    emoji: "💌",
    tempo: "slow",
    bpm: 76,
    genre: "emotional ballad",
    instruments: "intimate piano, soft string section, light brushed drums",
    bestFor: ["restaurant", "stay", "dessert"],
  },
  {
    id: "city-pop",
    label: "시티팝",
    desc: "퍼커션·신스 · 트렌디",
    emoji: "🌃",
    tempo: "mid",
    bpm: 105,
    genre: "Japanese city pop 80s",
    instruments: "groovy bass, mellow electric piano, smooth synth, light snare",
    bestFor: ["local", "beauty", "cafe"],
  },
  {
    id: "kpop-energy",
    label: "K-Pop 활기",
    desc: "비트·신스 · 오픈·이벤트",
    emoji: "✨",
    tempo: "fast",
    bpm: 125,
    genre: "upbeat K-pop dance",
    instruments: "punchy kick drums, sparkling synth lead, vocal chops, claps",
    bestFor: ["beauty", "local", "dessert"],
  },
  {
    id: "rock-edge",
    label: "록 강렬함",
    desc: "기타·드럼 · 헤어·패션",
    emoji: "🔥",
    tempo: "fast",
    bpm: 132,
    genre: "indie rock with edge",
    instruments: "driving electric guitar, tight kick snare, bass groove",
    bestFor: ["beauty", "local"],
  },
  {
    id: "ambient-spa",
    label: "앰비언트 스파",
    desc: "자연음·신스패드 · 숙소·휴식",
    emoji: "🍃",
    tempo: "slow",
    bpm: 65,
    genre: "ambient spa relaxation",
    instruments: "soft synth pad, distant chime bells, nature water sounds, koto",
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
  const instrumentalPrompt = [
    preset.genre,
    `at ${preset.bpm} BPM`,
    preset.instruments,
    "warm production, polished mix, suitable for Korean small business marketing video background",
    "no harsh sounds, no aggressive distortion, family-friendly",
  ].join(", ");

  return {
    instrumentalPrompt,
    lyricsText: lyrics,
    estimatedDurationSec,
    bpm: preset.bpm,
  };
}
