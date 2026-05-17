"use client";

// 슬라이드 이미지 픽커 — 셋 중 하나.
//
//   ① ChatGPT 생성 /api/generate-image-codex (Codex CLI · ChatGPT Plus/Pro 구독으로 gpt-image-2 호출)
//                                            — OpenAI API 빌링 안 씀
//   ② 사진 검색   /api/search-pexels        (Pexels editorial-scored)
//   ③ 업로드      FileReader → data URL
//
// 사장님이 "이 슬라이드만 좀 더 따뜻한 톤" 같은 결을 바꾸고 싶을 때 쓴다.
// 옵션 / 모델 / 사이즈는 보이지 않는다 — 항목 셋, 입력 한 칸, 결과 미리보기.

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, Sparkles, Search, Upload, X, RefreshCw, Lock } from "lucide-react";
import { useUsage } from "@/lib/billing/use-usage";
import { incrementUsage } from "@/lib/billing/usage";
import { isFeatureAllowed } from "@/lib/billing/gate";
import { FeatureLockedModal } from "@/components/billing/FeatureLockedModal";
import { LimitReachedModal } from "@/components/billing/LimitReachedModal";

type Mode = "ai" | "search" | "upload";

type Candidate = {
  url: string;
  alt?: string;
  photographer?: string;
};

type Props = {
  /** 현재 슬라이드 캡션 — 기본 검색어 / 프롬프트 시드 */
  caption: string;
  /** 슬라이드에 큐레이션된 영문 쿼리가 있으면 검색 기본값으로 사용 */
  imageQuery?: string;
  /** 가게 컨텍스트 — 폴백 정확도용 */
  industry?: string;
  /** 슬라이드 번호 — 시드 안정성 */
  slideId?: number | string;
  /** 결정되면 호출 */
  onPick: (url: string, meta?: { source: string; photographer?: string }) => void;
};

export function SlideImagePicker({ caption, imageQuery, industry, slideId, onPick }: Props) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("search");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [queryAi, setQueryAi] = React.useState("");
  const [querySearch, setQuerySearch] = React.useState("");
  // 사용자가 명시적으로 "인물 사진도 허용" 토글하면 페널티 해제 (드물게 사람 컷이 필요할 때)
  const [allowPeople, setAllowPeople] = React.useState(false);
  // 다양성 확보 — "다시 찾기" 누를 때마다 page 증가
  const [searchPage, setSearchPage] = React.useState(1);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // 플랜 게이팅 + 한도 — AI 이미지 생성은 Pro 부터, 한도는 플랜별
  const { check, planId, isMounted: planMounted } = useUsage();
  const aiAllowed = planMounted ? isFeatureAllowed("ai-image:generate", planId) : true;
  const [showLockedModal, setShowLockedModal] = React.useState(false);
  const [showLimitModal, setShowLimitModal] = React.useState(false);

  React.useEffect(() => {
    setQueryAi(captionToAiPrompt(caption));
    setQuerySearch(imageQuery ?? captionToSearchQuery(caption, industry));
  }, [caption, imageQuery, industry]);

  const runAi = async () => {
    // 1) 기능 자체가 잠겨있나? — Free 는 AI 이미지 안 됨
    if (!aiAllowed) {
      setShowLockedModal(true);
      return;
    }
    // 2) 한도가 도달했나? — Pro 월 50 / Studio 월 300
    const limit = check("aiImage");
    if (!limit.allowed) {
      setShowLimitModal(true);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      // Codex 경로 (ChatGPT Plus/Pro 구독) — OpenAI API 빌링 안 씀.
      // 사이즈: Codex 지원값 1024x1536 (2:3) 으로 생성 후 4:5 프레임에 object-cover.
      const r = await fetch("/api/generate-image-codex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryAi,
          slideId,
          size: "1024x1536",
        }),
      });
      const data = await r.json();
      if (data.ok && data.image) {
        // 성공 시 사용량 카운터 +1 (실제 BRIQ 가 ChatGPT 구독으로 호출했으므로)
        incrementUsage("aiImage");
        onPick(data.image, { source: data.meta?.source ?? "codex", photographer: data.meta?.photographer });
        setOpen(false);
      } else {
        // Codex 인증 실패 등 — 사용자에게 안내, OpenAI API 폴백은 자동 안 함 (사용자 명시 의도)
        const code = data.code as string | undefined;
        const friendly =
          code === "CODEX_AUTH"
            ? "ChatGPT(Codex) 로그인 만료 — 터미널에서 `codex login` 후 재시도"
            : code === "CODEX_ENTITLEMENT"
              ? "ChatGPT Plus/Pro 구독 + 이미지 생성 권한이 필요해요"
              : code === "CODEX_NOT_INSTALLED"
                ? "Codex CLI 미설치 — 설치 후 `codex login`"
                : data.error || "이미지 생성 실패";
        setErr(friendly);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "이미지 생성 실패");
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (q?: string, opts?: { page?: number }) => {
    const query = (q ?? querySearch).trim();
    if (!query) return;
    const page = opts?.page ?? 1;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/search-pexels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          orientation: "portrait",
          returnCandidates: true,
          candidateCount: 6,
          // 한 페이지 24장 받아서 인물 페널티로 필터 후 상위 6장만 노출
          perPage: 24,
          page,
          // 인물 사진 페널티 — 사용자가 명시적으로 켜지 않는 한 항상 OFF
          allowPeople,
          slideId,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        const list: Candidate[] =
          data.candidates && Array.isArray(data.candidates)
            ? data.candidates
            : data.image
              ? [{ url: data.image, alt: data.meta?.alt, photographer: data.meta?.photographer }]
              : [];
        setCandidates(list);
        setSearchPage(page);
        if (!list.length) setErr("결과가 없습니다. 다른 단어로 시도해 주세요.");
      } else {
        setErr(data.error || "검색 실패");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setBusy(false);
    }
  };

  const onUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("이미지 파일만 가능합니다.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr("8MB 이하 파일로 올려주세요.");
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onPick(dataUrl, { source: "upload" });
      setBusy(false);
      setOpen(false);
    };
    reader.onerror = () => {
      setErr("파일 읽기 실패");
      setBusy(false);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="absolute top-2 left-2 z-10">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && mode === "search" && candidates.length === 0) {
            runSearch();
          }
        }}
        aria-label="이미지 바꾸기"
        title="이미지 바꾸기"
        className="h-8 w-8 grid place-items-center rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm"
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-10 left-0 w-[320px] sm:w-[380px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]"
          >
            {/* 탭 */}
            <div className="flex items-stretch border-b border-zinc-200 dark:border-zinc-800">
              <Tab active={mode === "search"} onClick={() => setMode("search")} icon={Search}>
                사진 검색
              </Tab>
              <Tab active={mode === "ai"} onClick={() => setMode("ai")} icon={Sparkles} lock={!aiAllowed}>
                ChatGPT 생성
              </Tab>
              <Tab active={mode === "upload"} onClick={() => setMode("upload")} icon={Upload}>
                업로드
              </Tab>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto px-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="닫기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4">
              {mode === "search" && (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runSearch();
                    }}
                    className="flex items-baseline gap-2 border-b border-zinc-300 dark:border-zinc-700 pb-2"
                  >
                    <input
                      value={querySearch}
                      onChange={(e) => setQuerySearch(e.target.value)}
                      placeholder="검색어"
                      className="flex-1 bg-transparent outline-none text-[13px]"
                    />
                    <button
                      type="submit"
                      disabled={busy || !querySearch.trim()}
                      className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                    >
                      {busy ? "찾는 중…" : "검색"}
                    </button>
                  </form>

                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {candidates.length === 0 && !busy && (
                      <div className="col-span-3 py-8 text-center text-[11px] text-zinc-400">
                        검색어를 적고 엔터 — 6장 후보가 뜹니다.
                      </div>
                    )}
                    {busy && candidates.length === 0 && (
                      <div className="col-span-3 py-8 text-center text-[11px] text-zinc-400">
                        Pexels 에서 찾는 중…
                      </div>
                    )}
                    {candidates.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          onPick(c.url, { source: "pexels", photographer: c.photographer });
                          setOpen(false);
                        }}
                        className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 overflow-hidden hover:ring-2 hover:ring-zinc-900 dark:hover:ring-zinc-100 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 transition-all"
                      >
                        <img src={c.url} alt={c.alt ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    {candidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => runSearch(undefined, { page: searchPage + 1 })}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                      >
                        <RefreshCw className="h-3 w-3" />
                        다른 컷 보기
                      </button>
                    )}
                    <label className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPeople}
                        onChange={(e) => {
                          setAllowPeople(e.target.checked);
                          // 토글 바뀌면 즉시 재검색
                          setTimeout(() => runSearch(undefined, { page: 1 }), 0);
                        }}
                        className="h-3 w-3 accent-zinc-900 dark:accent-zinc-100"
                      />
                      인물 사진도 보기
                    </label>
                  </div>
                </div>
              )}

              {mode === "ai" && (
                <div>
                  <div className="editorial-label mb-1.5">AI 생성 프롬프트</div>
                  <textarea
                    value={queryAi}
                    onChange={(e) => setQueryAi(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 p-2.5 text-[12.5px] leading-relaxed outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
                    placeholder="이 슬라이드에 어울리는 한 컷을 한국어 또는 영어로 묘사"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      텍스트 없는 이미지가 생성됩니다 (자막은 별도 오버레이).
                    </span>
                    <button
                      type="button"
                      onClick={runAi}
                      disabled={busy || !queryAi.trim()}
                      className="text-[10px] tracking-[0.15em] uppercase bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 h-7 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 transition-colors"
                    >
                      {busy ? "그리는 중…" : "생성 →"}
                    </button>
                  </div>
                </div>
              )}

              {mode === "upload" && (
                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="w-full aspect-[4/5] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors grid place-items-center disabled:opacity-50"
                  >
                    <div className="text-center">
                      <Upload className="h-5 w-5 mx-auto text-zinc-400" />
                      <div className="mt-3 text-[12.5px] text-zinc-700 dark:text-zinc-300">
                        {busy ? "올리는 중…" : "이미지 파일 선택"}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-400">PNG · JPG · WebP · 최대 8MB</div>
                    </div>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onUploadChange}
                    className="hidden"
                  />
                </div>
              )}

              {err && (
                <div className="mt-3 text-[11px] text-rose-600 dark:text-rose-400">
                  {err}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 플랜 잠금 / 한도 도달 모달 */}
      <FeatureLockedModal
        open={showLockedModal}
        feature="ai-image:generate"
        onClose={() => setShowLockedModal(false)}
      />
      <LimitReachedModal
        open={showLimitModal}
        kind="aiImage"
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon: Icon,
  children,
  lock,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  children: React.ReactNode;
  lock?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={lock ? "Pro 부터 사용 가능" : undefined}
      className={`flex items-center gap-1.5 px-3 h-9 text-[11px] tracking-[0.05em] transition-colors border-b-2 ${
        active
          ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      <Icon className="h-3 w-3" />
      {children}
      {lock && <Lock className="h-2.5 w-2.5 text-zinc-400 ml-0.5" />}
    </button>
  );
}

// 캡션에서 검색용 키워드 뽑기 — Pexels 는 영문 검색이라 한국어 토큰 그대로 보내면
// 인물 사진이 잔뜩 떨어진다. 핵심 명사만 영문 매핑 + 매거진 톤 모디파이어 강제.
const KOR_TO_EN: Record<string, string> = {
  봄나물: "spring greens",
  두릅: "fatsia sprouts",
  곰취: "wild greens",
  산마늘: "wild garlic leaf",
  나물: "korean herbs",
  코스: "course meal",
  한정식: "korean fine dining",
  점심: "lunch table",
  저녁: "dinner table",
  메뉴: "menu plate",
  시그니처: "signature dish",
  자리: "restaurant interior empty",
  가게: "small restaurant interior",
  카페: "specialty cafe interior",
  새벽: "early morning light",
  창: "window light",
  데치는: "blanching greens",
  어버이날: "family dinner table",
  봄: "spring season",
  여름: "summer season",
  가을: "autumn season",
  겨울: "winter season",
  예약: "empty reserved table",
  영업: "open shop sign",
};

const INDUSTRY_FALLBACK: Record<string, string> = {
  restaurant: "korean fine dining still life",
  cafe: "specialty cafe minimal still life",
  beauty: "korean skincare minimal still life",
  fitness: "minimal gym interior",
  stay: "warm hanok stay interior",
  local: "neighborhood shop still life",
  dessert: "korean dessert tablescape",
};

const EDITORIAL_TAIL =
  "editorial magazine, natural window light, soft warm tone, shallow depth of field, candid, film aesthetic, no people";

function captionToSearchQuery(caption: string, industry?: string): string {
  const tokens = caption
    .replace(/\n/g, " ")
    .replace(/[·.,!?"'()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const mapped: string[] = [];
  for (const t of tokens) {
    const stripped = t.replace(/[은는이가을를도에의로으로와과만]$/u, "");
    if (KOR_TO_EN[stripped]) mapped.push(KOR_TO_EN[stripped]);
    else if (KOR_TO_EN[t]) mapped.push(KOR_TO_EN[t]);
  }

  const scene = industry ? INDUSTRY_FALLBACK[industry] ?? "" : "";
  const subject =
    mapped.length > 0 ? Array.from(new Set(mapped)).slice(0, 3).join(", ") : scene;
  return [subject, EDITORIAL_TAIL].filter(Boolean).join(", ");
}

// AI 생성용 프롬프트 — 톤·결 힌트 자동 부여
function captionToAiPrompt(caption: string): string {
  const cleaned = caption.replace(/\n/g, " ").trim();
  return `Editorial magazine photography, ${cleaned}, natural window light, warm muted color, shallow depth of field, real Korean restaurant aesthetic, candid moment, no text, no signage, no people faces, leave negative space for overlay caption, shot on Sony A7 with 50mm lens.`;
}
