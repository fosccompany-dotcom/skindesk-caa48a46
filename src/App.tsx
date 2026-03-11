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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import { CyclesProvider } from "./context/CyclesContext";
import { RecordsProvider } from "./context/RecordsContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CyclesProvider>
              <RecordsProvider>
                <div className="app-container min-h-screen bg-background relative">
                  <Routes>
                    {/* 공개 라우트 */}
                    <Route path="/login"  element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* 보호된 라우트 — 로그인 필요 */}
                    <Route path="/"         element={<PrivateRoute><Index /></PrivateRoute>} />
                    <Route path="/points"   element={<PrivateRoute><Points /></PrivateRoute>} />
                    <Route path="/treatments" element={<PrivateRoute><Treatments /></PrivateRoute>} />
                    <Route path="/cycles"   element={<PrivateRoute><Cycles /></PrivateRoute>} />
                    <Route path="/status"   element={<PrivateRoute><StatusList /></PrivateRoute>} />
                    <Route path="/packages" element={<PrivateRoute><Packages /></PrivateRoute>} />
                    <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                    <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <BottomNav />
                </div>
              </RecordsProvider>
            </CyclesProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
