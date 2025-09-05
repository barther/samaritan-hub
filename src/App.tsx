import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Give from "./pages/Give";
import RequestAssistance from "./pages/RequestAssistance";
import Portal from "./pages/Portal";
import PortalDashboard from "./pages/PortalDashboard";
import ClientSearch from "./pages/ClientSearch";
import ClientDetail from "./pages/ClientDetail";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PaymentSuccess from "./pages/PaymentSuccess";
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
          <Route path="/give" element={<Give />} />
          <Route path="/request" element={<RequestAssistance />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/portal/dashboard" element={<AuthGuard><PortalDashboard /></AuthGuard>} />
          <Route path="/portal/clients" element={<AuthGuard><ClientSearch /></AuthGuard>} />
          <Route path="/portal/clients/:clientId" element={<AuthGuard><ClientDetail /></AuthGuard>} />
          <Route path="/portal/reports" element={<AuthGuard><Reports /></AuthGuard>} />
          <Route path="/portal/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
          <Route path="/portal/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/admin" element={<Navigate to="/portal" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
