import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import { AuthProvider } from './contexts/AuthContext';
import Index from "./pages/Index";
import AIAssistant from "./pages/AIAssistant";
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import RestaurantsPage from './pages/RestaurantsPage';
import PlanPage from './pages/PlanPage';
import SavedPage from './pages/SavedPage';
import ApiTestPage from './pages/ApiTestPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NextUIProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/index" element={<Index />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/api-test" element={<ApiTestPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </NextUIProvider>
  </QueryClientProvider>
);

export default App;