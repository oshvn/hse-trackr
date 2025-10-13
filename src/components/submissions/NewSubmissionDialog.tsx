import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Helper function to extract numeric code
const extractNumericCode = (value?: string | null) => {
  if (!value) return '';
  const m = value.match(/^(\d+(?:\.\d+)+)/);
  return m ? m[1] : '';
};

// Helper function to check if a doc type has sub-categories
const hasSubCategories = (code: string) => {
  // Check if the code exists as a main category with sub-categories
  return Object.keys(HSE_CHECKLISTS).some(key => key.startsWith(code + '.'));
};

// Helper function to get sub-category options for a given code
const getSubCategoryOptions = (code: string) => {
  return Object.keys(HSE_CHECKLISTS)
    .filter(key => key.startsWith(code + '.'))
    .map(key => ({
      id: key,
      label: key
    }));
};

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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Reset form function
  const resetForm = useCallback(() => {
    setSelectedDocTypeId('');
    setSelectedSubCategory('');
    setDocumentLink('');
    setCheckedItems(new Set());
    setNote('');
  }, []);

  // Filter requirements based on category (memoized for performance)
  const availableRequirements = useMemo(() => {
    if (!category) return requirements;
    
    return requirements.filter(req => {
      const code = req.doc_type.code || extractNumericCode(req.doc_type.category);
      const normalizedCategory = category.replace(/\.$/, '');
      return !!code && (code === normalizedCategory || code.startsWith(normalizedCategory + '.'));
    });
  }, [requirements, category]);

  // Get selected doc type to show appropriate checklist by code (fallback to numeric prefix of category)
  const selectedDocType = useMemo(() =>
    requirements.find(req => req.doc_type_id === selectedDocTypeId),
    [requirements, selectedDocTypeId]
  );
  
  const docTypeCode = useMemo(() =>
    selectedDocType?.doc_type?.code || extractNumericCode(selectedDocType?.doc_type?.category),
    [selectedDocType]
  );
  
  // Check if this doc type has sub-categories
  const hasSubCategoriesFlag = useMemo(() =>
    docTypeCode ? hasSubCategories(docTypeCode) : false,
    [docTypeCode]
  );
  
  // Get sub-category options
  const subCategoryOptions = useMemo(() =>
    docTypeCode ? getSubCategoryOptions(docTypeCode) : [],
    [docTypeCode]
  );
  
  // Use sub-category if selected, otherwise use main doc type code
  const displayCode = selectedSubCategory || docTypeCode;
  const checklistItems = useMemo(() =>
    HSE_CHECKLISTS[displayCode || ''] || [],
    [displayCode]
  );
  
  // Get detailed category info
  const selectedCategoryInfo = useMemo(() =>
    DETAILED_CATEGORIES.find(cat => cat.id === displayCode),
    [displayCode]
  );
  
  // Extract positions from appliesTo field (memoized)
  const extractPositions = useCallback((appliesTo: string) => {
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
  }, []);
  
  const positions = useMemo(() =>
    selectedCategoryInfo ? extractPositions(selectedCategoryInfo.appliesTo) : [],
    [selectedCategoryInfo, extractPositions]
  );

  const handleCheckboxChange = useCallback((itemId: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newChecked = new Set(prev);
      if (checked) {
        newChecked.add(itemId);
      } else {
        newChecked.delete(itemId);
      }
      return newChecked;
    });
  }, []);

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

    // Check if all required items are selected
    const requiredItems = checklistItems.filter(item => item.required);
    const missingRequiredItems = requiredItems.filter(item => !checkedItems.has(item.id));
    
    if (missingRequiredItems.length > 0) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: `Vui lòng chọn các mục bắt buộc: ${missingRequiredItems.map(item => item.label).join(', ')}`,
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
      resetForm();
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

  const handleClose = useCallback(() => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  }, [uploading, resetForm, onClose]);

  // Debug log (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('NewSubmissionDialog Debug:', {
        category,
        totalRequirements: requirements.length,
        availableRequirements: availableRequirements.length,
        availableRequirementNames: availableRequirements.map(req => req.doc_type.name)
      });
    }
  }, [category, requirements, availableRequirements]);

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

          {hasSubCategoriesFlag && selectedDocTypeId && (
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

          {selectedDocTypeId && checklistItems.length > 0 && (!hasSubCategoriesFlag || selectedSubCategory) && (
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
                      const allIds = checklistItems.map(item => item.id);
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
