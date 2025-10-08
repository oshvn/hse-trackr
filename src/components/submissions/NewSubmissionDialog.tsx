import React, { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { mapErrorToUserMessage } from '@/lib/errorUtils';
import { HSE_CHECKLISTS } from '@/lib/checklistData';
import type { ContractorRequirement } from '@/pages/my-submissions';

// Input validation schema
const submissionSchema = z.object({
  docTypeId: z.string().uuid('Invalid document type'),
  note: z.string().max(1000, 'Note must be less than 1000 characters').optional(),
  documentLink: z.string().url('Link không hợp lệ. Vui lòng nhập link đầy đủ (bắt đầu với http:// hoặc https://)').min(1, 'Vui lòng nhập link hồ sơ'),
  checklist: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất một mục trong checklist')
});

interface NewSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (docTypeId: string, documentLink: string, note: string, checklist: string[]) => Promise<void>;
  requirements: ContractorRequirement[];
  category: string | null;
}

export const NewSubmissionDialog: React.FC<NewSubmissionDialogProps> = ({
  open,
  onClose,
  onSubmit,
  requirements,
  category
}) => {
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');
  const [documentLink, setDocumentLink] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const { toast } = useToast();

  const extractNumericCode = (value?: string | null) => {
    if (!value) return '';
    const m = value.match(/^(\d+(?:\.\d+)+)/);
    return m ? m[1] : '';
  };

  // Get selected doc type to show appropriate checklist by code (fallback to numeric prefix of category)
  const selectedDocType = requirements.find(req => req.doc_type_id === selectedDocTypeId);
  const docTypeCode = selectedDocType?.doc_type?.code || extractNumericCode(selectedDocType?.doc_type?.category);
  const checklistItems = HSE_CHECKLISTS[docTypeCode || ''] || [];

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    const newChecked = new Set(checkedItems);
    if (checked) {
      newChecked.add(itemId);
    } else {
      newChecked.delete(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handleSubmit = async () => {
    if (!selectedDocTypeId || !documentLink.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn loại tài liệu và nhập link hồ sơ",
        variant: "destructive"
      });
      return;
    }

    if (checkedItems.size === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ít nhất một mục trong checklist",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Validate all input data
      const validationResult = submissionSchema.safeParse({
        docTypeId: selectedDocTypeId,
        note: note.trim() || undefined,
        documentLink: documentLink.trim(),
        checklist: Array.from(checkedItems)
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        toast({
          title: "Dữ liệu không hợp lệ",
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }

      await onSubmit(
        validationResult.data.docTypeId,
        validationResult.data.documentLink,
        validationResult.data.note || '',
        validationResult.data.checklist
      );

      // Reset form
      setSelectedDocTypeId('');
      setDocumentLink('');
      setCheckedItems(new Set());
      setNote('');
      onClose();
      
      toast({
        title: "Thành công",
        description: "Tài liệu đã được nộp thành công"
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: mapErrorToUserMessage(error),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedDocTypeId('');
      setDocumentLink('');
      setCheckedItems(new Set());
      setNote('');
      onClose();
    }
  };

  // Filter requirements based on category
  const availableRequirements = category 
    ? requirements.filter(req => {
        const code = req.doc_type.code || extractNumericCode(req.doc_type.category);
        return !!code && (code === category || code.startsWith(category + '.'));
      })
    : requirements;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select
              value={selectedDocTypeId}
              onValueChange={(value) => {
                setSelectedDocTypeId(value);
                setCheckedItems(new Set()); // Reset checklist when changing doc type
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {availableRequirements.map(req => (
                  <SelectItem key={req.id} value={req.doc_type_id}>
                    <div className="flex items-center gap-2">
                      <span>{req.doc_type.name}</span>
                      {req.doc_type.is_critical && (
                        <span className="text-red-500 text-xs">🔴</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <p className="text-xs text-muted-foreground">
                Showing {category} documents only
              </p>
            )}
          </div>

          {selectedDocTypeId && checklistItems.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-base font-semibold">Checklist hồ sơ yêu cầu</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                    />
                    <label
                      htmlFor={item.id}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Đã chọn: {checkedItems.size}/{checklistItems.length} mục
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="documentLink">Link hồ sơ (đã chia sẻ)</Label>
            <Input
              id="documentLink"
              type="url"
              placeholder="https://drive.google.com/... hoặc https://..."
              value={documentLink}
              onChange={(e) => setDocumentLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nhập link Google Drive, OneDrive hoặc link chia sẻ khác (đảm bảo đã bật chia sẻ)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              placeholder="Thêm ghi chú cho quản trị viên (tùy chọn)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDocTypeId || !documentLink.trim() || checkedItems.size === 0 || uploading}
              className="flex-1"
            >
              {uploading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
