import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Index from "./pages/Index";
import AIAssistant from "./pages/AIAssistant";
import HomePage from './pages/HomePage';
import EnhancedHomePage from './pages/EnhancedHomePage';
import ChatPage from './pages/ChatPage';
import EnhancedChatPage from './pages/EnhancedChatPage';
import RestaurantsPage from './pages/RestaurantsPage';
import EnhancedRestaurantsPage from './pages/EnhancedRestaurantsPage';
import PlanPage from './pages/PlanPage';
import EnhancedPlanPage from './pages/EnhancedPlanPage';
import SavedPage from './pages/SavedPage';
import EnhancedSavedPage from './pages/EnhancedSavedPage';
import ApiTestPage from './pages/ApiTestPage';
import DesignSystemPage from './pages/DesignSystemPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <NextUIProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<EnhancedHomePage />} />
                <Route path="/index" element={<Index />} />
                <Route path="/chat" element={<EnhancedChatPage />} />
                <Route path="/restaurants" element={<EnhancedRestaurantsPage />} />
                <Route path="/plan" element={<EnhancedPlanPage />} />
                <Route path="/saved" element={<EnhancedSavedPage />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/api-test" element={<ApiTestPage />} />
                <Route path="/design-system" element={<DesignSystemPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </NextUIProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;