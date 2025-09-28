import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const inviteUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["admin", "contractor"], { required_error: "Vui lòng chọn vai trò" }),
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
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setRole("");
    setContractorId("");
    setNote("");
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

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', validatedData.email)
        .single();

      if (existingProfile) {
        toast({
          title: "Người dùng đã tồn tại",
          description: "Email này đã được sử dụng trong hệ thống.",
          variant: "destructive",
        });
        return;
      }

      // Add to allowed users email list
      const { error: allowedError } = await supabase
        .from('allowed_users_email')
        .insert([{ email: validatedData.email }]);

      if (allowedError && !allowedError.message.includes('duplicate')) {
        throw allowedError;
      }

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          email: validatedData.email,
          role: validatedData.role,
          contractor_id: validatedData.contractor_id,
          status: 'invited',
          note: validatedData.note,
        }]);

      if (profileError) throw profileError;

      toast({
        title: "Mời người dùng thành công",
        description: `Đã gửi lời mời đến ${validatedData.email}. Họ có thể đăng ký tài khoản với email này.`,
      });

      resetForm();
      onUserInvited();
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast({
          title: "Thông tin không hợp lệ",
          description: validationError.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi mời người dùng",
          description: (validationError as any).message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mời người dùng mới</DialogTitle>
          <DialogDescription>
            Thêm người dùng mới vào hệ thống và phân quyền phù hợp
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
              Mời người dùng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};