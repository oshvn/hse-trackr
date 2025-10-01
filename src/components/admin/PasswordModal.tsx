import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  role: string;
}

export const PasswordModal = ({ open, onOpenChange, email, password, role }: PasswordModalProps) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
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
        description: `${type === 'email' ? 'Email' : 'Mật khẩu'} đã được sao chép vào clipboard.`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi sao chép',
        description: 'Không thể sao chép vào clipboard.',
        variant: 'destructive',
      });
    }
  };

  const copyAll = async () => {
    const fullCredentials = `Email: ${email}\nMật khẩu: ${password}\nVai trò: ${role === 'admin' ? 'Quản trị viên' : 'Nhà thầu'}`;
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
  };

  const handleClose = () => {
    // Clear copied states when closing
    setEmailCopied(false);
    setPasswordCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Tài khoản đã được tạo
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Vui lòng lưu thông tin đăng nhập này. Mật khẩu chỉ hiển thị một lần duy nhất.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
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
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
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
            <div className="p-3 bg-muted rounded-md text-sm">
              {role === 'admin' ? 'Quản trị viên' : 'Nhà thầu'}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Lưu ý: Mật khẩu này chỉ hiển thị một lần. Hãy gửi cho người dùng ngay hoặc lưu lại ở nơi an toàn.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyAll}
            >
              <Copy className="h-4 w-4 mr-2" />
              Sao chép tất cả
            </Button>
            <Button
              className="flex-1"
              onClick={handleClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
