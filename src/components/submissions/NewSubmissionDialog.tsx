import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { mapErrorToUserMessage } from '@/lib/errorUtils';
import { HSE_CHECKLISTS, DETAILED_CATEGORIES } from '@/lib/checklistData';
import type { ContractorRequirement } from '@/pages/my-submissions';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDocTypeId('');
      setSelectedSubCategory('');
      setDocumentLink('');
      setCheckedItems(new Set());
      setNote('');
    }
  }, [open]);

  // Get selected doc type to show appropriate checklist by code (fallback to numeric prefix of category)
  const selectedDocType = requirements.find(req => req.doc_type_id === selectedDocTypeId);
  const docTypeCode = selectedDocType?.doc_type?.code || extractNumericCode(selectedDocType?.doc_type?.category);
  
  // Check if this doc type has sub-categories (like 1.1.1 Management Teams)
  const hasSubCategories = docTypeCode === '1.1.1';
  
  // Use sub-category if selected, otherwise use main doc type code
  const displayCode = selectedSubCategory || docTypeCode;
  const checklistItems = HSE_CHECKLISTS[displayCode || ''] || [];
  
  // Get detailed category info
  const selectedCategoryInfo = DETAILED_CATEGORIES.find(cat => cat.id === displayCode);
  
  // Extract positions from appliesTo field
  const extractPositions = (appliesTo: string) => {
    if (!appliesTo) return [];
    
    // Handle special cases
    if (appliesTo.includes('toàn dự án') || appliesTo.includes('từng')) {
      return [];
    }
    
    // Extract positions from the appliesTo text
    if (appliesTo.includes('Vị trí')) {
      // Extract position name from "Vị trí [Position Name]"
      const positionMatch = appliesTo.match(/Vị trí (.+)/);
      return positionMatch ? [positionMatch[1]] : [];
    }
    
    // Extract positions from comma-separated list
    const positions = appliesTo.split(',').map(pos => pos.trim());
    return positions;
  };
  
  const positions = selectedCategoryInfo ? extractPositions(selectedCategoryInfo.appliesTo) : [];
  
  // Get sub-category options for 1.1.1 Management Teams
  const subCategoryOptions = hasSubCategories ? [
    { id: "1.1.1.1", label: "1.1.1.1 Construction Manager" },
    { id: "1.1.1.2", label: "1.1.1.2 HSE Manager" },
    { id: "1.1.1.3", label: "1.1.1.3 Project Manager" },
    { id: "1.1.1.4", label: "1.1.1.4 Site Manager" },
    { id: "1.1.1.5", label: "1.1.1.5 Supervisors" }
  ] : [];

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
      setSelectedSubCategory('');
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
      setSelectedSubCategory('');
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
        const normalizedCategory = (category || '').replace(/\.$/, '');
        const result = !!code && (code === normalizedCategory || code.startsWith(normalizedCategory + '.'));
        // Debug log
        if (process.env.NODE_ENV === 'development') {
          console.log('Filtering requirement:', {
            docTypeName: req.doc_type.name,
            docTypeCode: req.doc_type.code,
            docTypeCategory: req.doc_type.category,
            extractedCode: code,
            category: normalizedCategory,
            matches: result
          });
        }
        return result;
      })
    : requirements;
    
  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('NewSubmissionDialog Debug:', {
      category,
      totalRequirements: requirements.length,
      availableRequirements: availableRequirements.length,
      availableRequirementNames: availableRequirements.map(req => req.doc_type.name)
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Submission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select
              value={selectedDocTypeId}
              onValueChange={(value) => {
                setSelectedDocTypeId(value);
                setSelectedSubCategory(''); // Reset sub-category when changing doc type
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
            {availableRequirements.length === 0 && (
              <p className="text-xs text-destructive mt-1">
                Không có loại tài liệu trong mục này. Vui lòng chọn tab khác hoặc liên hệ quản trị viên để được gán yêu cầu.
              </p>
            )}
          </div>

          {hasSubCategories && selectedDocTypeId && (
            <div className="space-y-2">
              <Label htmlFor="subCategory">Position / Sub-category</Label>
              <Select
                value={selectedSubCategory}
                onValueChange={(value) => {
                  setSelectedSubCategory(value);
                  setCheckedItems(new Set()); // Reset checklist when changing sub-category
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDocTypeId && checklistItems.length > 0 && (!hasSubCategories || selectedSubCategory) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Checklist for {selectedCategoryInfo?.title}
                  <Badge variant="outline">
                    {selectedCategoryInfo?.format}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <p><strong>Applies to:</strong> {selectedCategoryInfo?.appliesTo}</p>
                    {positions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">Vị trí:</span>
                        {positions.map((position, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-60 pr-4">
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-2 rounded-md border">
                        <Checkbox
                          id={item.id}
                          checked={checkedItems.has(item.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={item.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                          >
                            {item.label}
                            {item.required && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {!item.required && <AlertCircle className="h-3 w-3 text-amber-500" />}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.required ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-between items-center mt-4 text-sm">
                  <span className="text-muted-foreground">
                    Selected: {checkedItems.size}/{checklistItems.length} items
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = checklistItems.map(item => item.id) || [];
                      setCheckedItems(new Set(allIds));
                    }}
                  >
                    Select All
                  </Button>
                </div>
              </CardContent>
            </Card>
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
