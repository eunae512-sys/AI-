"use client";

import * as React from "react";
import { AssistantDrawer } from "./AssistantDrawer";

type Ctx = { isOpen: boolean; open: () => void; close: () => void; toggle: () => void };
const AssistantCtx = React.createContext<Ctx | null>(null);

export function useAssistant() {
  const c = React.useContext(AssistantCtx);
  if (!c) throw new Error("useAssistant must be used within AssistantProvider");
  return c;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((v) => !v), []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, close]);

  return (
    <AssistantCtx.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <AssistantDrawer />
    </AssistantCtx.Provider>
  );
}
