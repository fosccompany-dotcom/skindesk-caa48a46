import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Points from "./pages/Points";
import Packages from "./pages/Packages";
import CalendarPage from "./pages/CalendarPage";
import Profile from "./pages/Profile";
import Treatments from "./pages/Treatments";
import Cycles from "./pages/Cycles";
import StatusList from "./pages/StatusList";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import { CyclesProvider } from "./context/CyclesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CyclesProvider>
        <BrowserRouter>
          <div className="app-container min-h-screen bg-background relative">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/points" element={<Points />} />
              <Route path="/treatments" element={<Treatments />} />
              <Route path="/cycles" element={<Cycles />} />
              <Route path="/status" element={<StatusList />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </CyclesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;