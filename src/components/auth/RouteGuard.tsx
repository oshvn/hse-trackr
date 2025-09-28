import { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useSessionRole } from "@/hooks/useSessionRole";

interface RouteGuardProps {
  requireRole?: ("admin" | "contractor")[];
  fallbackPath?: string;
  children?: React.ReactNode;
}

export const RouteGuard = ({ 
  requireRole = [], 
  fallbackPath = "/auth", 
  children 
}: RouteGuardProps) => {
  const { role, loading } = useSessionRole();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no specific role required, allow access
  if (requireRole.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  if (role === "guest" || !requireRole.includes(role as "admin" | "contractor")) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// HOC for wrapping components with role requirements
export const withRoleGuard = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requireRole: ("admin" | "contractor")[] = [],
  fallbackPath: string = "/auth"
) => {
  return (props: P) => (
    <RouteGuard requireRole={requireRole} fallbackPath={fallbackPath}>
      <WrappedComponent {...props} />
    </RouteGuard>
  );
};