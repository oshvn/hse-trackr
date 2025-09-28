import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionRole } from "@/hooks/useSessionRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const UpdatePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForced, setIsForced] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, role } = useSessionRole();

  useEffect(() => {
    // Check if this is a forced password change
    if (user?.user_metadata?.force_password_change === true) {
      setIsForced(true);
    }
    
    // If user is not logged in, redirect to login
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = updatePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setLoading(true);

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (updateError) {
        toast({
          title: "Lỗi cập nhật mật khẩu",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Clear force_password_change flag if this was a forced update
      if (isForced) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            ...user?.user_metadata,
            force_password_change: false,
            password_updated_at: new Date().toISOString(),
          }
        });

        if (metadataError) {
          console.error("Error clearing force password change flag:", metadataError);
        }
      }

      toast({
        title: "Mật khẩu đã được cập nhật",
        description: "Mật khẩu của bạn đã được thay đổi thành công.",
      });

      // Redirect based on user role
      if (role === "admin") {
        navigate("/", { replace: true });
      } else if (role === "contractor") {
        navigate("/submissions", { replace: true });
      } else {
        navigate("/", { replace: true });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            {isForced ? "Bắt buộc đổi mật khẩu" : "Cập nhật mật khẩu"}
          </CardTitle>
          <CardDescription className="text-center">
            {isForced 
              ? "Vì lý do bảo mật, bạn cần thay đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
              : "Thay đổi mật khẩu của bạn để đảm bảo tính bảo mật."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {!isForced && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required={!isForced}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              {!isForced && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Hủy
                </Button>
              )}
              <Button 
                type="submit" 
                className={isForced ? "w-full" : "flex-1"} 
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {isForced ? "Cập nhật & Tiếp tục" : "Cập nhật mật khẩu"}
              </Button>
            </div>

            {isForced && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  Đăng xuất thay vì đổi mật khẩu
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;