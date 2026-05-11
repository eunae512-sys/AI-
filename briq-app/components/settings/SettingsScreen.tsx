"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useBrand } from "@/components/brand/BrandProvider";

type Profile = { name: string; email: string; role: string };
type Payment = { holder: string; last4: string; expiry: string; brand: "VISA" | "MASTER" | "AMEX" };

const DEFAULT_PROFILE: Profile = { name: "허은애", email: "eunae@miokdang.kr", role: "사장님 · 관리자" };
const DEFAULT_PAYMENT: Payment = { holder: "HEO EUNAE", last4: "1234", expiry: "08/27", brand: "VISA" };

export function SettingsScreen() {
  const toast = useToast();
  const { brand } = useBrand();

  const [profile, setProfile] = React.useState<Profile>(DEFAULT_PROFILE);
  const [payment, setPayment] = React.useState<Payment>(DEFAULT_PAYMENT);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState<Profile>(DEFAULT_PROFILE);
  const [paymentDraft, setPaymentDraft] = React.useState({
    holder: DEFAULT_PAYMENT.holder,
    number: "",
    expiry: DEFAULT_PAYMENT.expiry,
    cvc: "",
  });

  const openProfile = () => {
    setProfileDraft(profile);
    setProfileOpen(true);
  };

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(profileDraft);
    toast.success("프로필 변경 저장됨");
    setProfileOpen(false);
  };

  const openPayment = () => {
    setPaymentDraft({ holder: payment.holder, number: "", expiry: payment.expiry, cvc: "" });
    setPaymentOpen(true);
  };

  const detectCardBrand = (num: string): Payment["brand"] => {
    const d = num.replace(/\D/g, "");
    if (d.startsWith("4")) return "VISA";
    if (d.startsWith("5") || d.startsWith("2")) return "MASTER";
    if (d.startsWith("34") || d.startsWith("37")) return "AMEX";
    return "VISA";
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = paymentDraft.number.replace(/\D/g, "");
    if (digits.length < 12) {
      toast.warn("카드번호를 12자리 이상 입력해 주세요");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(paymentDraft.expiry)) {
      toast.warn("유효기간 형식: MM/YY (예: 08/27)");
      return;
    }
    if (!/^\d{3,4}$/.test(paymentDraft.cvc)) {
      toast.warn("CVC 3~4자리 숫자");
      return;
    }
    setPayment({
      holder: paymentDraft.holder.trim() || payment.holder,
      last4: digits.slice(-4),
      expiry: paymentDraft.expiry,
      brand: detectCardBrand(digits),
    });
    toast.success("결제 수단 업데이트 완료");
    setPaymentOpen(false);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-zinc-500">계정 · 결제 · 외부 연결 · 팀 시트.</p>
      </div>

      <div className="space-y-3">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-rose-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{profile.name}</div>
              <div className="text-xs text-zinc-500">
                {profile.email} · {profile.role}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openProfile}>
              프로필 편집
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">현재 플랜</h3>
            <Badge tone="violet">PRO ★</Badge>
          </div>
          <div className="text-xs text-zinc-500">
            월 ₩99,000 · 다음 결제 2026-06-08 · {payment.brand} 카드 끝자리 ****{payment.last4} · 유효기간 {payment.expiry}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={openPayment}>
              결제 수단 변경
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.warn("플랜 취소 — 다음 결제일까지 PRO 기능 유지됩니다")}
            >
              취소
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">외부 연결 · {brand.name}</h3>
          <ul className="space-y-2.5">
            {[
              { name: "Instagram", state: `연결됨 · @${brand.id}_official`, connected: true },
              { name: "네이버 블로그", state: `연결됨 · ${brand.id}.blog.naver.com`, connected: true },
              { name: "Threads", state: "연결됨", connected: true },
              { name: "카카오 채널", state: "연결 안 됨", connected: false },
              { name: "네이버 플레이스", state: `연결됨 · ${brand.name}`, connected: true },
            ].map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800"
              >
                <div>
                  <div className="text-xs font-medium">{c.name}</div>
                  <div className="text-[11px] text-zinc-500">{c.state}</div>
                </div>
                {c.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7"
                    onClick={() => toast.warn(`${c.name} 연결 해제 — 진행하시려면 한 번 더 클릭`)}
                  >
                    연결 해제
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="text-[11px] h-7"
                    onClick={() => toast.success(`${c.name} OAuth 시작 — 새 창에서 인증해 주세요`)}
                  >
                    + 연결
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 border-rose-200/50 dark:border-rose-900/40">
          <h3 className="text-sm font-semibold mb-1">위험 영역</h3>
          <p className="text-[11px] text-zinc-500 mb-3">계정 삭제는 복구할 수 없습니다.</p>
          <Button
            variant="outline"
            size="sm"
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-500/10"
            onClick={() => toast.warn("정말 삭제하시려면 고객센터로 문의 부탁드립니다")}
          >
            계정 삭제
          </Button>
        </Card>
      </div>

      {/* Profile dialog */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setProfileOpen(false)}
            />
            <motion.form
              onSubmit={submitProfile}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(440px,calc(100vw-24px))] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <h2 className="text-base font-semibold">프로필 편집</h2>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-medium">이름</label>
                  <input
                    type="text"
                    value={profileDraft.name}
                    onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                    required
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">이메일</label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                    required
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">직책 / 역할</label>
                  <input
                    type="text"
                    value={profileDraft.role}
                    onChange={(e) => setProfileDraft({ ...profileDraft, role: e.target.value })}
                    placeholder="예: 사장님 · 관리자"
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-2 bg-zinc-50/40 dark:bg-zinc-900/40">
                <Button type="button" variant="outline" size="sm" onClick={() => setProfileOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm">
                  저장
                </Button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      {/* Payment dialog */}
      <AnimatePresence>
        {paymentOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setPaymentOpen(false)}
            />
            <motion.form
              onSubmit={submitPayment}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(440px,calc(100vw-24px))] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    PAYMENT METHOD
                  </div>
                  <h2 className="text-base font-semibold mt-0.5">결제 수단 변경</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-medium">카드 소유자</label>
                  <input
                    type="text"
                    value={paymentDraft.holder}
                    onChange={(e) => setPaymentDraft({ ...paymentDraft, holder: e.target.value })}
                    required
                    placeholder="HEO EUNAE"
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">카드번호</label>
                  <input
                    type="text"
                    value={paymentDraft.number}
                    onChange={(e) => setPaymentDraft({ ...paymentDraft, number: e.target.value })}
                    inputMode="numeric"
                    required
                    placeholder="0000 0000 0000 0000"
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm tabular-nums focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">유효기간 (MM/YY)</label>
                    <input
                      type="text"
                      value={paymentDraft.expiry}
                      onChange={(e) => setPaymentDraft({ ...paymentDraft, expiry: e.target.value })}
                      required
                      placeholder="08/27"
                      maxLength={5}
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm tabular-nums focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">CVC</label>
                    <input
                      type="text"
                      value={paymentDraft.cvc}
                      onChange={(e) => setPaymentDraft({ ...paymentDraft, cvc: e.target.value })}
                      inputMode="numeric"
                      required
                      placeholder="123"
                      maxLength={4}
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm tabular-nums focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500">
                  ※ 실제 결제는 Stripe Customer Portal 으로 연결됩니다 (현재는 dummy 저장). 카드번호는 저장 전 토큰화됩니다.
                </p>
              </div>
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-2 bg-zinc-50/40 dark:bg-zinc-900/40">
                <Button type="button" variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm">
                  저장
                </Button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
