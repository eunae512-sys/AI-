"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Film, Megaphone, FileText, Calendar, FileImage, MessageSquareHeart, Send } from "lucide-react";
import { useAssistant } from "./AssistantProvider";

const QUICK_ACTIONS = [
  { icon: Film, label: "릴스 자동 생성", href: "/reels", tone: "violet" },
  { icon: Megaphone, label: "광고 문구 생성", href: "/cardnews", tone: "rose" },
  { icon: FileText, label: "블로그 작성", href: "/cardnews", tone: "emerald" },
  { icon: Calendar, label: "이벤트 카피", href: "/calendar", tone: "amber" },
  { icon: FileImage, label: "카드뉴스 6장", href: "/cardnews", tone: "sky" },
  { icon: MessageSquareHeart, label: "리뷰 답변", href: "/reviews", tone: "fuchsia" },
] as const;

const toneClass = {
  violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300",
  sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300",
  fuchsia: "bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
} as const;

type Msg = { id: string; role: "bot" | "user"; text: string; ago: string };

export function AssistantDrawer() {
  const { isOpen, close } = useAssistant();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      id: "init",
      role: "bot",
      text:
        "안녕하세요, 허은애 님. 오늘은 장마 시즌 감성 릴스와 가정의 달 마감 이벤트 콘텐츠가 추천돼요. 어떤 작업을 시작할까요?",
      ago: "방금",
    },
  ]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    const user: Msg = { id: crypto.randomUUID(), role: "user", text: v, ago: "방금" };
    setMessages((m) => [...m, user]);
    setInput("");
    setTimeout(() => {
      const bot: Msg = {
        id: crypto.randomUUID(),
        role: "bot",
        text: `확인했어요. "${v.slice(0, 30)}" 작업을 시작할게요. 브랜드 톤 메모리(미옥당 v3)와 5월 시즌 컨텍스트를 자동으로 적용합니다.`,
        ago: "방금",
      };
      setMessages((m) => [...m, bot]);
    }, 600);
  };

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[92vw] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">BRIQ Assistant</div>
                <div className="text-[10px] text-zinc-500">소상공인 온라인 직원 · 즉시 실행</div>
              </div>
              <button
                onClick={close}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-semibold mb-2">
                빠른 실행
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.label}
                      href={a.href}
                      onClick={close}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors group"
                    >
                      <span className={`h-6 w-6 rounded grid place-items-center ${toneClass[a.tone]}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="font-medium">{a.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`h-6 w-6 rounded-md grid place-items-center text-[10px] font-bold text-white shrink-0 ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-amber-400 to-rose-500"
                        : "bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500"
                    }`}
                  >
                    {m.role === "user" ? "나" : "B"}
                  </div>
                  <div
                    className={`text-xs leading-relaxed rounded-xl px-3 py-2 max-w-[80%] ${
                      m.role === "user"
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    {m.text}
                    <div className="mt-1 text-[10px] opacity-60">{m.ago}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={send} className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-900 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="무엇을 만들까요? (예: 미옥당 5월 봄나물 인스타 5장)"
                className="flex-1 h-9 rounded-md px-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
