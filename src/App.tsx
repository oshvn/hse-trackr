import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ContractorSubmissions from "./pages/ContractorSubmissions";
import ApprovalsQueuePage from "./pages/ApprovalsQueuePage";
import AdminSettings from "./pages/AdminSettings";
import LoginPage from "./pages/LoginPage";
import UsersRolesPage from "./pages/UsersRolesPage";
import { withRole } from "./components/layout/withRole";

const queryClient = new QueryClient();

// Create role-protected components
const ProtectedApprovalsPage = withRole(ApprovalsQueuePage, "admin");
const ProtectedAdminSettings = withRole(AdminSettings, "admin");
const ProtectedUsersPage = withRole(UsersRolesPage, "admin");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<Index />} />
            <Route path="submissions" element={<ContractorSubmissions />} />
            <Route path="approvals" element={<ProtectedApprovalsPage />} />
            <Route path="settings" element={<ProtectedAdminSettings />} />
            <Route path="users" element={<ProtectedUsersPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
