import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { mapErrorToUserMessage } from '@/lib/errorUtils';
import { HSE_CHECKLISTS, MAJOR_CATEGORIES, DETAILED_CATEGORIES, SUB_CATEGORIES } from '@/lib/checklistData';
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
  const [documentLink, setDocumentLink] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const { toast } = useToast();

  const extractNumericCode = (value?: string | null) => {
    if (!value) return '';
    const m = value.match(/^(\d+(?:\.\d+)+)/);
    return m ? m[1] : '';
  };

  // Reset form when dialog opens or category changes
  useEffect(() => {
    if (open) {
      setSelectedDocTypeId('');
      setDocumentLink('');
      setCheckedItems(new Set());
      setNote('');
      setSelectedCategory(category || '');
      setSelectedSubCategory('');
    }
  }, [open, category]);

  // Get selected doc type to show appropriate checklist by code (fallback to numeric prefix of category)
  const selectedDocType = requirements.find(req => req.doc_type_id === selectedDocTypeId);
  const docTypeCode = selectedDocType?.doc_type?.code || extractNumericCode(selectedDocType?.doc_type?.category);
  const checklistItems = HSE_CHECKLISTS[docTypeCode || ''] || [];
  
  // Get detailed category info
  const selectedCategoryInfo = DETAILED_CATEGORIES.find(cat => cat.id === selectedCategory);
  const selectedSubCategoryInfo = DETAILED_CATEGORIES.find(cat => cat.id === selectedSubCategory);

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
      setSelectedCategory('');
      setSelectedSubCategory('');
      onClose();
    }
  };

  // Filter requirements based on selected category and subcategory
  const availableRequirements = selectedSubCategory
    ? requirements.filter(req => {
        const code = req.doc_type.code || extractNumericCode(req.doc_type.category);
        return !!code && code === selectedSubCategory;
      })
    : selectedCategory
    ? requirements.filter(req => {
        const code = req.doc_type.code || extractNumericCode(req.doc_type.category);
        return !!code && (code === selectedCategory || code.startsWith(selectedCategory + '.'));
      })
    : requirements;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Submission
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="category" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category">Choose Category</TabsTrigger>
              <TabsTrigger value="submission">Submission Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="category" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                {/* Main Category Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Document Category</CardTitle>
                    <CardDescription>
                      Choose the main category for the document you want to submit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {MAJOR_CATEGORIES.map((cat) => (
                        <Button
                          key={cat.value}
                          variant={selectedCategory === cat.value ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => {
                            setSelectedCategory(cat.value);
                            setSelectedSubCategory('');
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{cat.label}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sub Category Selection */}
                {selectedCategory && SUB_CATEGORIES[selectedCategory] && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Sub-Category</CardTitle>
                      <CardDescription>
                        Choose the specific sub-category for your document
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SUB_CATEGORIES[selectedCategory].map((subCat) => (
                          <Button
                            key={subCat.id}
                            variant={selectedSubCategory === subCat.id ? "default" : "outline"}
                            className="justify-start h-auto p-3"
                            onClick={() => setSelectedSubCategory(subCat.id)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{subCat.label}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Details and Checklist */}
                {(selectedCategoryInfo || selectedSubCategoryInfo) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Checklists for {selectedSubCategoryInfo?.title || selectedCategoryInfo?.title}
                        <Badge variant="outline">
                          {(selectedSubCategoryInfo || selectedCategoryInfo)?.format}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <p><strong>Applies to:</strong> {(selectedSubCategoryInfo || selectedCategoryInfo)?.appliesTo}</p>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-60 pr-4">
                        <div className="space-y-3">
                          {(selectedSubCategoryInfo || selectedCategoryInfo)?.items.map((item) => (
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
                          Selected: {checkedItems.size}/{(selectedSubCategoryInfo || selectedCategoryInfo)?.items.length} items
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allIds = (selectedSubCategoryInfo || selectedCategoryInfo)?.items.map(item => item.id) || [];
                            setCheckedItems(new Set(allIds));
                          }}
                        >
                          Select All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (checkedItems.size > 0) {
                        // Find a document type that matches the selected category/subcategory
                        const matchingReq = availableRequirements.find(req => {
                          const code = req.doc_type.code || extractNumericCode(req.doc_type.category);
                          return code === selectedSubCategory || code === selectedCategory;
                        });
                        
                        if (matchingReq) {
                          setSelectedDocTypeId(matchingReq.doc_type_id);
                        }
                      }
                    }}
                    disabled={checkedItems.size === 0}
                  >
                    Continue to Submission
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="submission" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Details</CardTitle>
                    <CardDescription>
                      Provide the document link and any additional notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      {(selectedCategory || selectedSubCategory) && (
                        <p className="text-xs text-muted-foreground">
                          Showing {selectedSubCategory || selectedCategory} documents only
                        </p>
                      )}
                    </div>

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
                  </CardContent>
                </Card>

                {selectedDocTypeId && checklistItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Checklist Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Selected items:</span>
                          <span className="text-sm">{checkedItems.size}/{checklistItems.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(checkedItems.size / checklistItems.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory('')}
                    disabled={uploading}
                    className="flex-1"
                  >
                    Back to Categories
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
