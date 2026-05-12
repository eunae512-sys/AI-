import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { RoadmapStrip } from "@/components/layout/RoadmapStrip";
import { AssistantProvider } from "@/components/ai-assistant/AssistantProvider";
import { BrandProvider } from "@/components/brand/BrandProvider";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BrandProvider>
        <AssistantProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0 pb-20 md:pb-0">
              <div className="max-w-screen-2xl mx-auto">
                {/* 워크플로우 5단계 — 모든 페이지 상단에 일관 노출 */}
                <div className="px-4 sm:px-6 pt-3 sm:pt-4">
                  <RoadmapStrip />
                </div>
                {children}
              </div>
            </div>
          </div>
          <MobileBottomNav />
        </AssistantProvider>
      </BrandProvider>
    </ToastProvider>
  );
}
