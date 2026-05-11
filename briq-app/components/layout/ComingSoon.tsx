"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
  preview,
}: {
  title: string;
  description: string;
  preview?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium">
          <Sparkles className="h-3 w-3 text-violet-500" />
          Phase 2 기능
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
        {preview && <div className="mt-8">{preview}</div>}
      </motion.div>
    </div>
  );
}
