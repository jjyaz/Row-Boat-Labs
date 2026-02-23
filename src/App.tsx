import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import GrainOverlay from "@/components/GrainOverlay";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AppLayout from "./layouts/AppLayout";
import Chat from "./pages/app/Chat";
import Vault from "./pages/app/Vault";
import Graph from "./pages/app/Graph";
import InboxPage from "./pages/app/InboxPage";
import Meetings from "./pages/app/Meetings";
import SettingsPage from "./pages/app/SettingsPage";
import GoogleCallback from "./pages/app/GoogleCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GrainOverlay />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Chat />} />
              <Route path="vault" element={<Vault />} />
              <Route path="graph" element={<Graph />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
