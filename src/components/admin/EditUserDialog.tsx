import { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/hooks/useSessionRole';

interface Contractor {
  id: string;
  name: string;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  contractors: Contractor[];
  onUserUpdated: () => void;
  isSuperAdmin?: boolean;
}

export const EditUserDialog = ({
  open,
  onOpenChange,
  user,
  contractors,
  onUserUpdated,
  isSuperAdmin = false,
}: EditUserDialogProps) => {
  const [role, setRole] = useState<'admin' | 'contractor'>(user.role);
  const [contractorId, setContractorId] = useState(user.contractor_id || '');
  const [status, setStatus] = useState<'invited' | 'active' | 'deactivated'>(user.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const { toast } = useToast();
  const readOnly = isSuperAdmin;

  useEffect(() => {
    setRole(user.role);
    setContractorId(user.contractor_id || '');
    setStatus(user.status);
    setNote('');
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);

      const updateData: Record<string, unknown> = {
        role,
        status,
        updated_at: new Date().toISOString(),
      };

      if (role === 'contractor') {
        if (!contractorId) {
          toast({
            title: 'Thiếu thông tin',
            description: 'Vui lòng chọn nhà thầu cho tài khoản nhà thầu.',
            variant: 'destructive',
          });
          return;
        }
        updateData.contractor_id = contractorId;
      } else {
        updateData.contractor_id = null;
      }

      if (note.trim()) {
        updateData.note = note.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin người dùng đã được lưu.',
      });

      onUserUpdated();
    } catch (err: any) {
      toast({
        title: 'Lỗi cập nhật',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (readOnly) {
      setShowDeactivateDialog(false);
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'deactivated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Đã vô hiệu hóa',
        description: 'Tài khoản người dùng đã được vô hiệu hóa.',
      });

      setShowDeactivateDialog(false);
      onUserUpdated();
    } catch (err: any) {
      toast({
        title: 'Lỗi vô hiệu hóa',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và phân quyền cho {user.email}
            </DialogDescription>
          </DialogHeader>
          {readOnly && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Tài khoản Super Admin không thể chỉnh sửa từ giao diện này.
            </div>
          )}
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'contractor')} disabled={readOnly}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="contractor">Nhà thầu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'contractor' && (
              <div className="space-y-2">
                <Label htmlFor="edit-contractor">Nhà thầu</Label>
                <Select value={contractorId} onValueChange={setContractorId} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà thầu" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'invited' | 'active' | 'deactivated')} disabled={readOnly}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invited">Đã mời</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="deactivated">Đã vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note">Ghi chú cập nhật</Label>
              <Textarea
                id="edit-note"
                placeholder="Ghi chú về thay đổi này (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={readOnly}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeactivateDialog(true)}
                  disabled={loading || status === 'deactivated'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vô hiệu hóa
                </Button>
              )}
              <Button type="submit" disabled={loading || readOnly}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                Cập nhật
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận vô hiệu hóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn vô hiệu hóa tài khoản của {user.email}? Người dùng sẽ không thể đăng nhập vào hệ thống nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
