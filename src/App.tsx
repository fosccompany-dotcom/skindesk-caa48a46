import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Index from "./pages/Index";
import Points from "./pages/Points";
import Packages from "./pages/Packages";
import CalendarPage from "./pages/CalendarPage";

import Profile from "./pages/Profile";
import Treatments from "./pages/Treatments";
import ClinicEvents from "./pages/ClinicEvents";
import Admin from "./pages/Admin";
import Cycles from "./pages/Cycles";
import StatusList from "./pages/StatusList";
import Farewell from "./pages/Farewell";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SkinQuiz from "./pages/SkinQuiz";
import QuizResult from "./pages/QuizResult";
import SkinMatch from "./pages/SkinMatch";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import AdminEvents from "./pages/AdminEvents";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import GlobalFAB from "./components/GlobalFAB";
import { CyclesProvider } from "./context/CyclesContext";
import { RecordsProvider } from "./context/RecordsContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { SeasonProvider } from "./context/SeasonContext";
import { ManagementSettingsProvider } from "./context/ManagementSettingsContext";

const queryClient = new QueryClient();

import ErrorBoundary from "./components/ErrorBoundary";

// 어드민 경로에서는 모바일 max-width(430px) 제약 해제 → 풀 데스크톱 폭
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <div
      className={cn(
        "min-h-screen bg-background relative",
        !isAdmin && "app-container"
      )}
    >
      {children}
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SeasonProvider>
            <CyclesProvider>
              <RecordsProvider>
                <ManagementSettingsProvider>
                <AppShell>
                  <Routes>
                    {/* 공개 라우트 */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/farewell" element={<Farewell />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/skin-quiz" element={<PrivateRoute><SkinQuiz /></PrivateRoute>} />
                    <Route path="/quiz" element={<PrivateRoute><SkinQuiz /></PrivateRoute>} />
                    <Route path="/quiz-result" element={<PrivateRoute><QuizResult /></PrivateRoute>} />
                    <Route path="/skin-match" element={<PrivateRoute><SkinMatch /></PrivateRoute>} />

                    {/* 보호된 라우트 — 로그인 필요 */}
                    <Route path="/"         element={<PrivateRoute><Index /></PrivateRoute>} />
                    <Route path="/points"   element={<PrivateRoute><Points /></PrivateRoute>} />
                    <Route path="/treatments" element={<PrivateRoute><Treatments /></PrivateRoute>} />
                    <Route path="/treatments/events" element={<PrivateRoute><ClinicEvents /></PrivateRoute>} />
                    <Route path="/cycles"   element={<PrivateRoute><Cycles /></PrivateRoute>} />
                    <Route path="/status"   element={<PrivateRoute><StatusList /></PrivateRoute>} />
                    <Route path="/packages" element={<PrivateRoute><Packages /></PrivateRoute>} />
                    <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                    
                    <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                    <Route path="/admin"        element={<AdminRoute><AdminEvents /></AdminRoute>} />
                    <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                    <Route path="/admin/users"  element={<AdminRoute><AdminUsers /></AdminRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <GlobalFAB />
                  <BottomNav />
                </AppShell>
                </ManagementSettingsProvider>
              </RecordsProvider>
            </CyclesProvider>
            </SeasonProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
