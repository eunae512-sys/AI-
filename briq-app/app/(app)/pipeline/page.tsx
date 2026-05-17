import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";

export const metadata = { title: "BRIQ · Content Pipeline" };

const STAGES = [
  { label: "Drafting", count: 4, note: "직원이 작성 중 — 30분 안에 검토 가능" },
  { label: "Awaiting review", count: 3, note: "사장님 확인 부탁드려요" },
  { label: "Approved", count: 5, note: "발행 예약 큐로 이동됨" },
  { label: "Live", count: 21, note: "이번 달 발행 완료" },
];

const DIRECT_EDIT = [
  { href: "/cardnews", label: "카드뉴스 직접 편집" },
  { href: "/reels", label: "릴스 직접 편집" },
  { href: "/blog", label: "블로그 직접 작성" },
  { href: "/shorts", label: "쇼츠 직접 편집" },
  { href: "/threads", label: "쓰레드 직접 작성" },
];

export default function PipelinePage() {
  return (
    <>
      <Topbar title="Content Pipeline" breadcrumb="작성 → 검토 → 발행" />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        <header className="pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="editorial-label">Production line</div>
          <h1
            className="mt-3 text-[32px] sm:text-[44px] leading-[0.98] tracking-[-0.02em] font-medium"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            오늘 만들고 있는 것
          </h1>
          <p className="mt-4 max-w-[560px] text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            BRIQ 가 매일 가게의 콘텐츠를 자동으로 준비합니다. 사장님은 단계별 상태를 확인하고 승인만 누르시면 됩니다.
          </p>
        </header>

        <section className="pt-12">
          <div className="editorial-label mb-4">Stages</div>
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {STAGES.map((s, i) => (
              <li key={s.label} className="grid grid-cols-12 items-baseline gap-3 py-4">
                <div className="col-span-1 editorial-label tabular-nums">{String(i + 1).padStart(2, "0")}</div>
                <div className="col-span-3 text-[15px] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>{s.label}</div>
                <div className="col-span-2 text-[28px] tabular-nums" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                  {s.count}
                </div>
                <div className="col-span-6 text-[12.5px] text-zinc-500 dark:text-zinc-500 italic" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  {s.note}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pt-16">
          <div className="editorial-label mb-4">사장님이 직접 편집하실 때</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {DIRECT_EDIT.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="text-[13.5px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors underline underline-offset-4 decoration-[0.5px]"
              >
                {e.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 text-[11.5px] text-zinc-500">
            평소엔 안 들어가셔도 됩니다 — 직원이 알아서 처리.
          </div>
        </section>
      </div>
    </>
  );
}
