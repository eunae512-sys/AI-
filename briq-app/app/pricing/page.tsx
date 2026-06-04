"use client";

// /pricing — 3티어 가격 페이지 (매거진 톤).
//
// 핵심 구조:
//   · 헤더 — Cormorant Italic 헤드라인 + 연간/월간 토글
//   · 산업별 추천 (사장님 셀렉터)
//   · 4 카드 가격 매트릭스 (Free / Pro / Studio / Agency)
//   · ROI 비교 (외주 vs BRIQ)
//   · FAQ + 부가 수익원 안내
//   · 결제 안내 (Toss 진입 자리)

import * as React from "react";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";
import { LandingNav } from "@/components/landing/Nav";
import { PLANS, ANNUAL_DISCOUNT, INDUSTRY_RECOMMEND, formatKrw, type Plan } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import { SAGE, HL } from "@/lib/landing/tokens";

// 한글 강조 — 이탤릭(가짜 기울임) 금지. Hero/온보딩과 동일한 크림 하이라이트 결.
function Hi({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="absolute inset-x-[-2px] bottom-[4px] sm:bottom-[8px] h-[10px] sm:h-[16px] -z-0"
        style={{ background: HL, opacity: 0.9 }}
      />
    </span>
  );
}

type Cycle = "monthly" | "annual";

// 플랜 카드 / 마지막 CTA 가 가야 할 경로를 결정.
// - Free → 그대로 /onboarding (로그인 없이 데모)
// - Agency → 그대로 /contact (영업 미팅)
// - Pro/Studio → /billing/start?plan=...&cycle=...
//   /billing/start 가 서버에서 로그인 체크 후 비로그인이면 /login?next=... 으로 보냄.
function ctaHrefFor(plan: Plan, cycle: Cycle): string {
  if (plan.id === "free") return plan.cta.href;
  if (plan.id === "agency") return plan.cta.href;
  return `/billing/start?plan=${plan.id}&cycle=${cycle}`;
}

const INDUSTRY_OPTIONS: { id: keyof typeof INDUSTRY_RECOMMEND; label: string }[] = [
  { id: "restaurant", label: "식당·한식당" },
  { id: "cafe", label: "카페" },
  { id: "beauty", label: "미용실" },
  { id: "dessert", label: "디저트·공방" },
  { id: "stay", label: "숙소·한옥스테이" },
  { id: "local", label: "소품샵·패션" },
];

export default function PricingPage() {
  const [cycle, setCycle] = React.useState<Cycle>("monthly");
  const [industry, setIndustry] = React.useState<keyof typeof INDUSTRY_RECOMMEND>("restaurant");
  const recommended = INDUSTRY_RECOMMEND[industry];

  return (
    <>
      <LandingNav />
      <main className="pt-20 bg-[color:var(--bg)] min-h-screen">
        {/* 헤더 */}
        <section className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10 sm:pb-12">
          <div className="editorial-label">Pricing · 가격</div>
          <h1
            className="mt-4 text-[36px] sm:text-[52px] md:text-[64px] leading-[0.95] tracking-[-0.02em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            디자이너 외주 1편 비용으로,
            <br />
            <Hi>한 달 무한 발행.</Hi>
          </h1>
          <p className="mt-6 max-w-[640px] text-[15px] leading-[1.65] text-zinc-600 dark:text-zinc-400">
            카드뉴스 만들고, 캡션 쓰고, 해시태그 고르고, 네이버 블로그 본문까지 — 매주 6-8시간 걸리던 일이 10분으로.
            14일 무료 체험 후 결정하세요. 체험 종료 전 언제든 해지 가능합니다.
          </p>

          {/* 결제 주기 토글 */}
          <div className="mt-10 inline-flex border border-zinc-200 dark:border-zinc-800 p-1">
            {(["monthly", "annual"] as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={cn(
                  "px-5 py-2 text-[12px] tracking-[0.08em] uppercase transition-colors",
                  cycle === c
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                {c === "monthly" ? "월간 결제" : "연간 결제"}
                {c === "annual" && (
                  <span className="ml-2 text-[10px]" style={{ color: SAGE }}>−{Math.round(ANNUAL_DISCOUNT * 100)}%</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 산업별 추천 */}
        <section className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 py-10 border-y border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-4">
            <div>
              <div className="editorial-label">사장님 산업</div>
              <p className="mt-1 text-[12px] text-zinc-500">선택하시면 맞춤 플랜을 추천드립니다</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIndustry(opt.id)}
                  className={cn(
                    "px-3 h-8 text-[11.5px] border transition-colors",
                    industry === opt.id
                      ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 text-[13px] text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-500">추천 플랜 →</span>{" "}
            <span
              className="text-zinc-900 dark:text-zinc-100"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "20px", fontWeight: 500 }}
            >
              {PLANS.find((p) => p.id === recommended.plan)?.name}
            </span>
            <span className="ml-3 text-zinc-500">— {recommended.reason}</span>
          </div>
        </section>

        {/* 가격 카드 4개 */}
        <section className="max-w-[1380px] mx-auto px-5 sm:px-10 md:px-14 pt-12 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                isRecommended={recommended.plan === plan.id}
              />
            ))}
          </div>
          <p className="mt-6 text-[11px] text-zinc-400 text-center">
            VAT 포함. 결제는 Toss Payments 로 안전하게 진행됩니다.
          </p>
          <p
            className="mt-1.5 text-[11px] text-center"
            style={{ color: "#4A4742", fontFamily: "'Nanum Myeongjo', serif" }}
          >
            14일 무료체험 시작 시 카드 등록이 필요합니다. 체험 종료 전 해지 시 청구되지 않습니다.
          </p>
        </section>

        {/* ROI 비교 — 외주 vs BRIQ */}
        <section className="bg-zinc-50/60 dark:bg-zinc-950/60 border-y border-zinc-200 dark:border-zinc-800 py-16">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14">
            <div className="editorial-label">ROI · 가성비</div>
            <h2
              className="mt-3 text-[32px] sm:text-[40px] leading-[1] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
            >
              디자이너 외주 1편 비용으로,
              <br />
              <Hi>한 달 무한 발행.</Hi>
            </h2>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 외주 */}
              <div className="border border-zinc-200 dark:border-zinc-800 p-7 bg-white dark:bg-zinc-950">
                <div className="editorial-label">외주 · 직접 운영</div>
                <h3 className="mt-3 text-[24px] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                  월 ₩400,000-700,000
                </h3>
                <ul className="mt-6 space-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
                  <CostRow label="카드뉴스 디자이너 (편당)" value="₩50,000-100,000" />
                  <CostRow label="네이버 블로그 본문 외주 (편당)" value="₩70,000-150,000" />
                  <CostRow label="8개 채널 변환 시간" value="6-8h / 캠페인" />
                  <CostRow label="발행 일정 관리" value="매일 20분" />
                </ul>
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-900 text-[12px] text-zinc-500">
                  사장님 직접 운영 시 → 매주 6-8시간 소모
                </div>
              </div>

              {/* BRIQ Pro */}
              <div className="border-2 border-zinc-900 dark:border-zinc-100 p-7 bg-white dark:bg-zinc-950">
                <div className="editorial-label">BRIQ Pro</div>
                <h3 className="mt-3 text-[24px] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                  월 ₩49,000
                </h3>
                <ul className="mt-6 space-y-2 text-[13px] text-zinc-700 dark:text-zinc-300">
                  <CostRow label="카드뉴스 7컷 자동 생성" value="무제한" emerald />
                  <CostRow label="네이버 블로그 본문 (1500+자)" value="월 8편" emerald />
                  <CostRow label="8 채널 자동 변환" value="10초 / 캠페인" emerald />
                  <CostRow label="발행 자동화 (Webhook · 수동)" value="원클릭" emerald />
                </ul>
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-900 text-[12px]" style={{ color: SAGE }}>
                  10배 가성비 · 매주 6시간 절약 = 한 달 24시간
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 부가 수익원 / 애드온 */}
        <section className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 py-16">
          <div className="editorial-label">Add-on · 부가 옵션</div>
          <h2
            className="mt-3 text-[28px] sm:text-[36px] leading-tight tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            필요할 때만, 한도 초과 시
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-y border-zinc-200 dark:border-zinc-800">
            <AddonCell
              label="ChatGPT 이미지 추가"
              price="₩9,000 / 100장"
              note="Pro 의 월 50장 초과 시. 1장당 약 ₩90."
            />
            <AddonCell
              label="추가 브랜드"
              price="₩19,000 / 브랜드 · 월"
              note="Pro 가입자가 2번째 매장 추가할 때."
            />
            <AddonCell
              label="카카오 알림톡"
              price="₩9 / 건"
              note="자동 응답·예약 알림 발송. Studio 부터 포함."
            />
            <AddonCell
              label="첫 셋업 컨설팅"
              price="₩99,000 / 1회"
              note="3시간 줌, BRIQ 셋업 + 브랜드 톤 정의."
            />
            <AddonCell
              label="PDF 매거진 인쇄본"
              price="₩29,000 / 권"
              note="클라이언트·지인 선물용 종이 책자 (월 1회)."
            />
            <AddonCell
              label="산업별 카피 라이브러리"
              price="₩59,000 / 1회"
              note="그 산업 검증 카피 500문장 묶음 구매."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-zinc-50/60 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 py-16">
          <div className="max-w-[860px] mx-auto px-5 sm:px-10">
            <div className="editorial-label">FAQ · 자주 묻는 질문</div>
            <div className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
              <FaqRow q="14일 체험 후 자동 결제되나요?">
                아니요. 체험 종료 3일 전 메일로 안내드리고, 사장님이 직접 결제를 선택하신 후에만 청구됩니다. 자동 결제 X.
              </FaqRow>
              <FaqRow q="중간에 해지하면 환불되나요?">
                결제 후 7일 이내는 100% 환불. 그 이후엔 남은 일수 기준 일할 환불 가능합니다.
              </FaqRow>
              <FaqRow q="브랜드를 여러 개 운영하려면?">
                Pro 는 브랜드 1개 한도. 추가 브랜드는 ₩19,000/월 또는 Studio (10개 포함) 권장.
              </FaqRow>
              <FaqRow q="ChatGPT 구독이 따로 필요한가요?">
                아니요. Pro 이상은 BRIQ 가 ChatGPT 이미지 생성 한도를 제공합니다 (Pro 50장 / Studio 300장 / Agency 무제한).
              </FaqRow>
              <FaqRow q="인스타그램 자동 발행이 되나요?">
                Studio 이상에서 Instagram Graph API 직결 발행 지원. Pro 는 Webhook (Make/Zapier) 위임 또는 수동 발행 (클립보드 + 새 탭 자동 오픈) 으로 운영하실 수 있습니다.
              </FaqRow>
              <FaqRow q="세금계산서·현금영수증 발급되나요?">
                네. 사업자등록증으로 가입하시면 세금계산서, 개인사장님은 현금영수증(소득공제용) 자동 발급됩니다.
              </FaqRow>
            </div>
          </div>
        </section>

        {/* 마지막 CTA */}
        <section className="max-w-[860px] mx-auto px-5 sm:px-10 py-20 text-center">
          <h2
            className="text-[36px] sm:text-[44px] leading-[1] tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            오늘 가입하고,
            <br />
            <Hi>내일 첫 카드뉴스를 발행하세요.</Hi>
          </h2>
          <p className="mt-5 text-[14px] text-zinc-600 dark:text-zinc-400">
            카드 등록 후 14일 무료 체험. 체험 종료 전 해지하시면 청구되지 않습니다.
          </p>
          <Link
            href={`/billing/start?plan=pro&cycle=${cycle}`}
            className="mt-8 inline-block px-8 h-12 leading-[3rem] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13.5px] tracking-[0.02em] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            14일 무료체험 시작 →
          </Link>
        </section>
      </main>
    </>
  );
}

// ─── 가격 카드 ─────────────────────────────────────────────────────────────

function PlanCard({ plan, cycle, isRecommended }: { plan: Plan; cycle: Cycle; isRecommended: boolean }) {
  const isAgency = plan.id === "agency";
  const isFree = plan.id === "free";
  const monthlyPrice = cycle === "annual" ? plan.priceAnnualMonthly : plan.priceMonthly;
  const isHighlighted = plan.badge === "가장 많이 선택" || isRecommended;

  return (
    <article
      className={cn(
        "border bg-white dark:bg-zinc-950 flex flex-col relative",
        isHighlighted
          ? "border-zinc-900 dark:border-zinc-100 shadow-[0_12px_32px_-24px_rgba(20,19,15,0.20)]"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      {/* 추천 뱃지 */}
      {(plan.badge || isRecommended) && (
        <div
          className="absolute -top-3 left-5 px-2.5 py-0.5 text-[10px] tracking-[0.12em] uppercase text-white"
          style={{ background: isRecommended ? SAGE : "#14130F" }}
        >
          {isRecommended ? "사장님께 추천" : plan.badge}
        </div>
      )}

      <header className="px-6 pt-7 pb-5 border-b border-zinc-100 dark:border-zinc-900">
        <div className="editorial-label">{plan.name}</div>
        {/* 태그라인은 한글 — 이탤릭(가짜 기울임) 금지. 명조 정자로. */}
        <h3
          className="mt-2 text-[19px] tracking-tight"
          style={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          {plan.tagline}
        </h3>

        <div className="mt-5 flex items-baseline gap-1.5">
          {isFree ? (
            <span className="text-[38px] tabular-nums tracking-tight font-medium">₩0</span>
          ) : isAgency ? (
            <span className="text-[22px] text-zinc-700 dark:text-zinc-300">요청 견적</span>
          ) : (
            <>
              <span className="text-[14px] text-zinc-500">₩</span>
              <span className="text-[38px] tabular-nums tracking-tight font-medium">{formatKrw(monthlyPrice)}</span>
              <span className="text-[12px] text-zinc-500"> / 월</span>
            </>
          )}
        </div>
        {!isFree && !isAgency && cycle === "annual" && (
          <div className="mt-1 text-[11px]" style={{ color: SAGE }}>
            연간 결제 — 월 ₩{formatKrw(plan.priceMonthly - plan.priceAnnualMonthly)} 절약
          </div>
        )}
        {isAgency && (
          <div className="mt-1 text-[11px] text-zinc-500">시작가 월 ₩{formatKrw(plan.priceMonthly)} —</div>
        )}

        <Link
          href={ctaHrefFor(plan, cycle)}
          className={cn(
            "mt-6 block text-center h-11 leading-[2.75rem] text-[12.5px] tracking-[0.02em] font-medium transition-colors",
            isHighlighted
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              : "border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900",
          )}
        >
          {plan.cta.label}
        </Link>
      </header>

      <ul className="px-6 py-6 space-y-2.5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px]">
            {f.included ? (
              <Check className="h-3.5 w-3.5 shrink-0 mt-[3px]" style={{ color: SAGE }} />
            ) : (
              <X className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 shrink-0 mt-[3px]" />
            )}
            <div className={cn("leading-[1.5]", !f.included && "text-zinc-400 dark:text-zinc-600")}>
              <span className={cn(f.included ? "text-zinc-800 dark:text-zinc-200" : "")}>{f.label}</span>
              {f.detail && f.included && (
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-500">{f.detail}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ─── 작은 컴포넌트들 ───────────────────────────────────────────────────────

function CostRow({ label, value, emerald }: { label: string; value: string; emerald?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1">
      <span>{label}</span>
      <span className={cn("tabular-nums", emerald ? "font-medium" : "text-zinc-500")} style={emerald ? { color: SAGE } : undefined}>
        {value}
      </span>
    </li>
  );
}

function AddonCell({ label, price, note }: { label: string; price: string; note: string }) {
  return (
    <div className="p-6 border-r border-b border-zinc-200 dark:border-zinc-800 last:border-r-0">
      <div className="editorial-label">{label}</div>
      <div className="mt-3 text-[20px] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
        {price}
      </div>
      <p className="mt-3 text-[12px] text-zinc-500 leading-relaxed">{note}</p>
    </div>
  );
}

function FaqRow({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group"
    >
      <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
        <span className="text-[14.5px] tracking-tight text-zinc-900 dark:text-zinc-100">{q}</span>
        <span className="text-zinc-400">
          {open ? <Minus className="h-4 w-4" /> : <span className="text-[18px] leading-none">+</span>}
        </span>
      </summary>
      <div className="pb-5 text-[13.5px] leading-[1.7] text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </details>
  );
}
