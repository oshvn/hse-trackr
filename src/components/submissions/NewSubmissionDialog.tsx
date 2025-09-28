import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ContractorRequirement } from '@/pages/ContractorSubmissions';

interface NewSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (docTypeId: string, file: File) => Promise<void>;
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
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDocTypeId || !selectedFile) {
      toast({
        title: "Missing information",
        description: "Please select a document type and file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      await onSubmit(selectedDocTypeId, selectedFile);
      
      // Reset form
      setSelectedDocTypeId('');
      setSelectedFile(null);
      onClose();
      
      toast({
        title: "Success",
        description: "Document submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting document:', error);
      toast({
        title: "Error",
        description: "Failed to submit document",
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
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
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