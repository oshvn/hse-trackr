import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSessionRole } from "@/hooks/useSessionRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});



const isSafeInternalPath = (path: string) => {
  if (typeof path !== "string") {
    return false;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  const disallowed = ["/login", "/forgot-password"];
  return !disallowed.some(entry => path === entry || path.startsWith(`${entry}?`));
};

const isAllowedForRole = (role: "admin" | "contractor", path: string) => {
  if (!isSafeInternalPath(path)) {
    return false;
  }

  if (role === "contractor" && path.startsWith("/admin")) {
    return false;
  }

  return true;
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useSessionRole();

  const safeReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const candidate = params.get("returnTo");
    if (!candidate) {
      return null;
    }

    return isSafeInternalPath(candidate) ? candidate : null;
  }, [location.search]);

  const getRedirectTarget = (role: "admin" | "contractor") => {
    const state = location.state as { from?: { pathname?: string; search?: string } } | null;
    const fromLocation = state?.from;
    const statePath = fromLocation?.pathname
      ? `${fromLocation.pathname}${fromLocation.search ?? ""}`
      : null;

    if (safeReturnTo && isAllowedForRole(role, safeReturnTo)) {
      return safeReturnTo;
    }

    if (statePath && isAllowedForRole(role, statePath)) {
      return statePath;
    }

    return role === "contractor" ? "/my-submissions" : "/dashboard";
  };

  useEffect(() => {
    if (user && profile?.status === "active") {
      setRedirecting(true);
      const target = getRedirectTarget(profile.role);
      navigate(target, { replace: true });
    }
  }, [user, profile, navigate, safeReturnTo, location]);

  // Redirect if already logged in
  if (user && profile?.status === "active") {
    const target = getRedirectTarget(profile.role);
    navigate(target, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      const validatedData = loginSchema.parse({ email, password });
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        // Specific error handling
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Đăng nhập thất bại",
            description: "Email hoặc mật khẩu không chính xác.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email chưa xác nhận", 
            description: "Vui lòng kiểm tra email để xác nhận tài khoản.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Lỗi đăng nhập",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        // Wait for profile resolution before redirect
        const timeoutId = setTimeout(() => {
          toast({
            title: "Đăng nhập chậm",
            description: "Đang kiểm tra quyền truy cập...",
          });
        }, 2000);

        try {
          const profilePromise = supabase
            .from('profiles')
            .select('role, status, contractor_id')
            .eq('user_id', data.user.id)
            .maybeSingle();
            
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 10000)
          );

          const { data: profileData } = await Promise.race([profilePromise, timeoutPromise]) as any;

          clearTimeout(timeoutId);

          if (!profileData) {
            toast({
              title: "Tài khoản chưa được cấp quyền",
              description: "Liên hệ quản trị viên để được cấp quyền truy cập.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }

          if (profileData.status !== "active") {
            toast({
              title: "Tài khoản chưa được kích hoạt", 
              description: "Liên hệ quản trị viên để kích hoạt tài khoản.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }

          // Success - redirect based on role
          toast({
            title: "Đăng nhập thành công",
            description: `Chào mừng trở lại!`,
          });

          if (data.user.user_metadata?.force_password_change === true) {
            navigate("/forgot-password", { replace: true });
            return;
          }

          // Role-based redirect
          if (profileData.role === "admin" || profileData.role === "contractor") {
            const redirectPath = getRedirectTarget(profileData.role);
            navigate(redirectPath, { replace: true });
          } else {
            toast({
              title: "Vai trò không xác định",
              description: "Liên hệ quản trị viên để được hỗ trợ.",
              variant: "destructive",
            });
          }

        } catch (profileError) {
          clearTimeout(timeoutId);
          console.error('Profile fetch error:', profileError);
          toast({
            title: "Lỗi kiểm tra quyền",
            description: "Không thể xác định vai trò. Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: "Thông tin không hợp lệ",
          description: validationError.issues[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Đang chuyển hướng…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng nhập
          </CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin tài khoản để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Đăng nhập
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                asChild
              >
                <Link to="/forgot-password">Quên mật khẩu?</Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                <Link to="/" className="text-primary hover:underline">
                  ← Quay về trang chủ
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default LoginPage;