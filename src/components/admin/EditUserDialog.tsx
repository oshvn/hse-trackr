import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/hooks/useSessionRole";

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

const ROLE_LABEL: Record<UserProfile["role"], string> = {
  admin: "Administrator",
  contractor: "Contractor",
};

const STATUS_LABEL: Record<UserProfile["status"], string> = {
  invited: "Invited",
  active: "Active",
  deactivated: "Deactivated",
};

export const EditUserDialog = ({
  open,
  onOpenChange,
  user,
  contractors,
  onUserUpdated,
  isSuperAdmin = false,
}: EditUserDialogProps) => {
  const { toast } = useToast();

  const [role, setRole] = useState<UserProfile["role"]>(user.role);
  const [contractorId, setContractorId] = useState<string>(user.contractor_id ?? "");
  const [status, setStatus] = useState<UserProfile["status"]>(user.status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const readOnly = isSuperAdmin;

  useEffect(() => {
    setRole(user.role);
    setContractorId(user.contractor_id ?? "");
    setStatus(user.status);
    setNote("");
  }, [user]);

  const contractorOptions = useMemo(() => contractors, [contractors]);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (readOnly) {
      onOpenChange(false);
      return;
    }

    if (role === "contractor" && !contractorId) {
      toast({
        title: "Missing information",
        description: "Select a contractor for this account before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const updatePayload: Record<string, unknown> = {
        role,
        status,
        updated_at: new Date().toISOString(),
        contractor_id: role === "contractor" ? contractorId : null,
        note: note.trim() ? note.trim() : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Update successful",
        description: "User information has been saved.",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
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
        .from("profiles")
        .update({
          status: "deactivated",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Account deactivated",
        description: "The user account has been deactivated.",
      });

      setShowDeactivateDialog(false);
      onUserUpdated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to deactivate user.";
      toast({
        title: "Deactivation failed",
        description: message,
        variant: "destructive",
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
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update details and permissions for {user.email}
            </DialogDescription>
          </DialogHeader>

          {readOnly && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Super Admin accounts cannot be edited from this screen.
            </div>
          )}

          <form onSubmit={handleUpdate} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserProfile["role"])}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === "contractor" && (
              <div className="space-y-2">
                <Label htmlFor="edit-contractor">Contractor</Label>
                <Select
                  value={contractorId}
                  onValueChange={setContractorId}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractorOptions.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as UserProfile["status"])}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note">Update note</Label>
              <Textarea
                id="edit-note"
                placeholder="Add a note about this change (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
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
                Cancel
              </Button>

              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeactivateDialog(true)}
                  disabled={loading || status === "deactivated"}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deactivate
                </Button>
              )}

              <Button type="submit" disabled={loading || readOnly}>
                {loading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {user.email}? The user will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Processing..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
