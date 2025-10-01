import { useCallback, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  contractor: 'Nhà thầu',
};

export const PasswordModal = ({ open, onOpenChange, email, password, role }: PasswordModalProps) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const { toast } = useToast();

  const handleDialogChange = useCallback((next: boolean) => {
    if (!next) {
      setEmailCopied(false);
      setPasswordCopied(false);
    }
    onOpenChange(next);
  }, [onOpenChange]);

  const copyToClipboard = useCallback(async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === 'email') {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } else {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      }

      toast({
        title: 'Đã sao chép',
        description: type === 'email' ? 'Email đã được sao chép.' : 'Mật khẩu đã được sao chép.',
      });
    } catch (err) {
      toast({
        title: 'Lỗi sao chép',
        description: 'Không thể sao chép vào clipboard.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const copyAll = useCallback(async () => {
    const fullCredentials = `Email: ${email}
Mật khẩu: ${password}
Vai trò: ${ROLE_LABEL[role] ?? role}`;
    try {
      await navigator.clipboard.writeText(fullCredentials);
      toast({
        title: 'Đã sao chép tất cả',
        description: 'Thông tin đăng nhập đã được sao chép.',
      });
    } catch (err) {
      toast({
        title: 'Lỗi sao chép',
        description: 'Không thể sao chép vào clipboard.',
        variant: 'destructive',
      });
    }
  }, [email, password, role, toast]);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg [&>[data-radix-dialog-close]]:hidden">
        <DialogHeader>
          <DialogTitle>Tài khoản đã được tạo</DialogTitle>
          <DialogDescription>
            Vui lòng lưu thông tin đăng nhập này. Mật khẩu chỉ hiển thị một lần duy nhất.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md bg-muted p-3 font-mono text-sm break-all">
                {email}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(email, 'email')}
                title="Sao chép email"
              >
                {emailCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mật khẩu tạm thời</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md bg-muted p-3 font-mono text-sm break-all">
                {password}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(password, 'password')}
                title="Sao chép mật khẩu"
              >
                {passwordCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vai trò</label>
            <div className="rounded-md bg-muted p-3 text-sm">
              {ROLE_LABEL[role] ?? role}
            </div>
          </div>

          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠️ Lưu ý: Mật khẩu này chỉ hiển thị một lần. Hãy gửi cho người dùng ngay hoặc lưu lại ở nơi an toàn.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyAll}>
              <Copy className="mr-2 h-4 w-4" />
              Sao chép tất cả
            </Button>
            <Button className="flex-1" onClick={() => handleDialogChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
