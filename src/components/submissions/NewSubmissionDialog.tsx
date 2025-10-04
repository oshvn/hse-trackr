import React, { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mapErrorToUserMessage } from '@/lib/errorUtils';
import type { ContractorRequirement } from '@/pages/my-submissions';

// Input validation schema
const submissionSchema = z.object({
  docTypeId: z.string().uuid('Invalid document type'),
  note: z.string().max(1000, 'Note must be less than 1000 characters').optional(),
  file: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    return allowedTypes.includes(file.type);
  }, {
    message: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG'
  }).refine((file) => {
    // Validate file size (10MB max)
    return file instanceof File && file.size <= 10 * 1024 * 1024;
  }, {
    message: 'File size must be less than 10MB'
  })
});

interface NewSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (docTypeId: string, file: File, note: string) => Promise<void>;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file immediately
      const fileValidation = submissionSchema.shape.file.safeParse(file);
      
      if (!fileValidation.success) {
        toast({
          title: "File không hợp lệ",
          description: fileValidation.error.issues[0].message,
          variant: "destructive"
        });
        // Reset file input
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDocTypeId || !selectedFile) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn loại tài liệu và file",
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
        file: selectedFile
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
        validationResult.data.file,
        validationResult.data.note || ''
      );

      // Reset form
      setSelectedDocTypeId('');
      setSelectedFile(null);
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
      setSelectedFile(null);
      setNote('');
      onClose();
    }
  };

  // Filter requirements based on category
  const availableRequirements = category 
    ? requirements.filter(req => req.doc_type.category === category)
    : requirements;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select
              value={selectedDocTypeId}
              onValueChange={setSelectedDocTypeId}
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

          <div className="space-y-2">
            <Label htmlFor="file">Upload Document</Label>
            <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-primary mx-auto" />
                  <div className="text-sm font-medium">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Click to select a file or drag and drop
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX up to 10MB
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
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
              disabled={!selectedDocTypeId || !selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};