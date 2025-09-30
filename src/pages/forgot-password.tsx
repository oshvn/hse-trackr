import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, MailCheck, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSessionRole } from "@/hooks/useSessionRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const resetSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type Mode = "request" | "update";

const ForgotPasswordPage = () => {
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isForced, setIsForced] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, role } = useSessionRole();

  useEffect(() => {
    const authenticated = role === "admin" || role === "contractor";
    if (authenticated && user) {
      setMode("update");
      setIsForced(user.user_metadata?.force_password_change === true);
      setEmail(profile?.email || user.email || "");
    } else {
      setMode("request");
      setIsForced(false);
    }
  }, [role, user, profile]);

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const { email: validEmail } = resetSchema.parse({ email });
      setRequesting(true);
      setRequestSuccess(false);

      const { error } = await supabase.auth.resetPasswordForEmail(validEmail, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Đã gửi hướng dẫn",
        description: "Kiểm tra email để đặt lại mật khẩu.",
      });
      setRequestSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Email không hợp lệ",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Không thể gửi yêu cầu",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = updatePasswordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setUpdating(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: payload.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Sai mật khẩu hiện tại",
          description: "Vui lòng kiểm tra lại mật khẩu cũ.",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: payload.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      if (isForced) {
        await supabase.auth.updateUser({
          data: {
            ...user?.user_metadata,
            force_password_change: false,
            password_updated_at: new Date().toISOString(),
          },
        });
      }

      toast({
        title: "Đã cập nhật mật khẩu",
        description: "Bạn có thể tiếp tục sử dụng hệ thống.",
      });

      if (role === "admin") {
        navigate("/", { replace: true });
      } else if (role === "contractor") {
        navigate("/my-submissions", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Thông tin không hợp lệ",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Không thể cập nhật mật khẩu",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const renderRequestForm = () => (
    <form onSubmit={handleResetRequest} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email đăng ký</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="contractor@company.com"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={requesting}>
        {requesting ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Gửi liên kết đặt lại mật khẩu
      </Button>

      {requestSuccess && (
        <div className="rounded-md border border-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground flex items-center gap-2">
            <MailCheck className="h-4 w-4" />
            Đã gửi hướng dẫn
          </p>
          <p className="mt-1">
            Nếu không thấy email, hãy kiểm tra mục Spam hoặc yêu cầu lại sau vài phút.
          </p>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          ← Quay về trang đăng nhập
        </Link>
      </div>
    </form>
  );

  const renderUpdateForm = () => (
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
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={updating}>
        {updating ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        Cập nhật mật khẩu
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={handleSignOut}>
        Đăng xuất và quay về đăng nhập
      </Button>
    </form>
  );

  const isUpdateMode = mode === "update";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
            {isUpdateMode ? <Lock className="h-6 w-6" /> : <Send className="h-6 w-6" />}
            {isUpdateMode ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
          </CardTitle>
          <CardDescription>
            {isUpdateMode
              ? isForced
                ? "Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống."
                : "Nhập mật khẩu mới để cập nhật tài khoản của bạn."
              : "Nhập email để nhận liên kết đặt lại mật khẩu."}
          </CardDescription>
        </CardHeader>
        <CardContent>{isUpdateMode ? renderUpdateForm() : renderRequestForm()}</CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
