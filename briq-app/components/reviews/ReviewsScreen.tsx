"use client";

import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

// 브랜드별 BRIQ 자동 답변 톤
const REPLY_TEMPLATES: Record<string, Record<"regular" | "new" | "difficult", string>> = {
  miokdang: {
    regular: "늘 어머님과 함께 찾아주셔서 감사합니다. 두릅무침은 양평 시장에서 새벽에 골라온 것이라 더 마음이 갑니다. 다음달엔 여름 정식이 시작되니, 그때 또 모시고 싶어요. — 미옥당 허은애 드림",
    new: "미옥당에 처음 방문해 주셔서 감사합니다. 친구분께서 좋아하셨다니 다행입니다. 다음번에는 봄 정식 코스를 추천드립니다.",
    difficult: "고객님, 미옥당 허은애입니다. 저희 한정식이 기대에 못 미치셨다니 정중히 사과드립니다. 8만원 코스는 9가지 요리와 직접 담근 장으로 책정되었음을 양해 부탁드립니다.",
  },
  "roastery-1985": {
    regular: "오늘도 와주셔서 감사합니다. 다음주에 신상 원두 들어와요 — 케냐 AA. 미리 한 잔 빼두겠습니다. 바리스타 김민준 드림",
    new: "1985에 첫 방문 감사드려요. 다음번엔 에티오피아 예가체프 한 번 드셔보세요. 산미가 부담스러우시면 콜드브루도 추천드립니다.",
    difficult: "고객님, 매장이 시끄러웠다니 죄송합니다. 주말 14~16시는 다소 붐비는 시간이에요. 평일 오전이나 19시 이후가 한적합니다. 다음번엔 더 조용한 자리로 안내해드릴게요.",
  },
  "seochon-stay": {
    regular: "부모님 모시고 와주셔서 감사합니다. 다음번 방문 시 마당 쪽 객실로 안내해드릴게요. 5월엔 모란이 핍니다.",
    new: "Thank you for visiting our hanok stay. We're glad your friend enjoyed the morning light. Please come again — we have a new tea ceremony program in June.",
    difficult: "주차 불편함을 겪으셔서 죄송합니다. 한옥 마을 특성상 골목 주차장만 이용 가능합니다. 다음번엔 미리 전화 주시면 자리를 비워두겠습니다.",
  },
  "dolce-dessert": {
    regular: "또 와주셔서 감사해요!! 따님이 좋아하는 딸기 케이크 이번주에도 굽고 있어요. 토요일 오전 11시쯤이 가장 신선해요 🍓",
    new: "수박 케이크 좋아해주셔서 감사합니다 🍉 다음주엔 망고 빙수가 출시돼요. 인스타 알림 설정해두시면 신상 소식 먼저 받으실 수 있어요.",
    difficult: "주말 대기가 길어서 죄송해요 ㅠㅠ 평일 오후 3~5시는 비교적 한가해요. 다음번엔 미리 톡 주시면 따로 빼둘게요!",
  },
  "luna-hair": {
    regular: "단골 ★ 항상 감사합니다. 다음 예약 때는 5월 봄 컬러 한 번 추천드려도 될까요? 결에 맞는 톤으로 골라드릴게요.",
    new: "처음 방문 감사드립니다. 결이 살아났다니 다행이에요. 다음번엔 컬도 한 번 시도해보시는 거 추천드려요.",
    difficult: "예약 시간이 늦어진 점 정말 죄송합니다. 다음 예약 때는 5분 일찍 안내해드리고, 대기하시는 동안 차 한 잔 준비해두겠습니다.",
  },
  "forum-fashion": {
    regular: "단골 고객님께 감사드립니다. S/S 26 룩북에 새로 들어온 라인 미리 보내드릴까요? DM 주시면 디테일 컷 공유드립니다.",
    new: "FORUM 첫 방문 감사드립니다. 사이즈가 한 단계 큰 게 더 잘 맞으실 수도 있어요. 다음 컬렉션부터 핏 가이드를 사이즈 별로 제공할 예정입니다.",
    difficult: "고객님, 불편을 드려 죄송합니다. 자세한 사항을 DM으로 알려주시면 즉시 확인드리겠습니다.",
  },
};

const PLATFORMS = ["네이버", "구글", "배민", "요기요", "카카오"];

const KPIS_BY_BRAND: Record<string, { label: string; value: string; delta: string; danger?: boolean }[]> = {
  miokdang: [
    { label: "이번달 리뷰", value: "147", delta: "+34%" },
    { label: "자동 답변", value: "132", delta: "90%" },
    { label: "평균 별점", value: "4.7", delta: "★★★★★" },
    { label: "검토 대기", value: "3", delta: "진상 의심", danger: true },
    { label: "평균 답변 시간", value: "2.4m", delta: "↓ 87%" },
  ],
  "roastery-1985": [
    { label: "이번달 리뷰", value: "84", delta: "+21%" },
    { label: "자동 답변", value: "78", delta: "93%" },
    { label: "평균 별점", value: "4.8", delta: "★★★★★" },
    { label: "검토 대기", value: "1", delta: "주말 소음", danger: true },
    { label: "평균 답변 시간", value: "1.8m", delta: "↓ 91%" },
  ],
  "seochon-stay": [
    { label: "이번달 리뷰", value: "62", delta: "+18%" },
    { label: "자동 답변", value: "58", delta: "94%" },
    { label: "평균 별점", value: "4.9", delta: "★★★★★" },
    { label: "검토 대기", value: "1", delta: "주차 문의" },
    { label: "평균 답변 시간", value: "3.1m", delta: "↓ 82%" },
  ],
  "dolce-dessert": [
    { label: "이번달 리뷰", value: "218", delta: "+47%" },
    { label: "자동 답변", value: "196", delta: "90%" },
    { label: "평균 별점", value: "4.8", delta: "★★★★★" },
    { label: "검토 대기", value: "5", delta: "대기시간 컴플레인", danger: true },
    { label: "평균 답변 시간", value: "1.4m", delta: "↓ 93%" },
  ],
  "luna-hair": [
    { label: "이번달 리뷰", value: "112", delta: "+28%" },
    { label: "자동 답변", value: "104", delta: "93%" },
    { label: "평균 별점", value: "4.6", delta: "★★★★☆" },
    { label: "검토 대기", value: "2", delta: "예약 지연" },
    { label: "평균 답변 시간", value: "2.1m", delta: "↓ 88%" },
  ],
  "forum-fashion": [
    { label: "이번달 리뷰", value: "58", delta: "+12%" },
    { label: "자동 답변", value: "52", delta: "90%" },
    { label: "평균 별점", value: "4.7", delta: "★★★★★" },
    { label: "검토 대기", value: "0", delta: "정상" },
    { label: "평균 답변 시간", value: "2.8m", delta: "↓ 84%" },
  ],
};

export function ReviewsScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const reviews = detail?.reviews ?? [];
  const replies = REPLY_TEMPLATES[brand.id] ?? REPLY_TEMPLATES.miokdang;
  const kpis = KPIS_BY_BRAND[brand.id] ?? KPIS_BY_BRAND.miokdang;

  const TYPE_LABEL: Record<typeof reviews[number]["type"], string> = {
    regular: "★ 단골",
    new: "신규",
    difficult: "⚠ 진상 의심",
  };
  const TYPE_TONE: Record<typeof reviews[number]["type"], "emerald" | "sky" | "rose"> = {
    regular: "emerald",
    new: "sky",
    difficult: "rose",
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
          REVIEW AUTO-RESPONSE · {brand.name}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">리뷰 자동 답변</h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          네이버 · 구글 · 배민 · 요기요 후기를 한 곳에서. {brand.name} 톤 메모리로 답변하고 진상/단골 자동 분류합니다.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{k.label}</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <div className={`text-xl font-semibold tabular-nums ${k.danger ? "text-rose-600" : ""}`}>{k.value}</div>
              <div className={`text-[11px] font-medium ${k.danger ? "text-rose-600" : "text-emerald-600"}`}>{k.delta}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{brand.name} 최근 리뷰 · {reviews.length}건</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            {PLATFORMS.map((p) => (
              <span key={p}>{p}</span>
            )).reduce<React.ReactNode[]>((acc, cur, i) => {
              if (i > 0) acc.push(<span key={`d-${i}`} className="text-zinc-300">·</span>);
              acc.push(cur);
              return acc;
            }, [])}
          </div>
        </div>
        <AnimatePresence mode="popLayout">
          <ul key={brand.id} className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reviews.map((r, i) => (
              <motion.li
                key={`${brand.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 grid place-items-center text-white text-[11px] font-bold shrink-0">
                    {r.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{r.author}</span>
                      <Badge tone="default">{PLATFORMS[i % PLATFORMS.length]}</Badge>
                      <span className="text-amber-500 text-xs">
                        {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
                      </span>
                      <Badge tone={TYPE_TONE[r.type]} className="ml-auto">
                        {TYPE_LABEL[r.type]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{r.body}</p>
                    <div
                      className={`mt-3 rounded-lg p-3 border ${
                        TYPE_TONE[r.type] === "emerald"
                          ? "border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-500/5"
                          : TYPE_TONE[r.type] === "sky"
                          ? "border-sky-100 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-500/5"
                          : "border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-500/5"
                      }`}
                    >
                      <div
                        className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${
                          TYPE_TONE[r.type] === "emerald"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : TYPE_TONE[r.type] === "sky"
                            ? "text-sky-700 dark:text-sky-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        BRIQ 자동 답변 · {brand.name} 톤 v{brand.toneVersion}
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line">{replies[r.type]}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => toast.success(`${r.author} 고객님께 답변 발송됨`)}
                        >
                          승인 후 발송
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => toast.info(`${brand.name} 톤으로 답변 다시 생성됨`)}
                        >
                          다시 생성
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </Card>
    </div>
  );
}
