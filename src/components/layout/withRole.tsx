import { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useSessionRole } from "@/hooks/useSessionRole";

interface WithRoleProps {
  [key: string]: any;
}

export const withRole = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRole: "admin" | "contractor"
) => {
  return (props: P & WithRoleProps) => {
    const { role, loading } = useSessionRole();

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (role === "guest" || role !== requiredRole) {
      return <Navigate to="/auth" replace />;
    }

    return <WrappedComponent {...props} />;
  };
};