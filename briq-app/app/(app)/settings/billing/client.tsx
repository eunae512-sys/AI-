"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { PLANS, formatKrw, type PlanId } from "@/lib/billing/plans";
import { SubscribeButton } from "@/components/billing/SubscribeButton";

type Card = {
  id: string;
  cardCompany: string | null;
  cardNumberMasked: string | null;
  cardType: string | null;
  createdAt: string;
};

type Subscription = {
  id: string;
  planId: PlanId;
  status: "trialing" | "active" | "past_due" | "cancelled";
  billingCycle: "monthly" | "annual";
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceAmount: number;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
};

type Payment = {
  id: string;
  orderId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  receiptUrl: string | null;
  paidAt: string | null;
  requestedAt: string;
  failureCode: string | null;
  failureMessage: string | null;
};

type BillingMe = {
  card: Card | null;
  subscription: Subscription | null;
  history: Payment[];
};

export function BillingSettingsClient() {
  const [data, setData] = React.useState<BillingMe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionPending, setActionPending] = React.useState<
    "cancel" | "resume" | null
  >(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/billing/me");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData((await r.json()) as BillingMe);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "결제 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onCancel = async () => {
    if (!confirm("정기결제를 해지하시겠어요? 다음 결제일에 자동결제가 종료됩니다.")) return;
    setActionPending("cancel");
    try {
      const r = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await fetchData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "해지 처리 중 오류");
    } finally {
      setActionPending(null);
    }
  };

  const onResume = async () => {
    setActionPending("resume");
    try {
      const r = await fetch("/api/billing/resume", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await fetchData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "재개 처리 중 오류");
    } finally {
      setActionPending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 결제 정보를 불러오는 중…
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-md bg-amber-50 p-4 text-sm text-amber-800">
        {errorMsg}
        <button onClick={fetchData} className="ml-3 underline">
          다시 시도
        </button>
      </div>
    );
  }

  const sub = data?.subscription ?? null;
  const card = data?.card ?? null;
  const history = data?.history ?? [];
  const plan = sub ? PLANS.find((p) => p.id === sub.planId) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">결제 · 구독</h1>
        <p className="mt-1 text-sm text-zinc-500">
          카드 정보와 정기결제 상태를 관리합니다.
        </p>
      </header>

      {/* 구독 상태 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400">
              현재 플랜
            </div>
            <div className="mt-1 text-xl font-semibold">
              {plan?.name ?? "Free"}
              {sub && (
                <span className="ml-2 align-middle text-[11px] font-normal text-zinc-500">
                  {sub.billingCycle === "monthly" ? "월간" : "연간"} ·{" "}
                  ₩{formatKrw(sub.priceAmount)}
                </span>
              )}
            </div>
            <SubscriptionStatusBadge sub={sub} />
          </div>
          {sub && !sub.cancelAtPeriodEnd && (
            <button
              onClick={onCancel}
              disabled={actionPending !== null}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-[12px] text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400"
            >
              {actionPending === "cancel" ? "처리 중…" : "해지"}
            </button>
          )}
          {sub?.cancelAtPeriodEnd && (
            <button
              onClick={onResume}
              disabled={actionPending !== null}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-50 transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {actionPending === "resume" ? "처리 중…" : "해지 취소"}
            </button>
          )}
        </div>

        {sub && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2 dark:border-zinc-800">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400">
                {sub.status === "trialing" ? "체험 종료일" : "다음 결제일"}
              </div>
              <div className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                {formatKDate(sub.currentPeriodEnd)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400">
                시작일
              </div>
              <div className="mt-0.5 text-zinc-800 dark:text-zinc-200">
                {formatKDate(sub.currentPeriodStart)}
              </div>
            </div>
          </div>
        )}

        {!sub && (
          <div className="mt-3 text-sm text-zinc-500">
            현재 활성 구독이 없습니다.{" "}
            <Link href="/pricing" className="font-medium underline">
              플랜 보기
            </Link>
          </div>
        )}
      </section>

      {/* 카드 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">결제수단</h2>
        </div>
        {card ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">
                {card.cardCompany ?? "카드"}{" "}
                <span className="text-zinc-400">{card.cardType ?? ""}</span>
              </div>
              <div className="mt-0.5 font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
                {card.cardNumberMasked ?? "**** **** **** ****"}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                {formatKDate(card.createdAt)} 등록
              </div>
            </div>
            {sub ? (
              <SubscribeButton
                planId={sub.planId === "free" ? "pro" : sub.planId}
                cycle={sub.billingCycle}
                notReadyLabel="준비 중"
              >
                카드 교체
              </SubscribeButton>
            ) : (
              <Link
                href="/pricing"
                className="text-[12px] text-zinc-500 hover:underline"
              >
                플랜 선택하기
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-500">
              등록된 결제수단이 없습니다.
            </div>
            <Link
              href="/pricing"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              등록하기
            </Link>
          </div>
        )}
      </section>

      {/* 결제 내역 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">결제 내역</h2>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">아직 결제 내역이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <PaymentIcon status={h.status} />
                    <span className="font-medium">₩{formatKrw(h.amount)}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    {formatKDate(h.paidAt ?? h.requestedAt)}
                  </div>
                  {h.status === "failed" && h.failureMessage && (
                    <div className="mt-0.5 text-[11px] text-red-500">
                      {h.failureMessage}
                    </div>
                  )}
                </div>
                {h.receiptUrl && (
                  <a
                    href={h.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-zinc-500 hover:underline"
                  >
                    영수증
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ───────── 작은 헬퍼들 ─────────

function SubscriptionStatusBadge({ sub }: { sub: Subscription | null }) {
  if (!sub) return null;
  const map: Record<
    Subscription["status"],
    { label: string; cls: string }
  > = {
    trialing: { label: "14일 무료체험 중", cls: "bg-emerald-50 text-emerald-700" },
    active: { label: "이용 중", cls: "bg-zinc-100 text-zinc-700" },
    past_due: { label: "결제 실패 — 재시도 중", cls: "bg-amber-50 text-amber-700" },
    cancelled: { label: "해지됨", cls: "bg-zinc-100 text-zinc-500" },
  };
  const m = map[sub.status];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${m.cls}`}>
        {m.label}
      </span>
      {sub.cancelAtPeriodEnd && (
        <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
          다음 결제일에 종료 예약
        </span>
      )}
    </div>
  );
}

function PaymentIcon({ status }: { status: Payment["status"] }) {
  if (status === "paid")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "failed")
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (status === "cancelled")
    return <XCircle className="h-3.5 w-3.5 text-zinc-400" />;
  return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
}

function formatKDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
