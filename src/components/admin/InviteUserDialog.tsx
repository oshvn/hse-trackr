import { useState } from "react";
import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { PasswordModal } from "./PasswordModal";

const inviteUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.union([z.literal("admin"), z.literal("contractor")]).refine(val => val, {
    message: "Vui lòng chọn vai trò"
  }),
  contractor_id: z.string().optional(),
  note: z.string().optional(),
}).refine((data) => {
  if (data.role === "contractor" && !data.contractor_id) {
    return false;
  }
  return true;
}, {
  message: "Vui lòng chọn nhà thầu cho người dùng có vai trò nhà thầu",
  path: ["contractor_id"]
});

interface Contractor {
  id: string;
  name: string;
}

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void;
  contractors: Contractor[];
}

export const InviteUserDialog = ({ 
  open, 
  onOpenChange, 
  onUserInvited, 
  contractors 
}: InviteUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "contractor" | "">("");
  const [contractorId, setContractorId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [createdRole, setCreatedRole] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setRole("");
    setContractorId("");
    setNote("");
  };

  const clearPasswordData = () => {
    // Security: Clear password from memory
    setGeneratedPassword("");
    setCreatedEmail("");
    setCreatedRole("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = inviteUserSchema.parse({
        email,
        role,
        contractor_id: contractorId || undefined,
        note: note || undefined,
      });

      setLoading(true);

      // Call the manage-invite edge function to create user with password
      const { data, error } = await supabase.functions.invoke('manage-invite', {
        body: {
          email: validatedData.email,
          role: validatedData.role,
          contractor_id: validatedData.contractor_id,
          note: validatedData.note,
        },
      });

      if (error) {
        throw new Error(error.message || 'Không thể tạo người dùng');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success || !data?.password) {
        throw new Error('Phản hồi không hợp lệ từ server');
      }

      // Store the credentials for the modal
      setCreatedEmail(data.email);
      setGeneratedPassword(data.password);
      setCreatedRole(data.role);

      // Show the password modal
      setShowPasswordModal(true);

      // Reset form and notify parent
      resetForm();
      onUserInvited();
      onOpenChange(false);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: "Thông tin không hợp lệ",
          description: validationError.issues[0].message,
          variant: "destructive",
        });
      } else {
        const errorMessage = (validationError as any).message || 'Đã xảy ra lỗi không xác định';
        toast({
          title: "Lỗi tạo người dùng",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = (open: boolean) => {
    setShowPasswordModal(open);
    if (!open) {
      // Security: Clear password data when modal closes
      clearPasswordData();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mời người dùng mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới với mật khẩu tạm thời
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Vai trò *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "contractor")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="contractor">Nhà thầu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "contractor" && (
              <div className="space-y-2">
                <Label htmlFor="invite-contractor">Nhà thầu *</Label>
                <Select value={contractorId} onValueChange={setContractorId}>
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
              <Label htmlFor="invite-note">Ghi chú</Label>
              <Textarea
                id="invite-note"
                placeholder="Ghi chú về người dùng (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
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
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Tạo tài khoản
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PasswordModal
        open={showPasswordModal}
        onOpenChange={handlePasswordModalClose}
        email={createdEmail}
        password={generatedPassword}
        role={createdRole}
      />
    </>
  );
};