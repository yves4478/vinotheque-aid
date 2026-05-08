import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { FeedbackWidget } from "./FeedbackWidget";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-16 lg:pt-10 pb-10">
          {children}
        </div>
      </main>
      <FeedbackWidget />
    </div>
  );
}
