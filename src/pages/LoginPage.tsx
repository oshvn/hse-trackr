import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionRole } from "@/hooks/useSessionRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useSessionRole();

  // Redirect if already logged in
  if (user && profile?.status === "active") {
    if (profile.role === "admin") {
      navigate("/", { replace: true });
    } else if (profile.role === "contractor") {
      navigate("/submissions", { replace: true });
    }
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
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Đăng nhập thất bại",
            description: "Email hoặc mật khẩu không chính xác.",
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
        // Check if user has an active profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, status, contractor_id')
          .eq('user_id', data.user.id)
          .single();

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

        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng trở lại!`,
        });

        // Check if password change is required
        if (data.user.user_metadata?.force_password_change === true) {
          navigate("/update-password", { replace: true });
          return;
        }

        // Redirect based on role
        if (profileData.role === "admin") {
          navigate("/", { replace: true });
        } else if (profileData.role === "contractor") {
          navigate("/submissions", { replace: true });
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
                onClick={() => setShowForgotPassword(true)}
              >
                Quên mật khẩu?
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

      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default LoginPage;