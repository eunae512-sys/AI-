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
            {/* pb-16 reserves room for mobile bottom tab; md+ no reservation */}
            <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
          </div>
          <MobileBottomNav />
        </AssistantProvider>
      </BrandProvider>
    </ToastProvider>
  );
}
