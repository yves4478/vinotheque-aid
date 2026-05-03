import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WineStoreProvider } from "@/hooks/useWineStore";
import { FeedbackProvider } from "@/hooks/useFeedbackStore";
import { AppRuntimeProvider, useAppRuntime } from "@/providers/AppRuntimeProvider";
import { getEnabledWebRoutes } from "@/features/webFeatures";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { featureFlags } = useAppRuntime();
  const routes = getEnabledWebRoutes(featureFlags);

  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRuntimeProvider>
      <TooltipProvider>
        <WineStoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <FeedbackProvider>
              <AppRoutes />
            </FeedbackProvider>
          </BrowserRouter>
        </WineStoreProvider>
      </TooltipProvider>
    </AppRuntimeProvider>
  </QueryClientProvider>
);

export default App;
