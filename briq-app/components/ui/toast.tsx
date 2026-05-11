"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "info" | "warning";
type ToastItem = { id: string; kind: ToastKind; message: string };

type Ctx = {
  push: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
};

const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast() {
  const c = React.useContext(ToastCtx);
  if (!c) throw new Error("useToast must be used within ToastProvider");
  return c;
}

const ICON = {
  success: <CheckCircle2 className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
} as const;

const TONE = {
  success: "bg-emerald-600 text-white",
  info: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  warning: "bg-amber-500 text-white",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: string) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = crypto.randomUUID();
      setItems((arr) => [...arr, { id, kind, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value: Ctx = {
    push,
    success: (m) => push(m, "success"),
    info: (m) => push(m, "info"),
    warn: (m) => push(m, "warning"),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed left-3 right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:bottom-6 z-[60] flex flex-col gap-2 pointer-events-none sm:max-w-sm">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className={cn(
                "pointer-events-auto rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/5 dark:ring-white/5 px-3.5 py-3 sm:py-2.5 text-[13px] sm:text-xs font-medium flex items-start gap-2.5 leading-relaxed backdrop-blur-md",
                TONE[t.kind],
              )}
            >
              <span className="opacity-90 mt-0.5 shrink-0">{ICON[t.kind]}</span>
              <span className="flex-1 whitespace-pre-line">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="opacity-50 hover:opacity-100 -mr-0.5 -mt-0.5 h-6 w-6 sm:h-5 sm:w-5 grid place-items-center rounded shrink-0"
                aria-label="닫기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
