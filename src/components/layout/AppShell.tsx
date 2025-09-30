import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "./Sidebar";
import { HeaderBar } from "./HeaderBar";
import { useSessionRole } from "@/hooks/useSessionRole";

export const AppShell = () => {
  const { user, loading, role, error } = useSessionRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      return;
    }

    // Check if user needs to change password
    if (user?.user_metadata?.force_password_change === true && location.pathname !== "/forgot-password") {
      navigate("/forgot-password", { replace: true });
      return;
    }

    // Redirect guests trying to access protected pages
    const protectedPaths = ["/my-submissions", "/admin"];
    if (role === "guest" && protectedPaths.some(path => location.pathname.startsWith(path))) {
      navigate("/login", { replace: true });
    }
  }, [user, role, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar userRole={role} />
        <div className="flex-1 flex flex-col">
          <HeaderBar user={user} userRole={role} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};