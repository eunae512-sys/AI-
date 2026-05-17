"use client";

// Scheduler — "이번 주 가게 SNS 가 어떻게 흘러가는가" 한 화면.
//
// 매트릭스(요일 × 채널) 한 칸, 발행 큐 한 칸, 자동 응답 큐 한 칸, 채널 상태 한 칸.
// 사장님이 "건드릴 일" 은 없지만, 어떻게 굴러가는지는 한눈에 보인다.

import * as React from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useBrand } from "@/components/brand/BrandProvider";
import { brandChannels } from "@/lib/brand/brand-context";

const WEEK_GRID = [
  { day: "월", date: "05/12", instagram: { title: "오늘 한 컷 · 점심 자리 안내", time: "10:18", status: "issued" }, blog: null, story: { title: "자리 안내", time: "11:30", status: "issued" } },
  { day: "화", date: "05/13", instagram: { title: "에티오피아 한 배치", time: "11:48", status: "scheduled" }, blog: { title: "5월 봄나물 코스", time: "09:30", status: "scheduled" }, story: { title: "오픈 시간", time: "11:00", status: "scheduled" } },
  { day: "수", date: "05/14", instagram: { title: "오늘 한 컷 · 시그니처", time: "11:48", status: "drafting" }, blog: null, story: { title: "오늘 메뉴", time: "11:00", status: "auto" } },
  { day: "목", date: "05/15", instagram: { title: "주말 예약 카드뉴스", time: "19:12", status: "drafting" }, blog: null, story: null },
  { day: "금", date: "05/16", instagram: { title: "릴스 · 시즌 한 컷", time: "15:24", status: "queued" }, blog: null, story: { title: "주말 영업", time: "18:00", status: "queued" } },
  { day: "토", date: "05/17", instagram: null, blog: null, story: { title: "토요일 운영", time: "11:00", status: "auto" } },
  { day: "일", date: "05/18", instagram: null, blog: null, story: null },
] as const;

const AUTO_REPLY_QUEUE = [
  { kind: "DM", who: "@miyeon_____", body: "예약 가능한가요? 일요일 점심 4명이요.", routed: "사장님 전달", t: "3분 전" },
  { kind: "Comment", who: "@yj.choi", body: "여기 위치가 어디인가요?", routed: "자동 응답", t: "11분 전", reply: "지도 링크는 프로필에 있어요. 도산대로 31길 14입니다." },
  { kind: "DM", who: "@jeongho.k", body: "비건 메뉴도 있나요?", routed: "자동 응답", t: "27분 전", reply: "예약하실 때 말씀만 주시면 비건 옵션 준비해 드려요." },
  { kind: "Comment", who: "@hayoung_eats", body: "가격대 어느 정도예요?", routed: "사장님 전달", t: "1시간 전" },
];

const statusLabel: Record<string, string> = {
  issued: "Issued",
  scheduled: "Scheduled",
  drafting: "Drafting",
  queued: "Queued",
  auto: "Auto",
};

const channelStatusDot: Record<string, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  off: "bg-zinc-300 dark:bg-zinc-700",
};

export default function SchedulerPage() {
  const { brand } = useBrand();
  const CHANNELS = brandChannels(brand);
  return (
    <>
      <Topbar title="Scheduler" breadcrumb="이번 주 발행 · 응답" />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        {/* Masthead */}
        <header className="pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <div className="editorial-label">This week · Auto-running</div>
            <div className="text-[11px] tabular-nums text-zinc-500">
              발행 <span className="text-zinc-900 dark:text-zinc-100">12</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              응답 큐 <span className="text-zinc-900 dark:text-zinc-100">4</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              채널 <span className="text-zinc-900 dark:text-zinc-100">3 / 4</span>
            </div>
          </div>
          <h1
            className="mt-3 text-[32px] sm:text-[44px] leading-[0.98] tracking-[-0.02em] font-medium"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            이번 주, 사장님 대신 BRIQ 가 굴립니다.
          </h1>
          <p className="mt-4 max-w-[640px] text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            발행 시간 · 채널 · 자동 응답 · 큐 상태 — 한 화면에서 흐름만 확인하세요. 시간 변경, 응답 검수, 채널 연결은 필요한 항목을 클릭.
          </p>
        </header>

        {/* 요일 × 채널 매트릭스 — 발행 일정 한눈에 */}
        <section className="pt-12">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">발행 매트릭스</div>
            <div className="text-[11px] text-zinc-500">요일 · 채널별 자동 배정</div>
          </div>
          <div className="border-y border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 pr-3 editorial-label w-[100px]">요일</th>
                  <th className="text-left py-3 px-3 editorial-label">Instagram Feed</th>
                  <th className="text-left py-3 px-3 editorial-label">Naver Blog</th>
                  <th className="text-left py-3 px-3 editorial-label">Story</th>
                </tr>
              </thead>
              <tbody>
                {WEEK_GRID.map((row) => (
                  <tr key={row.day} className="border-b border-zinc-100 dark:border-zinc-900 last:border-b-0">
                    <td className="py-4 pr-3 align-top">
                      <div className="editorial-label">{row.day}</div>
                      <div className="text-[11px] tabular-nums text-zinc-400 mt-1">{row.date}</div>
                    </td>
                    {[row.instagram, row.blog, row.story].map((cell, ci) => (
                      <td key={ci} className="py-4 px-3 align-top">
                        {cell ? (
                          <div>
                            <div className="text-[10px] tabular-nums text-zinc-500">{cell.time}</div>
                            <div
                              className="mt-1 text-[13.5px] leading-snug"
                              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                            >
                              {cell.title}
                            </div>
                            <div className="mt-1.5 text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                              {statusLabel[cell.status]}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[20px] text-zinc-200 dark:text-zinc-800 select-none">—</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 자동 응답 큐 — 댓글·DM 가 어떻게 처리됐나 */}
        <section className="pt-14">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">자동 응답 큐</div>
            <div className="text-[11px] text-zinc-500">댓글 · DM · 평균 3분 회신</div>
          </div>
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {AUTO_REPLY_QUEUE.map((q, i) => (
              <li key={i} className="grid grid-cols-12 gap-x-4 py-4 items-start">
                <div className="col-span-2 sm:col-span-1 text-[10px] tracking-[0.15em] uppercase text-zinc-500">
                  {q.kind}
                </div>
                <div className="col-span-10 sm:col-span-3 text-[12px] text-zinc-500">
                  <div className="text-zinc-800 dark:text-zinc-200">{q.who}</div>
                  <div className="mt-1 text-[10px] tabular-nums text-zinc-400">{q.t}</div>
                </div>
                <div className="col-span-12 sm:col-span-6 mt-2 sm:mt-0">
                  <div
                    className="text-[14px] leading-relaxed"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {q.body}
                  </div>
                  {q.reply && (
                    <div className="mt-2 pl-3 border-l border-zinc-300 dark:border-zinc-700 text-[12.5px] text-zinc-500 leading-relaxed">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-400 mr-2">Auto reply</span>
                      {q.reply}
                    </div>
                  )}
                </div>
                <div className="col-span-12 sm:col-span-2 mt-2 sm:mt-0 text-right text-[11px] tracking-[0.05em]">
                  <span
                    className={
                      q.routed === "자동 응답"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-amber-700 dark:text-amber-300"
                    }
                  >
                    {q.routed}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 채널 상태 */}
        <section className="pt-14">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">채널 상태</div>
            <div className="text-[11px] text-zinc-500">연결 · 마지막 발행 · 큐</div>
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {CHANNELS.map((c) => (
              <li key={c.name} className="grid grid-cols-12 gap-x-4 items-baseline py-4">
                <div className="col-span-1 flex items-center">
                  <span className={`inline-block h-2 w-2 rounded-full ${channelStatusDot[c.status]}`} />
                </div>
                <div
                  className="col-span-3 text-[15px]"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  {c.name}
                </div>
                <div className="col-span-4 text-[12px] text-zinc-500 truncate">{c.handle}</div>
                <div className="col-span-2 text-[11px] tabular-nums text-zinc-500">{c.lastPost}</div>
                <div className="col-span-2 text-right text-[11px] text-zinc-500">{c.note}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* 자동화 룰 요약 — 켜고/끔 상태만 보여주고 변경은 Settings 로 */}
        <section className="pt-14 pb-2">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">상시 가동 중인 자동화</div>
            <a
              href="/automation"
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
            >
              룰 켜고 끄기 →
            </a>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 border-y border-zinc-200 dark:border-zinc-800 py-6">
            {[
              { on: true, t: "매일 인스타 한 컷", d: "오전 10시 / 오후 7시 자동 픽" },
              { on: true, t: "주 1회 네이버 블로그", d: "화요일 오전 자동 발행" },
              { on: false, t: "댓글·DM 자동 응답", d: "현재 사장님 직접 응답" },
              { on: true, t: "반응 좋은 게시물 재포스팅", d: "60일 전 저장 30+ 자동 리믹스" },
              { on: false, t: "리뷰 자동 리포스트", d: "Story 자동 큐레이션" },
            ].map((r) => (
              <li key={r.t} className="flex items-baseline gap-3">
                <span
                  className={`text-[10px] tracking-[0.15em] uppercase ${
                    r.on ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
                  }`}
                >
                  {r.on ? "ON" : "OFF"}
                </span>
                <span
                  className="text-[14px]"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  {r.t}
                </span>
                <span className="ml-auto text-[11px] text-zinc-400 text-right">{r.d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
