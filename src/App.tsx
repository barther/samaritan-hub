import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Give from "./pages/Give";
import RequestAssistance from "./pages/RequestAssistance";
import Portal from "./pages/Portal";
import PortalDashboard from "./pages/PortalDashboard";
import ClientSearch from "./pages/ClientSearch";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
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
          <Route path="/portal/dashboard" element={<PortalDashboard />} />
          <Route path="/portal/clients" element={<ClientSearch />} />
          <Route path="/portal/reports" element={<Reports />} />
          <Route path="/portal/analytics" element={<Analytics />} />
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
