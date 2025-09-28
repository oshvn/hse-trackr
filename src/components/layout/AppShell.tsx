import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "./Sidebar";
import { HeaderBar } from "./HeaderBar";
import { useSessionRole } from "@/hooks/useSessionRole";

export const AppShell = () => {
  const { user, loading, role } = useSessionRole();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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