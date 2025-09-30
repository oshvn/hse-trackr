import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/dashboard";
import MySubmissions from "./pages/my-submissions";
import AdminApprovals from "./pages/admin/approvals";
import AdminSettings from "./pages/admin/settings";
import AdminUsers from "./pages/admin/users";
import LoginPage from "./pages/login";
import ForgotPasswordPage from "./pages/forgot-password";
import NotFound from "./pages/NotFound";
import { withRole } from "./components/layout/withRole";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Create role-protected components
const ContractorOnlySubmissions = withRole(MySubmissions, ["contractor"]);
const ProtectedApprovalsPage = withRole(AdminApprovals, ["admin"]);
const ProtectedAdminSettings = withRole(AdminSettings, ["admin"]);
const ProtectedUsersPage = withRole(AdminUsers, ["admin"]);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/" element={<AppShell />}>
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="my-submissions" element={<ContractorOnlySubmissions />} />
      <Route path="admin">
        <Route path="approvals" element={<ProtectedApprovalsPage />} />
        <Route path="settings" element={<ProtectedAdminSettings />} />
        <Route path="users" element={<ProtectedUsersPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
