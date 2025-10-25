import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ensureSession } from "@/lib/autoGuest";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "./NotificationBell";

interface HeaderBarProps {
  user: User | null;
  userRole: "admin" | "super_admin" | "contractor" | "guest";
}

export const HeaderBar = ({ user, userRole }: HeaderBarProps) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      await ensureSession();
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "G";
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "super_admin":
        return "Super Administrator";
      case "contractor":
        return "Contractor";
      default:
        return "Guest";
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold text-foreground">
          {(userRole === "admin" || userRole === "super_admin") ? "Admin Dashboard" : "Contractor Portal"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {(userRole === "admin" || userRole === "super_admin") && <NotificationBell />}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleLabel()}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Đăng nhập
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};