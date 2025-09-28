import { BarChart3, FileText, CheckSquare, Settings, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserRole } from "./AppShell";

interface SidebarProps {
  user: User | null;
  userRole: UserRole["role"];
}

interface NavItem {
  title: string;
  url: string;
  icon: typeof BarChart3;
  roles: UserRole["role"][];
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    roles: ["contractor", "admin"],
  },
  {
    title: "My Submissions",
    url: "/submissions",
    icon: FileText,
    roles: ["contractor", "admin"],
  },
  {
    title: "Approvals Queue",
    url: "/approvals",
    icon: CheckSquare,
    roles: ["admin"],
  },
  {
    title: "Admin Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

export const Sidebar = ({ user, userRole }: SidebarProps) => {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const baseClasses = "w-full justify-start";
    const activeClasses = "bg-accent text-accent-foreground font-medium";
    const inactiveClasses = "hover:bg-accent/50";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <SidebarPrimitive 
      className={collapsed ? "w-14" : "w-64"} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">D</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground">DocFlow</span>
          )}
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === "admin" ? "Admin Panel" : "Contractor Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName(item.url)}
                      aria-label={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarPrimitive>
  );
};