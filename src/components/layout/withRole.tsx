import { ComponentType } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionRole } from "@/hooks/useSessionRole";

type Role = "admin" | "contractor" | "guest";

interface WithRoleOptions {
  redirectTo?: string;
}

export const withRole = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRoles: Role[] | Role,
  options: WithRoleOptions = {}
) => {
  return (props: P) => {
    const { role, loading } = useSessionRole();
    const location = useLocation();
    const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      );
    }

    if (allowedRoles.includes(role)) {
      return <WrappedComponent {...props} />;
    }

    const redirectPath = options.redirectTo || (role === "guest" ? "/login" : "/");

    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  };
};