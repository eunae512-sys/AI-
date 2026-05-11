import { Sidebar } from "@/components/layout/Sidebar";
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
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </AssistantProvider>
      </BrandProvider>
    </ToastProvider>
  );
}
