import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
            {/*
              pb-20: 모바일 하단 탭(56px) + safe-area 위로 콘텐츠가 가려지지 않게
              max-w-screen-2xl: ultrawide 모니터에서 너무 퍼지지 않게 중앙 정렬
            */}
            <div className="flex-1 min-w-0 pb-20 md:pb-0">
              <div className="max-w-screen-2xl mx-auto">{children}</div>
            </div>
          </div>
          <MobileBottomNav />
        </AssistantProvider>
      </BrandProvider>
    </ToastProvider>
  );
}
