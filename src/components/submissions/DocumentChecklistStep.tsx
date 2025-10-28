import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CategoryNode } from '@/lib/checklistData';

interface ChecklistRequirement {
  id: string;
  checklist_item_id: string;
  checklist_label: string;
  is_required: boolean;
}

interface DocumentChecklistStepProps {
  selectedCategory: CategoryNode;
  onBack: () => void;
  onNext: (checkedItems: string[], documentLink: string) => void;
}

export const DocumentChecklistStep: React.FC<DocumentChecklistStepProps> = ({
  selectedCategory,
  onBack,
  onNext
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [documentLink, setDocumentLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [checklistRequirements, setChecklistRequirements] = useState<ChecklistRequirement[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(true);

  // Lấy yêu cầu từ database
  useEffect(() => {
    const loadChecklistRequirements = async () => {
      try {
        setLoadingRequirements(true);
        
        // Tìm doc_type_id dựa trên docTypeId (code)
        const { data: docTypeData, error: docTypeError } = await supabase
          .from('doc_types')
          .select('id')
          .eq('code', selectedCategory.docTypeId)
          .single();

        if (docTypeError) {
          console.warn('Could not find doc_type:', docTypeError);
          // Fallback: use hardcoded required_documents từ CategoryNode
          if (selectedCategory.required_documents) {
            const fallbackReqs = selectedCategory.required_documents.map(doc => ({
              id: doc.id,
              checklist_item_id: doc.id,
              checklist_label: doc.label,
              is_required: doc.required !== false
            }));
            setChecklistRequirements(fallbackReqs);
          }
          setLoadingRequirements(false);
          return;
        }

        // Lấy checklist requirements từ database
        const { data: requirementsData, error: requirementsError } = await supabase
          .from('checklist_requirements')
          .select('id, checklist_item_id, checklist_label, is_required')
          .eq('doc_type_id', docTypeData.id)
          .order('position');

        if (requirementsError) throw requirementsError;

        if (requirementsData && requirementsData.length > 0) {
          setChecklistRequirements(requirementsData);
        } else {
          // Fallback: use hardcoded từ CategoryNode nếu không có trong database
          if (selectedCategory.required_documents) {
            const fallbackReqs = selectedCategory.required_documents.map(doc => ({
              id: doc.id,
              checklist_item_id: doc.id,
              checklist_label: doc.label,
              is_required: doc.required !== false
            }));
            setChecklistRequirements(fallbackReqs);
          }
        }
      } catch (error) {
        console.error('Error loading checklist requirements:', error);
        // Fallback
        if (selectedCategory.required_documents) {
          const fallbackReqs = selectedCategory.required_documents.map(doc => ({
            id: doc.id,
            checklist_item_id: doc.id,
            checklist_label: doc.label,
            is_required: doc.required !== false
          }));
          setChecklistRequirements(fallbackReqs);
        }
      } finally {
        setLoadingRequirements(false);
      }
    };

    loadChecklistRequirements();
  }, [selectedCategory]);

  // Lấy danh sách tài liệu cần thiết
  const requiredDocuments = useMemo(() => {
    return checklistRequirements;
  }, [checklistRequirements]);

  // Kiểm tra xem tất cả tài liệu bắt buộc đã được chọn
  const requiredItems = useMemo(() => {
    return requiredDocuments.filter(item => item.is_required === true);
  }, [requiredDocuments]);

  const allRequiredChecked = useMemo(() => {
    return requiredItems.every(item => checkedItems.has(item.checklist_item_id));
  }, [requiredItems, checkedItems]);

  // Kiểm tra link hợp lệ
  const isValidLink = useMemo(() => {
    if (!documentLink.trim()) return false;
    try {
      new URL(documentLink);
      return true;
    } catch {
      return false;
    }
  }, [documentLink]);

  // Kiểm tra có thể tiến hành bước tiếp theo
  const canProceed = allRequiredChecked && isValidLink;

  const handleCheckboxChange = useCallback((itemId: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setCheckedItems(new Set(requiredDocuments.map(item => item.checklist_item_id)));
  }, [requiredDocuments]);

  const handleLinkChange = (value: string) => {
    setDocumentLink(value);
    if (value.trim()) {
      try {
        new URL(value);
        setLinkError('');
      } catch {
        setLinkError('Link không hợp lệ. Vui lòng nhập link đầy đủ (bắt đầu với http:// hoặc https://)');
      }
    }
  };

  const handleNext = () => {
    if (canProceed) {
      onNext(Array.from(checkedItems), documentLink);
    }
  };

  const progressPercent = requiredDocuments.length > 0 
    ? Math.round((checkedItems.size / requiredDocuments.length) * 100)
    : 0;

  if (loadingRequirements) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải danh sách tài liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Kiểm tra danh sách tài liệu</h2>
        <p className="text-muted-foreground">
          Danh mục: <span className="font-semibold text-foreground">{selectedCategory.name}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="bg-muted">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tiến độ kiểm tra</span>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Danh sách tài liệu cần thiết</span>
            <Badge variant="outline">{requiredDocuments.length} tài liệu</Badge>
          </CardTitle>
          <CardDescription>
            Đánh dấu vào những tài liệu đã có. Tất cả tài liệu bắt buộc phải được chọn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="border rounded-lg p-4 h-64">
            <div className="space-y-3 pr-4">
              {requiredDocuments.map((item) => (
                <div key={item.checklist_item_id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                  <Checkbox
                    id={item.checklist_item_id}
                    checked={checkedItems.has(item.checklist_item_id)}
                    onCheckedChange={(checked) => handleCheckboxChange(item.checklist_item_id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={item.checklist_item_id}
                      className="text-sm font-medium cursor-pointer block"
                    >
                      {item.checklist_label}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {item.is_required ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Bắt buộc</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <span className="text-xs text-amber-600 font-medium">Tùy chọn</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-2">
            <span className="text-xs text-muted-foreground">
              Đã chọn: {checkedItems.size}/{requiredDocuments.length}
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Chọn tất cả
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents Status */}
      {!allRequiredChecked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Các tài liệu bắt buộc chưa được chọn:</p>
              <ul className="list-disc list-inside text-sm">
                {requiredItems
                  .filter(item => !checkedItems.has(item.checklist_item_id))
                  .map(item => (
                    <li key={item.checklist_item_id}>{item.checklist_label}</li>
                  ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Document Link Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link nộp tài liệu</CardTitle>
          <CardDescription>
            Nhập link duy nhất (Google Drive, OneDrive, v.v.) chứa tất cả tài liệu đã liệt kê ở trên
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="docLink">Link chia sẻ *</Label>
          <Input
            id="docLink"
            type="url"
            placeholder="https://drive.google.com/... hoặc https://..."
            value={documentLink}
            onChange={(e) => handleLinkChange(e.target.value)}
            className={linkError ? 'border-red-500' : ''}
          />
          {linkError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {linkError}
            </p>
          )}
          {isValidLink && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Link hợp lệ
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="flex-1" />
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center gap-2"
        >
          Tiếp tục
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
