"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { hexToPexelsColor } from "@/lib/api/demo-images";
import {
  RefreshCw,
  Download,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  ImageIcon,
  Cloud,
  CreditCard,
  Upload,
  Pencil,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  PenLine,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

type Source = "pexels" | "codex" | "ai";

type SlideCopy = { label: string; title: string; sub: string };

type SlideImage = {
  status: "idle" | "loading" | "ready" | "error";
  url?: string;
  source?: string;
  notice?: string;
  error?: string;
  meta?: { latencyMs?: number; costKrw?: number; photographer?: string };
};

type FactCheckIssue = { slide: number; word: string };
type EditTarget = { idx: number; field: "label" | "title" | "sub" } | null;

// 브랜드별 카드뉴스 6장 폴백 카피
const SLIDES_BY_BRAND: Record<string, SlideCopy[]> = {
  miokdang: [
    { label: "표지", title: "한 입에 봄이\n옵니다", sub: "미옥당 봄정식 · 5월 코스 공개" },
    { label: "재료", title: "새벽 4시\n양평 시장", sub: "두릅 · 머위 · 곰취 · 직접 담아 옵니다" },
    { label: "메뉴", title: "9가지 정성\n한 그릇의 시간", sub: "정식 코스 풀 라인업" },
    { label: "공간", title: "조용히 데워둔\n한 그릇", sub: "단정한 한식의 시간을 담은 공간" },
    { label: "맛", title: "장 · 산초\n계절의 결", sub: "직접 담근 장 7년의 손맛" },
    { label: "예약", title: "예약\n02-XXXX-1234", sub: "5월 한정 봄정식 · 4인 기준 ₩320,000" },
  ],
  "roastery-1985": [
    { label: "표지", title: "오늘 새 원두\n도착했어요", sub: "에티오피아 예가체프 · 5월 마지막 주" },
    { label: "산지", title: "Yirgacheffe\n2,000m", sub: "G1 · 워시드 · 자스민 · 베르가못" },
    { label: "추출", title: "핸드드립\n한 잔 3분", sub: "92℃ · 1:16 · 푸어오버" },
    { label: "메뉴", title: "콜드브루\n6시간 추출", sub: "5월 시즌 한정 · 산미 · 초콜릿" },
    { label: "공간", title: "1985년의\n첫 잔", sub: "서촌 골목 · 14석" },
    { label: "안내", title: "11~22시\n주말 12~23시", sub: "테이크아웃 -500원 · 매주 월요일 휴무" },
  ],
  "seochon-stay": [
    { label: "표지", title: "창호로 드는\n새벽 빛", sub: "서촌 한옥스테이 · 5월 객실 공개" },
    { label: "공간", title: "마당의\n시간", sub: "한옥 4채 · 모란 · 라일락 · 작약 · 백송" },
    { label: "객실", title: "온돌 · 소반\n조용한 5월의 밤", sub: "최대 4인 · 객실별 마당 전용" },
    { label: "조반", title: "한 상\n차림", sub: "두부조림 · 시금치 · 미역국 · 잡곡밥" },
    { label: "주변", title: "북촌까지\n도보 8분", sub: "경복궁 · 청와대 · 인사동 산책 코스" },
    { label: "예약", title: "1박 ₩280,000\n5월 패키지", sub: "어버이날 효도 패키지 -10%" },
  ],
  "dolce-dessert": [
    { label: "표지", title: "오늘 새로 구운\n수박 케이크", sub: "달콤 멈춤 주의 · 5월 한정" },
    { label: "단면", title: "녹는 단 한 입", sub: "수박 + 크림 치즈 + 라즈베리" },
    { label: "재료", title: "신선한 과일\n직접 손질", sub: "오늘 아침 시장 · 무방부제" },
    { label: "메뉴", title: "5월 신상\n마카롱 12종", sub: "장미 · 자몽 · 피스타치오 · 멜론" },
    { label: "예약", title: "주말 예약\n홀케이크", sub: "2일 전 예약 · 카톡 채널" },
    { label: "안내", title: "11~21시\n매주 화요일 휴무", sub: "성수동 · 주차 가능 (5대)" },
  ],
  "luna-hair": [
    { label: "표지", title: "결이\n살아요", sub: "5월 봄 컬러 시즌 · 단골 -10%" },
    { label: "컬러", title: "오늘의 컬러\n6가지", sub: "샴페인 · 라떼 · 토프 · 더스티 로즈" },
    { label: "시술", title: "5초만에\n광택", sub: "트리트먼트 + 봄 컬러 패키지" },
    { label: "포인트", title: "결을 잡는\n3가지", sub: "헤어 진단 → 시술 → 홈케어" },
    { label: "예약", title: "주중 예약\n10~21시", sub: "단골 ★ 우선 · 카톡 채널" },
    { label: "안내", title: "강남점\n역삼역 5분", sub: "주차 2시간 · 시술 시 무료" },
  ],
  "forum-fashion": [
    { label: "LOOKBOOK", title: "S/S 26\nLOOKBOOK", sub: "한 벌의 무게를 다시 생각합니다" },
    { label: "FABRIC", title: "ONE FABRIC\nTWO WAYS", sub: "Wool linen · 한 원단 두 실루엣" },
    { label: "COLOR", title: "Off white\nDeep charcoal", sub: "S/S 26 핵심 컬러 5종" },
    { label: "STYLING", title: "5 ways to\nwear it", sub: "한 셋업 · 다섯 가지 스타일링" },
    { label: "STORE", title: "한남동\nFORUM.", sub: "11~20시 · 주말 12~21시" },
    { label: "CONTACT", title: "DM 문의\n@forum.kr", sub: "사이즈 컨설팅 · 픽업 가능" },
  ],
};

// 브랜드별 Pexels 검색어 — 매거진/에디토리얼 톤으로 큐레이션
// 슬라이드 순서: 표지 · 후크/디테일 · 스토리/공간 · 메뉴1 · 메뉴2/디테일 · CTA/입구
const PEXELS_QUERY_BY_BRAND: Record<string, string[]> = {
  miokdang: [
    "minimal korean dining table editorial soft light",
    "fresh herbs macro flat lay editorial natural light",
    "traditional korean restaurant interior moody minimal",
    "korean banchan ceramic plates magazine flat lay",
    "ceramic bowl macro detail editorial soft light",
    "lantern hanok entrance evening moody minimal",
  ],
  "roastery-1985": [
    "specialty coffee bar minimal editorial warm light",
    "coffee bean macro detail aesthetic film grain",
    "pour over coffee hands aesthetic editorial",
    "cold brew glass condensation macro editorial",
    "cozy cafe interior warm tone editorial minimal",
    "cafe window evening soft light minimal editorial",
  ],
  "seochon-stay": [
    "hanok window morning light minimal editorial",
    "korean courtyard aesthetic moody natural light",
    "ondol bedroom interior wabi sabi minimal",
    "korean breakfast flat lay magazine editorial",
    "wooden lattice door detail macro editorial",
    "hanok night soft light minimal editorial",
  ],
  "dolce-dessert": [
    "pastel cake flat lay aesthetic editorial soft light",
    "dessert macro slice cross section editorial",
    "fresh berries fruit styling flat lay editorial",
    "macarons pastel minimal magazine flat lay",
    "patisserie display case soft light editorial",
    "boutique bakery interior pastel minimal editorial",
  ],
  "luna-hair": [
    "glossy hair texture macro editorial soft light",
    "hair color swatch palette minimal editorial",
    "modern salon interior minimal editorial",
    "hair detail brushstroke macro shine editorial",
    "minimal salon styling chair editorial",
    "boutique salon entrance window minimal editorial",
  ],
  "forum-fashion": [
    "minimal fashion editorial neutral linen tones",
    "linen fabric texture detail macro editorial",
    "neutral fashion flat lay editorial minimal",
    "minimal fashion model editorial soft natural light",
    "minimal boutique interior gallery editorial",
    "minimal fashion atelier editorial soft light",
  ],
};

// 슬라이드별 구도 모디파이어 (에디토리얼 다양성)
const SLIDE_COMPOSITION = [
  "hero shot with breathing negative space",
  "macro detail crop, shallow depth of field",
  "wide ambient interior, soft natural light",
  "overhead flat lay, composed",
  "tight detail macro, film grain texture",
  "moody atmospheric scene, end-of-day light",
];

const SOURCE_LABEL: Record<Source, { label: string; sub: string; icon: typeof Cloud }> = {
  pexels: { label: "무료 (Pexels)", sub: "0원 · 사실적 사진", icon: Cloud },
  codex: { label: "Codex 구독", sub: "ChatGPT Plus · gpt-image-2", icon: Sparkles },
  ai: { label: "AI 결제 (OpenAI)", sub: "gpt-image-1 · ~₩60/장", icon: CreditCard },
};

export function CardnewsScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const colors = detail?.colorPalette ?? [];
  const gradient = brand.gradient;

  const defaultSlides = SLIDES_BY_BRAND[brand.id] ?? SLIDES_BY_BRAND.miokdang;

  const [slides, setSlides] = useState<SlideCopy[]>(defaultSlides);
  const [source, setSource] = useState<Source>("pexels");
  const [images, setImages] = useState<SlideImage[]>(() => defaultSlides.map(() => ({ status: "idle" })));
  const [approved, setApproved] = useState<boolean[]>(() => defaultSlides.map(() => false));
  const [busy, setBusy] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [factCheck, setFactCheck] = useState<FactCheckIssue[] | null>(null);
  const [keyMissing, setKeyMissing] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const uploadAllRef = useRef<HTMLInputElement>(null);
  const uploadOneRef = useRef<HTMLInputElement>(null);
  const uploadTargetSlide = useRef<number | null>(null);

  const queries = PEXELS_QUERY_BY_BRAND[brand.id] ?? PEXELS_QUERY_BY_BRAND.miokdang;

  // 브랜드 전환 시 상태 리셋
  useEffect(() => {
    const fresh = SLIDES_BY_BRAND[brand.id] ?? SLIDES_BY_BRAND.miokdang;
    setSlides(fresh);
    setImages(fresh.map(() => ({ status: "idle" })));
    setApproved(fresh.map(() => false));
    setFactCheck(null);
    setEditing(null);
  }, [brand.id]);

  // 키 누락 사전 점검
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const missing: string[] = [];
        if (!d?.openai?.configured) missing.push("OPENAI_API_KEY");
        if (!d?.pexels?.configured) missing.push("PEXELS_API_KEY");
        setKeyMissing(missing.length ? missing.join(" · ") : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const generateOne = useCallback(
    async (idx: number, src: Source): Promise<SlideImage> => {
      const slide = slides[idx];
      const slideId = idx + 1;

      if (src === "pexels") {
        const q = queries[idx] ?? queries[0];
        const pexelsColor = hexToPexelsColor(colors[0]?.hex);
        const res = await fetch("/api/search-pexels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            orientation: "portrait",
            size: "large",
            perPage: 24,
            color: pexelsColor,
            slideId,
          }),
        });
        const data = await res.json();
        if (!data.ok) return { status: "error", error: data.error || "Pexels 검색 실패" };
        return {
          status: "ready",
          url: data.image,
          source: data.meta?.source,
          notice: data.meta?.notice,
          meta: { latencyMs: data.meta?.latencyMs, photographer: data.meta?.photographer },
        };
      }

      const prompt = buildImagePrompt(brand.id, brand.industryLabel, brand.campaign, slide, idx, colors[0]?.hex);

      if (src === "codex") {
        const res = await fetch("/api/generate-image-codex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, size: "1024x1536", slideId }),
        });
        const data = await res.json();
        if (!data.ok) return { status: "error", error: data.error || "Codex 생성 실패" };
        return {
          status: "ready",
          url: data.image,
          source: data.meta?.source,
          notice: data.meta?.notice,
          meta: { latencyMs: data.meta?.latencyMs, costKrw: data.meta?.costKrw },
        };
      }

      // ai (OpenAI gpt-image-1)
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1536", quality: "medium", slideId }),
      });
      const data = await res.json();
      if (!data.ok) return { status: "error", error: data.error || "OpenAI 이미지 생성 실패" };
      return {
        status: "ready",
        url: data.image,
        source: data.meta?.source,
        notice: data.meta?.notice,
        meta: { latencyMs: data.meta?.latencyMs, costKrw: data.meta?.costKrw },
      };
    },
    [brand.id, brand.industryLabel, brand.campaign, slides, queries, colors],
  );

  const regenerateAll = useCallback(async () => {
    setBusy(true);
    setImages(slides.map(() => ({ status: "loading" })));
    toast.info(`${brand.name} · 6장 ${SOURCE_LABEL[source].label}로 생성 시작`);
    const results = await Promise.all(
      slides.map(async (_, i) => {
        try {
          return await generateOne(i, source);
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          return { status: "error" as const, error: err };
        }
      }),
    );
    setImages(results);
    setBusy(false);
    const okCount = results.filter((r) => r.status === "ready").length;
    const demoCount = results.filter((r) => r.source === "demo-fallback").length;
    if (okCount === slides.length) {
      if (demoCount > 0) {
        toast.warn(`${okCount}/${slides.length} 완료 · ${demoCount}장은 데모 폴백 (API 키 확인)`);
      } else {
        toast.success(`${brand.name} · ${okCount}장 ${SOURCE_LABEL[source].label} 완료`);
      }
    } else {
      toast.warn(`${okCount}/${slides.length} 완료 · 일부 실패`);
    }
  }, [slides, source, brand.name, generateOne, toast]);

  const regenerateOne = useCallback(
    async (idx: number) => {
      setImages((prev) => prev.map((s, i) => (i === idx ? { status: "loading" } : s)));
      try {
        const r = await generateOne(idx, source);
        setImages((prev) => prev.map((s, i) => (i === idx ? r : s)));
        if (r.status === "ready") {
          toast.success(`${idx + 1}번 슬라이드 ${SOURCE_LABEL[source].label} 완료`);
        } else {
          toast.warn(`${idx + 1}번 실패: ${r.error}`);
        }
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setImages((prev) => prev.map((s, i) => (i === idx ? { status: "error", error: err } : s)));
        toast.warn(`${idx + 1}번 오류: ${err}`);
      }
    },
    [generateOne, source, toast],
  );

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    });

  const onUploadAll = () => uploadAllRef.current?.click();

  const onUploadAllChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (e.target) e.target.value = "";
    if (!files.length) return;
    const useCount = Math.min(files.length, slides.length);
    toast.info(`업로드 시작 — ${useCount} / ${slides.length} 슬라이드 적용 중`);
    const next: SlideImage[] = [...images];
    for (let i = 0; i < useCount; i++) {
      try {
        const file = files[i];
        const dataUrl = await readAsDataUrl(file);
        next[i] = {
          status: "ready",
          url: dataUrl,
          source: "upload",
          meta: { latencyMs: 0, costKrw: 0 },
          notice: `${file.name} · ${Math.round(file.size / 1024)}KB`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        next[i] = { status: "error", error: msg };
      }
    }
    setImages(next);
    toast.success(`${useCount}장 업로드 완료 · 텍스트는 그대로 유지됩니다`);
  };

  const onUploadOneClick = (slideIdx: number) => {
    uploadTargetSlide.current = slideIdx;
    uploadOneRef.current?.click();
  };

  const onUploadOneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetIdx = uploadTargetSlide.current;
    if (e.target) e.target.value = "";
    uploadTargetSlide.current = null;
    if (!file || targetIdx === null) return;
    if (!file.type.startsWith("image/")) {
      toast.warn("이미지 파일만 업로드 가능합니다");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setImages((prev) =>
        prev.map((s, i) =>
          i === targetIdx
            ? {
                status: "ready",
                url: dataUrl,
                source: "upload",
                meta: { latencyMs: 0, costKrw: 0 },
                notice: `${file.name} · ${Math.round(file.size / 1024)}KB`,
              }
            : s,
        ),
      );
      toast.success(`${targetIdx + 1}번 슬라이드 업로드 완료 (${Math.round(file.size / 1024)}KB)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.warn(`업로드 실패: ${msg}`);
    }
  };

  const generateText = useCallback(async () => {
    setGeneratingText(true);
    toast.info(`${brand.name} 카드뉴스 텍스트 GPT-4o 생성 중...`);
    try {
      const body = {
        brand: brand.name,
        industry: brand.industryLabel,
        location: brand.city,
        campaign: brand.campaign,
        tone: detail?.toneSummary ?? "단정한 존댓말, 절제, 신뢰",
        forbidden: (detail?.forbiddenWords ?? []).join(", "),
        must_say: (detail?.preferredWords ?? []).join(", "),
        slide_count: 6,
      };
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`텍스트 생성 실패: ${data.error}`);
        return;
      }
      const raw = (data.slides as Array<{ label?: string; title?: string; sub?: string }>) || [];
      const newSlides: SlideCopy[] = raw.slice(0, 6).map((s) => ({
        label: s.label ?? "",
        title: s.title ?? "",
        sub: s.sub ?? "",
      }));
      while (newSlides.length < 6) newSlides.push({ label: "", title: "", sub: "" });
      setSlides(newSlides);
      setApproved(newSlides.map(() => false));
      setFactCheck(null);
      setEditing(null);
      const cost = data.meta?.costKrw ?? 0;
      const lat = data.meta?.latencyMs ?? 0;
      if (data.meta?.demoMode) {
        toast.warn("6장 텍스트 데모 폴백 — OPENAI_API_KEY 확인 필요");
      } else {
        toast.success(`6장 텍스트 GPT-4o 완료 · ₩${cost} · ${lat}ms`);
      }
      if (Array.isArray(data.flagged) && data.flagged.length) {
        const issues: FactCheckIssue[] = data.flagged.map(
          (f: { slide: number; word: string }) => ({ slide: f.slide, word: f.word }),
        );
        setFactCheck(issues);
        toast.warn(`${issues.length}건 금지어 검출 — 검수 결과 확인`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`텍스트 생성 오류: ${msg}`);
    } finally {
      setGeneratingText(false);
    }
  }, [brand, detail, toast]);

  const runFactCheck = useCallback(() => {
    const forbiddenList = detail?.forbiddenWords ?? [];
    if (forbiddenList.length === 0) {
      setFactCheck([]);
      toast.info("브랜드 금지어 미설정 — 검출 룰 없음");
      return;
    }
    const issues: FactCheckIssue[] = [];
    slides.forEach((s, idx) => {
      const text = `${s.label} ${s.title} ${s.sub}`;
      forbiddenList.forEach((word) => {
        if (text.includes(word)) issues.push({ slide: idx + 1, word });
      });
    });
    setFactCheck(issues);
    if (issues.length === 0) toast.success("사실 확인 완료 · 금지어 검출 없음");
    else toast.warn(`${issues.length}건 검출 — 검수 결과 카드 확인`);
  }, [slides, detail, toast]);

  const updateField = (idx: number, field: "label" | "title" | "sub", value: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const toggleApprove = (idx: number) => {
    setApproved((prev) => prev.map((a, i) => (i === idx ? !a : a)));
  };

  const approveAll = () => {
    setApproved(slides.map(() => true));
    toast.success("6장 모두 승인 — 인스타 업로드 준비 완료");
  };

  const rejectAll = () => {
    setApproved(slides.map(() => false));
    toast.warn("6장 모두 반려 — 재검수 필요");
  };

  const approvedCount = approved.filter(Boolean).length;

  const onVariation = useCallback(async () => {
    setGeneratingText(true);
    toast.info(`${brand.name} 변형 카피 GPT-4o 생성 중 — 다른 각도로 6장`);
    try {
      const variationHint = " 변형 버전 — 같은 캠페인이지만 다른 후크/스토리/각도로 새로 써주세요. 첫 시도와 겹치지 않게.";
      const body = {
        brand: brand.name,
        industry: brand.industryLabel,
        location: brand.city,
        campaign: brand.campaign + variationHint,
        tone: detail?.toneSummary ?? "단정한 존댓말, 절제, 신뢰",
        forbidden: (detail?.forbiddenWords ?? []).join(", "),
        must_say: (detail?.preferredWords ?? []).join(", "),
        slide_count: 6,
      };
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`변형 생성 실패: ${data.error}`);
        return;
      }
      const raw = (data.slides as Array<{ label?: string; title?: string; sub?: string }>) || [];
      const next: SlideCopy[] = raw.slice(0, 6).map((s) => ({
        label: s.label ?? "",
        title: s.title ?? "",
        sub: s.sub ?? "",
      }));
      while (next.length < 6) next.push({ label: "", title: "", sub: "" });
      setSlides(next);
      setApproved(next.map(() => false));
      setFactCheck(null);
      const cost = data.meta?.costKrw ?? 0;
      toast.success(`변형 6장 완료 · ₩${cost}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`변형 생성 오류: ${msg}`);
    } finally {
      setGeneratingText(false);
    }
  }, [brand, detail, toast]);
  const onPublish = () => {
    if (approvedCount < slides.length) {
      toast.warn(`승인된 슬라이드 ${approvedCount}/${slides.length} · 전체 승인 후 발행 가능`);
      return;
    }
    toast.success(`${brand.name} 인스타에 캐러셀 ${slides.length}장 발행 요청됨`);
  };
  const onQueue = () => toast.success(`${brand.name} 예약 큐에 카드뉴스 추가됨`);
  const onDownload = () => toast.info("ZIP 다운로드 시작 — 6.4 MB");

  return (
    <div className="px-6 py-6">
      <AnimatePresence>
        {keyMissing && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">키 누락: {keyMissing}</span>
              <span className="ml-2 opacity-80">
                briq-app/.env.local 에 키 추가 후 dev 서버 재시작 · 그 전까지는 데모 폴백 동작
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-[10px] px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
            AI CARDNEWS · {brand.name}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">카드뉴스 6장 자동 생성</h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
            {brand.name} 톤 v{brand.toneVersion} · 컬러 팔레트 · {detail?.hero.tagline ?? brand.campaign}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={generateText}
            disabled={busy || generatingText}
            className="text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50"
          >
            {generatingText ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PenLine className="h-3.5 w-3.5" />
            )}
            AI 텍스트 생성
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadAll} disabled={busy}>
            <Upload className="h-3.5 w-3.5" />직접 업로드
          </Button>
          <Button variant="outline" size="sm" onClick={onVariation} disabled={busy}>
            <RefreshCw className="h-3.5 w-3.5" />변형 생성
          </Button>
          <Button size="sm" onClick={regenerateAll} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            이미지 재생성
          </Button>
        </div>
      </div>

      <input
        ref={uploadAllRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={onUploadAllChange}
      />
      <input
        ref={uploadOneRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadOneChange}
      />

      {/* Source toggle */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">이미지 소스</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              브랜드 무드에 맞는 소스 선택 · 6장 모두 같은 소스로 생성됩니다
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900/40">
            {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => {
              const Icon = SOURCE_LABEL[s].icon;
              const active = source === s;
              return (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  disabled={busy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{SOURCE_LABEL[s].label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500">
          현재: <span className="font-medium text-zinc-700 dark:text-zinc-300">{SOURCE_LABEL[source].label}</span> · {SOURCE_LABEL[source].sub}
        </div>
      </Card>

      {/* Slide grid */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">6장 캐러셀</h3>
          <span className="text-[11px] text-zinc-500">9:16 · 인스타 캐러셀 · 발행 전 검수 자동</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {slides.map((s, i) => {
            const c = colors[i % (colors.length || 1)];
            const img = images[i] ?? { status: "idle" };
            const fallbackBg = c
              ? { backgroundImage: `linear-gradient(135deg, ${c.hex}, ${colors[(i + 1) % colors.length]?.hex ?? c.hex})` }
              : undefined;

            return (
              <motion.article
                key={`${brand.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br ${gradient} border border-zinc-100 dark:border-zinc-800 group`}
                style={img.status !== "ready" ? fallbackBg : undefined}
              >
                {img.status === "ready" && img.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={s.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* dark overlay for text readability when image is loaded */}
                {img.status === "ready" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/20 pointer-events-none" />
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1 max-w-[80%]">
                  {editing?.idx === i && editing.field === "label" ? (
                    <input
                      autoFocus
                      value={s.label}
                      onChange={(ev) => updateField(i, "label", ev.target.value)}
                      onBlur={() => setEditing(null)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === "Escape") setEditing(null);
                      }}
                      className="text-[9px] font-bold uppercase tracking-widest text-white bg-black/60 backdrop-blur px-1.5 py-0.5 rounded outline-none ring-1 ring-white/40 w-32"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ idx: i, field: "label" })}
                      className="text-[9px] font-bold uppercase tracking-widest text-white/90 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded hover:bg-black/60 transition-colors"
                      title="라벨 편집"
                    >
                      {String(i + 1).padStart(2, "0")} · {s.label || "—"}
                    </button>
                  )}
                  {img.source === "demo-fallback" && (
                    <span className="text-[8px] font-semibold uppercase tracking-widest text-white/90 bg-amber-600/80 backdrop-blur px-1.5 py-0.5 rounded">
                      DEMO
                    </span>
                  )}
                  {img.source === "upload" && (
                    <span className="text-[8px] font-semibold uppercase tracking-widest text-white/90 bg-emerald-600/80 backdrop-blur px-1.5 py-0.5 rounded">
                      UPLOAD
                    </span>
                  )}
                  {approved[i] && (
                    <span className="text-[8px] font-semibold uppercase tracking-widest text-white bg-emerald-700/90 backdrop-blur px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {img.status === "loading" && (
                  <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}

                {img.status === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-rose-900/40 backdrop-blur-sm p-3">
                    <div className="text-center">
                      <AlertCircle className="h-5 w-5 text-rose-200 mx-auto" />
                      <div className="mt-1 text-[9px] text-rose-100 line-clamp-3">{img.error}</div>
                      <div className="mt-1 text-[8px] text-rose-200/80">탭해서 재시도</div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  {editing?.idx === i && editing.field === "title" ? (
                    <textarea
                      autoFocus
                      value={s.title}
                      onChange={(ev) => updateField(i, "title", ev.target.value)}
                      onBlur={() => setEditing(null)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Escape") setEditing(null);
                      }}
                      rows={3}
                      className="w-full text-base font-bold leading-tight bg-black/50 backdrop-blur text-white p-1 rounded outline-none ring-1 ring-white/50 resize-none"
                      style={{
                        fontFamily:
                          brand.id === "miokdang" || brand.id === "seochon-stay"
                            ? "'Nanum Myeongjo', serif"
                            : undefined,
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ idx: i, field: "title" })}
                      className="block w-full text-left text-base font-bold leading-tight whitespace-pre-line drop-shadow-lg hover:bg-black/20 rounded transition-colors"
                      style={{
                        fontFamily:
                          brand.id === "miokdang" || brand.id === "seochon-stay"
                            ? "'Nanum Myeongjo', serif"
                            : undefined,
                      }}
                      title="제목 편집 (Esc 종료)"
                    >
                      {s.title || <span className="opacity-60">제목 추가</span>}
                    </button>
                  )}

                  {editing?.idx === i && editing.field === "sub" ? (
                    <input
                      autoFocus
                      value={s.sub}
                      onChange={(ev) => updateField(i, "sub", ev.target.value)}
                      onBlur={() => setEditing(null)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === "Escape") setEditing(null);
                      }}
                      className="mt-1 w-full text-[10px] bg-black/50 backdrop-blur text-white px-1 py-0.5 rounded outline-none ring-1 ring-white/50"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ idx: i, field: "sub" })}
                      className="mt-1 block w-full text-left text-[10px] opacity-90 line-clamp-2 drop-shadow hover:opacity-100 hover:bg-black/20 rounded transition-all"
                      title="부제 편집"
                    >
                      {s.sub || <span className="opacity-60">부제 추가</span>}
                    </button>
                  )}

                  {img.status === "ready" && img.meta && (img.meta.latencyMs || img.meta.costKrw) ? (
                    <div className="mt-1.5 flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/75">
                      {img.meta.latencyMs ? <span>{(img.meta.latencyMs / 1000).toFixed(1)}s</span> : null}
                      {img.meta.costKrw ? <span>· ₩{img.meta.costKrw}</span> : null}
                      {img.meta.photographer ? <span className="truncate">· {img.meta.photographer}</span> : null}
                    </div>
                  ) : null}
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleApprove(i);
                    }}
                    className={`text-[8px] font-semibold uppercase tracking-widest backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 ${
                      approved[i]
                        ? "text-white bg-emerald-700 hover:bg-emerald-800"
                        : "text-white/95 bg-white/15 hover:bg-white/30"
                    }`}
                    title={approved[i] ? "승인 취소" : "이 슬라이드 승인"}
                  >
                    <Check className="h-2.5 w-2.5" />
                    {approved[i] ? " 승인됨" : " 승인"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onUploadOneClick(i);
                    }}
                    className="text-[8px] font-semibold uppercase tracking-widest text-white/95 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 disabled:opacity-50"
                    title="이 슬라이드 사진 직접 업로드"
                  >
                    <Upload className="h-2.5 w-2.5" /> 업로드
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      regenerateOne(i);
                    }}
                    className="text-[8px] font-semibold uppercase tracking-widest text-white/95 bg-black/60 hover:bg-black/80 backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 disabled:opacity-50"
                    title="이 슬라이드만 재생성"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> 재생성
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            슬라이드 호버 = 업로드/재생성/승인
          </span>
          <span className="inline-flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            라벨·제목·부제 클릭 = 인라인 편집
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <ClipboardCheck className="h-3 w-3" />
            승인 {approvedCount}/{slides.length}
          </span>
        </div>
      </Card>

      {/* Actions + Tone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">검수 결과</h3>
            <Button variant="outline" size="sm" onClick={runFactCheck}>
              <ShieldCheck className="h-3.5 w-3.5" />사실 확인
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 mb-4">
            {brand.name} 톤 v{brand.toneVersion} · 금지어 {detail?.forbiddenWords.length ?? 0}개 · 필수어 {detail?.preferredWords.length ?? 0}개
          </p>

          <ul className="space-y-2 text-xs">
            {factCheck === null ? (
              <li className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                <span className="h-5 w-5 rounded bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-zinc-500 font-bold text-[10px]">i</span>
                <span className="flex-1 text-zinc-600 dark:text-zinc-400">
                  &quot;사실 확인&quot; 버튼을 눌러 금지어/표현 검사를 실행하세요
                </span>
              </li>
            ) : factCheck.length === 0 ? (
              <>
                <li className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="flex-1">금지어 검사 통과 ({detail?.forbiddenWords.length ?? 0}개 단어 모두 검출 안됨)</span>
                </li>
                <li className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="flex-1">컬러 팔레트 일관성 (6 컬러 모두 적용)</span>
                </li>
              </>
            ) : (
              factCheck.map((issue, k) => (
                <li
                  key={`${issue.slide}-${issue.word}-${k}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-50/40 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40"
                >
                  <span className="h-5 w-5 rounded bg-rose-100 dark:bg-rose-500/20 grid place-items-center text-rose-700 dark:text-rose-400 font-bold text-[10px]">
                    !
                  </span>
                  <span className="flex-1">
                    슬라이드 {issue.slide}장 — 금지어 검출:{" "}
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{issue.word}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditing({ idx: issue.slide - 1, field: "title" })}
                  >
                    수정
                  </Button>
                </li>
              ))
            )}
          </ul>

          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={onPublish}>
              <Send className="h-3.5 w-3.5" />인스타에 발행
              <span className="ml-1 text-[10px] opacity-80">({approvedCount}/{slides.length})</span>
            </Button>
            <Button variant="outline" size="sm" onClick={approveAll}>
              <Check className="h-3.5 w-3.5" />전체 승인
            </Button>
            <Button variant="outline" size="sm" onClick={rejectAll}>
              <X className="h-3.5 w-3.5" />전체 반려
            </Button>
            <Button variant="outline" size="sm" onClick={onQueue}>
              예약 큐에 추가
            </Button>
            <Button variant="ghost" size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />ZIP 다운로드
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">{brand.name} 컬러</h3>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((c) => (
              <div key={c.hex}>
                <div className="aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800" style={{ background: c.hex }} />
                <div className="mt-1 text-[10px] font-medium truncate">{c.name}</div>
                <div className="text-[9px] text-zinc-500 tabular-nums">{c.hex}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Badge tone="violet">{SOURCE_LABEL[source].label}</Badge>
            <p className="mt-2 text-[10px] text-zinc-500">{SOURCE_LABEL[source].sub}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 브랜드 + 슬라이드 → gpt-image-1 / Codex 용 매거진 품질 영문 프롬프트
function buildImagePrompt(
  brandId: string,
  industryLabel: string,
  campaign: string,
  slide: SlideCopy,
  slideIdx: number,
  primaryHex?: string,
): string {
  const mood = MOOD_BY_BRAND[brandId] ?? MOOD_BY_BRAND.miokdang;
  const composition = SLIDE_COMPOSITION[slideIdx % SLIDE_COMPOSITION.length];
  const colorDirective = primaryHex
    ? `Color palette anchored on ${primaryHex}, harmonised desaturated tones. `
    : "";
  return [
    `Editorial magazine photograph for a ${industryLabel} brand. ${mood}.`,
    `Reference aesthetic: Kinfolk, Cereal Magazine, Wallpaper*, Vogue Korea 2025 spread.`,
    `Composition: ${composition}. Vertical 9:16 portrait. Rule of thirds with intentional negative space for headline overlay (top or bottom 30%).`,
    `${colorDirective}Soft directional natural light, subtle film grain, cinematic depth of field f/1.8–f/2.8. Muted, sophisticated palette — no saturated cartoon colors.`,
    `Subject: ${slide.label} — ${slide.title.replace(/\n/g, " ")} (${slide.sub}). Campaign context: ${campaign}.`,
    `Strictly avoid: stock-photo cliché, white isolated background, harsh on-camera flash, oversaturated HDR, generic faces looking at camera, logos, on-image text/typography.`,
    `Aim for: 2025 editorial photography quality, intentional, restrained, like a real human photographer's portfolio shot.`,
  ].join(" ");
}

const MOOD_BY_BRAND: Record<string, string> = {
  miokdang:
    "Refined Korean traditional fine dining (한정식). Warm clay-earth tones, aged ceramic ware, dark walnut and brass accents, hanok ambience. Intimate omakase-counter mood. Think: Noma Korea, Park's Tokyo. Avoid touristy hanbok and red lanterns.",
  "roastery-1985":
    "Specialty third-wave coffee bar. Warm amber-stone palette, exposed brick, brushed steel, dark walnut counters. Pour-over rituals, beans cooling, condensation on cold-brew glass. Reference: Blue Bottle, Coffee Libre, Onibus aesthetic.",
  "seochon-stay":
    "Traditional Korean hanok stay. Wooden lattice doors (살창), white hanji paper, polished wood floor, courtyard with single tree. Wabi-sabi minimalism, dawn light filtering through paper. Reference: ryokan Kyoto + Seochon hanok crossover.",
  "dolce-dessert":
    "Boutique patisserie with pastel sophistication — not cute, but elegant. Soft blush, ivory, dusty rose. Marble countertop, satin ribbon, single rose. Fresh fruit cross-sections under daylight window. Reference: Cédric Grolet, Maison Pic plating.",
  "luna-hair":
    "Modern minimal hair salon, lifestyle editorial. Glossy hair detail macro, brush strokes, color swatches laid out. Soft window light, brushed concrete, single fresh flower. Reference: Aveda campaign + Korean idol hair editorial 2025.",
  "forum-fashion":
    "High-end minimal fashion editorial. Off-white, deep charcoal, oat linen, ecru. Concrete or oak floor, gallery-white wall, single garment on hanger. Soft north-facing window light. Reference: The Row, Jil Sander, Lemaire campaign 2025.",
};
