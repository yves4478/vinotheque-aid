import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { ReactElement } from "react";
import { WineStoreProvider, useWineStore, type FeatureFlagKey } from "@/hooks/useWineStore";
import { FeedbackProvider } from "@/hooks/useFeedbackStore";
import Index from "./pages/Index";
import Cellar from "./pages/Cellar";
import AddWine from "./pages/AddWine";
import Suggestions from "./pages/Suggestions";
import Shopping from "./pages/Shopping";
import Ratings from "./pages/Ratings";
import WineMap from "./pages/WineMap";
import Wishlist from "./pages/Wishlist";
import Tasting from "./pages/Tasting";
import InvoiceImport from "./pages/InvoiceImport";
import Merchants from "./pages/Merchants";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function FeatureRoute({ feature, children }: { feature: FeatureFlagKey; children: ReactElement }) {
  const { settings } = useWineStore();
  return settings.featureFlags[feature] ? children : <NotFound />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WineStoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <FeedbackProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cellar" element={<Cellar />} />
            <Route path="/add" element={<AddWine />} />
            <Route path="/suggestions" element={<FeatureRoute feature="suggestions"><Suggestions /></FeatureRoute>} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/ratings" element={<FeatureRoute feature="ratings"><Ratings /></FeatureRoute>} />
            <Route path="/wishlist" element={<FeatureRoute feature="wishlist"><Wishlist /></FeatureRoute>} />
            <Route path="/tasting" element={<FeatureRoute feature="tasting"><Tasting /></FeatureRoute>} />
            <Route path="/import" element={<FeatureRoute feature="invoiceImport"><InvoiceImport /></FeatureRoute>} />
            <Route path="/merchants" element={<FeatureRoute feature="merchants"><Merchants /></FeatureRoute>} />
            <Route path="/map" element={<FeatureRoute feature="wineMap"><WineMap /></FeatureRoute>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FeedbackProvider>
        </BrowserRouter>
      </WineStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
