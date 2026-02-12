import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Cellar from "./pages/Cellar";
import AddWine from "./pages/AddWine";
import Suggestions from "./pages/Suggestions";
import Shopping from "./pages/Shopping";
import Ratings from "./pages/Ratings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cellar" element={<Cellar />} />
          <Route path="/add" element={<AddWine />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
