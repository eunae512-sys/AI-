// 온보딩에서 만든 사용자 브랜드 — localStorage 기반 영속화
// 온보딩 출력(업종/무드/사진/팔레트)을 Brand 객체로 변환해서
// BrandProvider / 모든 (app) 화면이 동일하게 읽어 쓰도록 함

import type { Brand, Industry, Mood as MoodId } from "@/types";
import type { ExtractedColor } from "@/lib/colors/extract-palette";

export type UserBrandData = {
  id: string;
  name: string;
  industry: Industry;
  industryLabel: string;
  city: string;
  moodId: MoodId | string;
  moodTag: string; // "Linen & Clay" 등
  palette: ExtractedColor[]; // 추출된 컬러 (≥1)
  photos: { url: string; name: string }[]; // 업로드 사진 (data URL)
  hook: { line1: string; line2: string; hashtag: string };
  toneText: string; // 업종 × 무드 기반 톤 설명
  // 사장님이 직접 입력한 가게 정보 — 카피 생성 시 사용
  tagline?: string; // "엄마 손맛 그대로, 강남에서 30년"
  signatureMenu?: string[]; // ["갈비찜", "냉이된장국", "5첩 한정식"]
  ownerName?: string; // 사장님 이름 (Settings 프로필용)
  ownerEmail?: string; // 사장님 이메일
  // 가격 페이지 deep-link 로 들어온 경우 — 결제 화면에서 미리 선택돼 있도록.
  selectedPlan?: "free" | "pro" | "studio" | "agency";
  createdAt: number;
};

const STORAGE_KEY = "briq:user-brand";
const BRANDS_KEY = "briq:user-brands";

export function saveUserBrand(data: UserBrandData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // QuotaExceededError — 사진 data URL 이 많으면 발생 가능
    // photos 제외하고 재시도
    try {
      const slim = { ...data, photos: data.photos.slice(0, 3) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      console.warn("user-brand 저장 실패", e);
    }
  }
  // 다중 목록에도 upsert (단일키 저장 성공 후)
  try {
    const list = loadUserBrands().filter((b) => b.id !== data.id);
    list.push(data);
    saveUserBrands(list);
  } catch {
    // 무시
  }
}

export function saveUserBrands(list: UserBrandData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(list));
  } catch (e) {
    // QuotaExceededError — photos 슬림화 후 재시도
    try {
      const slim = list.map((b) => ({ ...b, photos: b.photos.slice(0, 3) }));
      localStorage.setItem(BRANDS_KEY, JSON.stringify(slim));
    } catch {
      console.warn("user-brands 저장 실패", e);
    }
  }
}

export function loadUserBrands(): UserBrandData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BRANDS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (b): b is UserBrandData =>
              b && typeof b === "object" && !!b.id && !!b.industry && Array.isArray(b.palette),
          );
        }
      } catch {
        return [];
      }
    }
    // BRANDS_KEY 없을 때: 단일키 마이그레이션
    const single = loadUserBrand();
    if (single) {
      const migrated = [single];
      saveUserBrands(migrated);
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

export function addUserBrand(data: UserBrandData): void {
  const list = loadUserBrands();
  const i = list.findIndex((b) => b.id === data.id);
  if (i >= 0) {
    list[i] = data;
  } else {
    list.push(data);
  }
  saveUserBrands(list);
}

export function removeUserBrand(id: string): void {
  saveUserBrands(loadUserBrands().filter((b) => b.id !== id));
}

export function loadUserBrand(): UserBrandData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserBrandData;
    if (!parsed.id || !parsed.industry || !Array.isArray(parsed.palette)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearUserBrand(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}

// UserBrandData → Brand (BrandProvider 호환)
// 추출 팔레트의 가장 진한 색을 primary, 가장 옅은 색을 secondary 로 매핑
export function toBrand(u: UserBrandData): Brand {
  const sorted = [...u.palette].sort((a, b) => a.hsl[2] - b.hsl[2]);
  const primary = sorted[0]?.hex ?? "#3F362C";
  const secondary = sorted[sorted.length - 1]?.hex ?? "#EFE6D5";

  return {
    id: u.id,
    name: u.name,
    letter: u.name.charAt(0),
    industry: u.industry,
    industryLabel: u.industryLabel,
    city: u.city,
    toneVersion: 1,
    brandColors: { primary, secondary },
    gradient: gradientFromPalette(u.palette),
    campaign: `${u.moodTag} · 첫 캠페인`,
    // 가입 시 정한 무드 → 생성기(이미지/영상 톤)가 읽도록 Brand 에 실어 보냄
    mood: (u.moodId as Brand["mood"]) ?? "warm",
    followers: 0,
    saveRate: 0,
    reachThisMonth: 0,
  };
}

// 추출 팔레트 → Tailwind-safe 그라디언트 className
// 주의: arbitrary `from-[#xxx]` 는 JIT 가 컴파일 못함 (런타임 동적 클래스)
// → 팔레트 평균 hue 로 사전 정의된 stone/amber/rose/zinc 패밀리에 매핑
function gradientFromPalette(palette: ExtractedColor[]): string {
  if (palette.length === 0) return "from-stone-400 via-stone-600 to-stone-800";
  // 평균 hue 와 lightness 로 가까운 톤 패밀리 선택
  const avgHue = palette.reduce((s, c) => s + c.hsl[0], 0) / palette.length;
  const avgLight = palette.reduce((s, c) => s + c.hsl[2], 0) / palette.length;

  // 너무 어두우면 deep stone 톤
  if (avgLight < 0.22) return "from-stone-700 via-stone-800 to-zinc-900";

  // hue 별 매핑 (사전 정의된 Tailwind 클래스만 사용 — JIT 가 인식)
  if (avgHue < 20 || avgHue >= 340) return "from-rose-400 via-rose-500 to-rose-700";       // 로즈/레드
  if (avgHue < 50) return "from-amber-300 via-amber-500 to-amber-700";                       // 카멜/머스타드
  if (avgHue < 70) return "from-amber-200 via-stone-400 to-stone-700";                       // 샌드/오트
  if (avgHue < 160) return "from-emerald-400 via-emerald-600 to-emerald-800";                // 그린/세이지
  if (avgHue < 200) return "from-teal-400 via-teal-600 to-teal-800";                         // 시안/민트
  if (avgHue < 260) return "from-indigo-400 via-indigo-600 to-indigo-800";                   // 인디고/슬레이트
  if (avgHue < 300) return "from-violet-400 via-violet-600 to-violet-800";                   // 보라/라벤더
  return "from-fuchsia-400 via-fuchsia-600 to-rose-700";                                     // 핑크/모브
}
