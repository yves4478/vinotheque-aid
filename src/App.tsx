import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WineStoreProvider } from "@/hooks/useWineStore";
import { PantryStoreProvider } from "@/hooks/usePantryStore";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Cellar from "./pages/Cellar";
import AddWine from "./pages/AddWine";
import Suggestions from "./pages/Suggestions";
import Shopping from "./pages/Shopping";
import Ratings from "./pages/Ratings";
import WineMap from "./pages/WineMap";
import PantryDashboard from "./pages/PantryDashboard";
import PantryInventory from "./pages/PantryInventory";
import PantryShopping from "./pages/PantryShopping";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WineStoreProvider>
        <PantryStoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<Home />} />

              {/* Wine section */}
              <Route path="/wine" element={<Index />} />
              <Route path="/wine/cellar" element={<Cellar />} />
              <Route path="/wine/add" element={<AddWine />} />
              <Route path="/wine/suggestions" element={<Suggestions />} />
              <Route path="/wine/shopping" element={<Shopping />} />
              <Route path="/wine/ratings" element={<Ratings />} />
              <Route path="/wine/map" element={<WineMap />} />

              {/* Pantry section */}
              <Route path="/pantry" element={<PantryDashboard />} />
              <Route path="/pantry/inventory" element={<PantryInventory />} />
              <Route path="/pantry/shopping" element={<PantryShopping />} />

              {/* Shared */}
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PantryStoreProvider>
      </WineStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
