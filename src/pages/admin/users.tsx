import { useEffect, useState } from 'react';
import { Users, Search, UserPlus, Filter, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { PasswordModal } from '@/components/admin/PasswordModal';
import { UserProfile } from '@/hooks/useSessionRole';

interface Contractor {
  id: string;
  name: string;
}

const SUPER_ADMIN_EMAIL = 'admin@osh.vn';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ email: string; password: string; role: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    void loadUsers();
    void loadContractors();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          contractor:contractors(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers: UserProfile[] = (data || []).map((user) => ({
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        role: user.role as 'admin' | 'contractor',
        contractor_id: user.contractor_id,
        status: user.status as 'invited' | 'active' | 'deactivated',
        contractor_name: user.contractor?.name ?? null,
      }));

      setUsers(mappedUsers);
    } catch (err: any) {
      toast({
        title: 'Lỗi tải danh sách người dùng',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setContractors(data || []);
    } catch (err) {
      console.error('Error loading contractors:', err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.contractor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Đang hoạt động</Badge>;
      case 'invited':
        return <Badge variant="secondary">Đã mời</Badge>;
      case 'deactivated':
        return <Badge variant="destructive">Đã vô hiệu hóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Quản trị viên</Badge>;
      case 'contractor':
        return <Badge variant="outline">Nhà thầu</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleUserUpdated = () => {
    void loadUsers();
    setEditingUser(null);
  };

  const handleUserInvited = () => {
    void loadUsers();
    setShowInviteDialog(false);
  };

  const handleResetPassword = async (user: UserProfile) => {
    const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
    if (isSuperAdmin) {
      return;
    }

    if (!user.user_id) {
      toast({
        title: 'Không thể đặt lại mật khẩu',
        description: 'Tài khoản này chưa được kích hoạt trong Supabase Auth.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setResettingUserId(user.user_id);
      const { data, error } = await supabase.functions.invoke('manage-invite', {
        body: {
          action: 'reset_password',
          target_user_id: user.user_id,
          email: user.email,
        },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Không thể đặt lại mật khẩu');
      }

      setResetCredentials({
        email: data.email,
        password: data.password,
        role: data.role,
      });

      toast({
        title: 'Đã tạo mật khẩu mới',
        description: 'Hiển thị mật khẩu tạm thời để gửi cho người dùng.',
      });
      void loadUsers();
    } catch (err: any) {
      toast({
        title: 'Lỗi đặt lại mật khẩu',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    const targetUser = userToDelete;

    try {
      setDeleting(true);

      if (!targetUser.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', targetUser.id);

        if (profileError) {
          throw profileError;
        }

        if (targetUser.email) {
          await supabase
            .from('allowed_users_email')
            .delete()
            .eq('email', targetUser.email);
        }
      } else {
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'delete_user',
            targetUserId: targetUser.user_id,
          },
        });

        if (error || data?.error) {
          throw new Error(error?.message || data?.error || 'Không thể xoá người dùng');
        }
      }

      setUsers((prev) => prev.filter((user) => user.id !== targetUser.id));

      toast({
        title: 'Đã xoá người dùng',
        description: `${targetUser.email} đã được xoá hoàn toàn.`,
      });
      setUserToDelete(null);
      void loadUsers();
    } catch (err: any) {
      toast({
        title: 'Lỗi xoá người dùng',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý người dùng & phân quyền</h1>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Mời người dùng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc & Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo email hoặc nhà thầu..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="contractor">Nhà thầu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="invited">Đã mời</SelectItem>
                <SelectItem value="deactivated">Đã vô hiệu hóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Nhà thầu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Lấy lại mật khẩu</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="space-x-2">
                        {getRoleBadge(user.role)}
                        {isSuperAdmin && (
                          <Badge variant="outline" className="border-primary text-primary">
                            Super Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.contractor_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => handleResetPassword(user)}
                          disabled={isSuperAdmin || !user.user_id || resettingUserId === user.user_id}
                        >
                          {resettingUserId === user.user_id ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                              Đang tạo
                            </span>
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Lấy lại
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => !isSuperAdmin && setEditingUser(user)}
                          disabled={isSuperAdmin}
                          title={isSuperAdmin ? 'Không thể chỉnh sửa Super Admin' : 'Chỉnh sửa người dùng'}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => setUserToDelete(user)}
                          disabled={isSuperAdmin}
                          title={isSuperAdmin ? 'Không thể xoá Super Admin' : 'Xoá người dùng'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Không tìm thấy người dùng phù hợp với bộ lọc.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onUserInvited={handleUserInvited}
        contractors={contractors}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          contractors={contractors}
          onUserUpdated={handleUserUpdated}
          isSuperAdmin={editingUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL}
        />
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !deleting && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá vĩnh viễn tài khoản {userToDelete?.email}? Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Đang xoá...' : 'Xoá người dùng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {resetCredentials && (
        <PasswordModal
          open={!!resetCredentials}
          onOpenChange={(open) => {
            if (!open) {
              setResetCredentials(null);
            }
          }}
          email={resetCredentials.email}
          password={resetCredentials.password}
          role={resetCredentials.role}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
