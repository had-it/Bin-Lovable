import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import WasteEvents from "./pages/WasteEvents";
import DataManagement from "./pages/DataManagement";
import NotFound from "./pages/NotFound";
import UserSettings from "./pages/UserSettings";
import Login from "./pages/Login";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <ProtectedRoute>
                <RoleProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/waste-events" element={<WasteEvents />} />
                    <Route path="/data-management" element={<DataManagement />} />
                    <Route path="/user-settings" element={<UserSettings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RoleProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
