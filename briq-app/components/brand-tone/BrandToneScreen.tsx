"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrand } from "@/components/brand/BrandProvider";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

// 브랜드별 5축 톤 슬라이더 값 (0~100, 왼쪽 끝 = leftLabel 우세)
const SLIDERS_BY_BRAND: Record<string, { axis: string; value: number; note: string }[]> = {
  miokdang: [
    { axis: "단정함 ↔ 친근함", value: 18, note: "단정 우세 · 4.1 / 5" },
    { axis: "전통 ↔ 모던", value: 24, note: "전통 우세 · 3.8 / 5" },
    { axis: "감성적 ↔ 정보형", value: 10, note: "감성 우세 · 4.5 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 50, note: "중립 · 3.0 / 5" },
    { axis: "존댓말 ↔ 반말", value: 0, note: "존댓말 100%" },
  ],
  "roastery-1985": [
    { axis: "단정함 ↔ 친근함", value: 62, note: "친근 우세 · 3.6 / 5" },
    { axis: "전통 ↔ 모던", value: 78, note: "모던 우세 · 4.2 / 5" },
    { axis: "감성적 ↔ 정보형", value: 55, note: "정보 약우세 · 3.1 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 30, note: "짧음 우세 · 4.0 / 5" },
    { axis: "존댓말 ↔ 반말", value: 18, note: "존댓말 우세 · 90%" },
  ],
  "seochon-stay": [
    { axis: "단정함 ↔ 친근함", value: 28, note: "단정 우세 · 3.9 / 5" },
    { axis: "전통 ↔ 모던", value: 16, note: "전통 우세 · 4.4 / 5" },
    { axis: "감성적 ↔ 정보형", value: 22, note: "감성 우세 · 4.0 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 60, note: "설명형 · 3.2 / 5" },
    { axis: "존댓말 ↔ 반말", value: 0, note: "존댓말 100%" },
  ],
  "dolce-dessert": [
    { axis: "단정함 ↔ 친근함", value: 82, note: "친근 우세 · 4.4 / 5" },
    { axis: "전통 ↔ 모던", value: 70, note: "모던 우세 · 3.9 / 5" },
    { axis: "감성적 ↔ 정보형", value: 38, note: "감성 우세 · 3.6 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 25, note: "짧음 우세 · 4.3 / 5" },
    { axis: "존댓말 ↔ 반말", value: 72, note: "반말 우세 · 80%" },
  ],
  "luna-hair": [
    { axis: "단정함 ↔ 친근함", value: 55, note: "균형 · 3.4 / 5" },
    { axis: "전통 ↔ 모던", value: 80, note: "모던 우세 · 4.3 / 5" },
    { axis: "감성적 ↔ 정보형", value: 40, note: "감성 약우세 · 3.4 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 28, note: "짧음 우세 · 4.1 / 5" },
    { axis: "존댓말 ↔ 반말", value: 22, note: "존댓말 우세 · 85%" },
  ],
  "forum-fashion": [
    { axis: "단정함 ↔ 친근함", value: 10, note: "단정 강우세 · 4.7 / 5" },
    { axis: "전통 ↔ 모던", value: 88, note: "모던 강우세 · 4.6 / 5" },
    { axis: "감성적 ↔ 정보형", value: 58, note: "정보 약우세 · 3.2 / 5" },
    { axis: "짧고 임팩트 ↔ 길고 설명형", value: 18, note: "짧음 강우세 · 4.4 / 5" },
    { axis: "존댓말 ↔ 반말", value: 0, note: "존댓말 100%" },
  ],
};

const BEFORE_AFTER: Record<string, { before: string; after: string }> = {
  miokdang: {
    before: "탁월한 풍미를 선사하는 미옥당의 봄나물 정식, 신선한 재료로 완벽하게 준비됩니다.",
    after: "한 입에 봄이 옵니다.\n새벽 4시 양평 시장에서 직접 담아 온\n두릅 · 머위 · 곰취.",
  },
  "roastery-1985": {
    before: "최고급 원두로 완벽하게 추출된 프리미엄 콜드브루를 만나보세요.",
    after: "오늘 새 원두가 도착했어요.\n에티오피아 예가체프.\n한 잔에 6시간을 들였습니다.",
  },
  "seochon-stay": {
    before: "고즈넉하고 럭셔리한 한옥에서 완벽한 휴식을 선사합니다.",
    after: "창호로 새벽 빛이 듭니다.\n마당의 시간이 천천히 흐르는,\n한옥에서의 하룻밤.",
  },
  "dolce-dessert": {
    before: "탁월한 풍미와 프리미엄 재료로 만든 최고의 케이크를 선사합니다.",
    after: "오늘 새로 구운 수박 케이크 🍉\n녹는 단 한 입,\n달콤 멈춤 주의.",
  },
  "luna-hair": {
    before: "프리미엄 시술로 완벽한 헤어를 선사합니다.",
    after: "결이 살아요.\n5월 봄 컬러,\n5초만에 광택이 돌아옵니다.",
  },
  "forum-fashion": {
    before: "최고급 원단으로 만든 프리미엄 컨템포러리 컬렉션을 선보입니다.",
    after: "S/S 26 LOOKBOOK.\nONE FABRIC, TWO WAYS.\n한 벌의 무게를 다시 생각합니다.",
  },
};

export function BrandToneScreen() {
  const { brand } = useBrand();
  const detail = getBrandDetail(brand.id);
  const sliders = SLIDERS_BY_BRAND[brand.id] ?? SLIDERS_BY_BRAND.miokdang;
  const example = BEFORE_AFTER[brand.id] ?? BEFORE_AFTER.miokdang;

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
          BRAND VOICE MEMORY · {brand.name} · v{brand.toneVersion}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
          {brand.name}의 말투를 기억합니다
        </h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          {brand.industryLabel} · 감성 · 톤 · 금지어 · 자주 쓰는 표현 · 업종 가이드. 모든 콘텐츠는 발행 전 일관성 검사를 거칩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold mb-1">톤 프로파일</h3>
          <p className="text-[11px] text-zinc-500 mb-4">{brand.name} · {brand.industryLabel} · 5점 척도 5축</p>
          <div className="space-y-4">
            {sliders.map((s, i) => (
              <div key={s.axis}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium">{s.axis}</span>
                  <span className="text-[11px] text-zinc-500">{s.note}</span>
                </div>
                <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <motion.div
                    key={`${brand.id}-${i}`}
                    initial={{ left: "50%" }}
                    animate={{ left: `calc(${s.value}% - 8px)` }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                    className="absolute -top-1 h-4 w-4 rounded-full bg-white border-2 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100 shadow"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">한 줄 요약 (AI 학습)</div>
            <p
              className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 italic"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              "{detail?.toneSummary ?? "톤 학습이 필요합니다."}"
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">🚫 금지어</h3>
          <p className="text-[11px] text-zinc-500 mb-4">발행 전 자동 차단</p>
          <div className="flex flex-wrap gap-1.5">
            {(detail?.forbiddenWords ?? []).map((w) => (
              <Badge key={w} tone="rose">{w}</Badge>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">자주 쓰는 좋은 표현</div>
            <div className="flex flex-wrap gap-1.5">
              {(detail?.preferredWords ?? []).map((w) => (
                <Badge key={w} tone="emerald">{w}</Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">BEFORE · GPT 기본</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 line-through whitespace-pre-line">
                {example.before}
              </p>
            </div>
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-500/5 p-4"
            >
              <div className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
                AFTER · {brand.name} v{brand.toneVersion}
              </div>
              <p
                className="mt-2 text-sm leading-relaxed font-medium whitespace-pre-line"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {example.after}
              </p>
            </motion.div>
          </div>
        </Card>
      </div>
    </div>
  );
}
