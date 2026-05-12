import Link from "next/link";

export const metadata = { title: "BRIQ · 페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">404</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
          요청하신 페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
          링크가 만료됐거나 주소가 바뀌었을 수 있습니다. 아래에서 자주 가는 곳으로 이동해 주세요.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="text-sm font-medium px-5 py-2.5 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
          >
            대시보드로 →
          </Link>
          <Link
            href="/"
            className="text-sm font-medium px-5 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100"
          >
            홈 (랜딩)
          </Link>
          <Link
            href="/onboarding"
            className="text-sm font-medium px-5 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100"
          >
            새로 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
