import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { FeedbackWidget } from "./FeedbackWidget";
import { useWineStore } from "@/hooks/useWineStore";

export function AppLayout({ children }: { children: ReactNode }) {
  const { localImageStorageWarning } = useWineStore();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-16 lg:pt-10 pb-10">
          {localImageStorageWarning ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                <div className="space-y-1">
                  <p className="font-semibold">Lokaler Bildspeicher wird knapp</p>
                  <p className="leading-relaxed text-amber-900/80">
                    {localImageStorageWarning} Bis Cloud-Storage angebunden ist, lohnt es sich,
                    nur wirklich noetige Bilder lokal zu behalten.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </main>
      <FeedbackWidget />
    </div>
  );
}
