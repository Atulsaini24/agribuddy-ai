import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import VoiceChat from "./pages/VoiceChat";
import TextChat from "./pages/TextChat";
import CropScanner from "./pages/CropScanner";
import Weather from "./pages/Weather";
import KnowledgeBase from "./pages/KnowledgeBase";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/voice" element={<VoiceChat />} />
            <Route path="/chat" element={<TextChat />} />
            <Route path="/scan" element={<CropScanner />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
          </Routes >
        </BrowserRouter >
      </TooltipProvider >
    </LanguageProvider >
  </QueryClientProvider >
);

export default App;
