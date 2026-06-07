// Vitest unit tests for multi-brand user-brand storage
import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory localStorage mock
function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get store() { return store; },
  };
}

let mockStorage = makeLocalStorageMock();

// Inject before module loads
Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
});

Object.defineProperty(globalThis, "window", {
  value: globalThis,
  writable: true,
});

// Import after mock injection
import {
  loadUserBrands,
  addUserBrand,
  saveUserBrand,
  loadUserBrand,
} from "./user-brand";

const SINGLE_KEY = "briq:user-brand";
const BRANDS_KEY = "briq:user-brands";

function makeBrand(id: string, name = "테스트 브랜드") {
  return {
    id,
    name,
    industry: "cafe" as const,
    industryLabel: "카페",
    city: "서울",
    moodId: "warm",
    moodTag: "Linen & Clay",
    palette: [{ hex: "#333", hsl: [0, 0, 0.2] as [number, number, number], name: "dark", ratio: 1, population: 1 }],
    photos: [],
    hook: { line1: "줄1", line2: "줄2", hashtag: "#test" },
    toneText: "따뜻한 톤",
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  mockStorage = makeLocalStorageMock();
  Object.defineProperty(globalThis, "localStorage", { value: mockStorage, writable: true });
});

describe("loadUserBrands", () => {
  it("(a) 빈 상태 → []", () => {
    const result = loadUserBrands();
    expect(result).toEqual([]);
  });

  it("(b) 단일키만 set → [1] 반환 + BRANDS_KEY 에 저장됨 (2회 호출해도 1개)", () => {
    const brand = makeBrand("me-abc");
    mockStorage.setItem(SINGLE_KEY, JSON.stringify(brand));

    const result1 = loadUserBrands();
    expect(result1).toHaveLength(1);
    expect(result1[0].id).toBe("me-abc");
    // BRANDS_KEY 에 저장됐는지 확인
    expect(mockStorage.getItem(BRANDS_KEY)).not.toBeNull();

    // 2번째 호출도 여전히 1개
    const result2 = loadUserBrands();
    expect(result2).toHaveLength(1);
    expect(result2[0].id).toBe("me-abc");
  });

  it("(c) BRANDS_KEY 손상 JSON → []", () => {
    mockStorage.setItem(BRANDS_KEY, "{ 손상된 json !!!}}}");
    const result = loadUserBrands();
    expect(result).toEqual([]);
  });
});

describe("addUserBrand", () => {
  it("빈 상태 add 후 length 1", () => {
    addUserBrand(makeBrand("me-001"));
    expect(loadUserBrands()).toHaveLength(1);
  });

  it("같은 id 재add 후에도 length 1 (교체)", () => {
    addUserBrand(makeBrand("me-001", "브랜드A"));
    addUserBrand(makeBrand("me-001", "브랜드A_수정"));
    const list = loadUserBrands();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("브랜드A_수정");
  });

  it("다른 id add 후 length 2", () => {
    addUserBrand(makeBrand("me-001"));
    addUserBrand(makeBrand("me-002"));
    expect(loadUserBrands()).toHaveLength(2);
  });
});

describe("saveUserBrand 보강", () => {
  it("saveUserBrand 호출 후 loadUserBrands 에 해당 id 1개 존재", () => {
    const brand = makeBrand("me-save-test");
    saveUserBrand(brand);
    const list = loadUserBrands();
    const found = list.filter((b) => b.id === "me-save-test");
    expect(found).toHaveLength(1);
  });

  it("saveUserBrand 중복 호출 시 교체 (id 1개 유지)", () => {
    const brand = makeBrand("me-dup");
    saveUserBrand(brand);
    saveUserBrand({ ...brand, name: "수정됨" });
    const list = loadUserBrands();
    const found = list.filter((b) => b.id === "me-dup");
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("수정됨");
  });
});
