import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HSE_CHECKLISTS, CATEGORY_HIERARCHY, CategoryNode, findCategoryNode } from '@/lib/checklistData';
import { AlertCircle, Save, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface DocTypeRow {
  id: string;
  name: string;
  category: string;
  code: string;
  is_critical: boolean;
  weight: number;
}

interface ChecklistRequirementRow {
  id: string;
  doc_type_id: string;
  checklist_item_id: string;
  checklist_label: string;
  is_required: boolean;
  position: number;
}

export const ChecklistRequirementsManager: React.FC = () => {
  const { toast } = useToast();
  const [docTypes, setDocTypes] = useState<DocTypeRow[]>([]);
  const [checklistRequirements, setChecklistRequirements] = useState<ChecklistRequirementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocType, setExpandedDocType] = useState<string | null>(null);
  const [savingDocTypeId, setSavingDocTypeId] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Load doc_types instead
      const { data: docTypesData, error: docTypesError } = await supabase
        .from('doc_types')
        .select('*')
        .order('name');

      if (docTypesError) throw docTypesError;

      setDocTypes(docTypesData || []);
      setChecklistRequirements([]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải danh sách yêu cầu checklist',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lấy danh sách checklist items cho một doc_type dựa trên mã
  const getChecklistItemsForDocType = useCallback((docType: DocTypeRow) => {
    // Tìm từ HSE_CHECKLISTS bằng document_name hoặc id
    const checklistKey = docType.name || docType.id;
    return HSE_CHECKLISTS[checklistKey] || [];
  }, []);

  // Lấy requirements cho một doc_type
  const getRequirementsForDocType = useCallback(
    (docTypeId: string) => {
      return checklistRequirements.filter(req => req.doc_type_id === docTypeId);
    },
    [checklistRequirements]
  );

  // Tìm checklist items cho doc_type
  const getAvailableChecklistItems = useCallback(
    (docType: DocTypeRow) => {
      const items = getChecklistItemsForDocType(docType);
      return items.map(item => ({
        id: item.id,
        label: item.label
      }));
    },
    [getChecklistItemsForDocType]
  );

  // Disabled for now - no checklist_requirements table
  const handleToggleRequired = async (checklistReq: ChecklistRequirementRow, newValue: boolean) => {
    toast({
      title: 'Chức năng chưa khả dụng',
      description: 'Tính năng này sẽ được bổ sung sau',
      variant: 'default'
    });
  };

  // Disabled for now - no checklist_requirements table
  const handleInitializeChecklistItems = async (docType: DocTypeRow) => {
    toast({
      title: 'Chức năng chưa khả dụng',
      description: 'Tính năng này sẽ được bổ sung sau',
      variant: 'default'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCcw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Cấu Hình Yêu Cầu Checklist
          </CardTitle>
          <CardDescription>
            Đánh dấu tài liệu nào là bắt buộc cho từng loại tài liệu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">Hướng dẫn:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Nhấp vào loại tài liệu để mở danh sách checklist</li>
                  <li>Nút "Khởi tạo Checklist" để thêm tất cả mục checklist</li>
                  <li>Tắt/Bật công tắc để đánh dấu bắt buộc/tùy chọn</li>
                  <li>Thay đổi sẽ được lưu tự động</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] border rounded-lg p-4">
        <div className="space-y-3">
          {docTypes.map(docType => {
            const requirementsForDocType = getRequirementsForDocType(docType.id);
            const isExpanded = expandedDocType === docType.id;
            const availableItems = getAvailableChecklistItems(docType);

            return (
              <Card key={docType.id} className="overflow-hidden">
                <div
                  className="cursor-pointer hover:bg-muted/50 p-4 flex items-center justify-between"
                  onClick={() => setExpandedDocType(isExpanded ? null : docType.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{docType.name}</h3>
                        {docType.is_critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {requirementsForDocType.length}/{availableItems.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {docType.category} • Code: {docType.code}
                      </p>
                    </div>
                  </div>
                  {requirementsForDocType.length === 0 && availableItems.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInitializeChecklistItems(docType);
                      }}
                      disabled={savingDocTypeId === docType.id}
                    >
                      {savingDocTypeId === docType.id ? 'Đang khởi tạo...' : 'Khởi tạo Checklist'}
                    </Button>
                  )}
                </div>

                {isExpanded && requirementsForDocType.length > 0 && (
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    {requirementsForDocType.map(req => (
                      <div key={req.id} className="flex items-center justify-between gap-3 p-3 bg-background rounded-md border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{req.checklist_label}</p>
                          <p className="text-xs text-muted-foreground">{req.checklist_item_id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={req.is_required}
                            onCheckedChange={(checked) => handleToggleRequired(req, checked)}
                          />
                          <Badge variant={req.is_required ? 'default' : 'secondary'} className="text-xs">
                            {req.is_required ? 'Bắt buộc' : 'Tùy chọn'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && requirementsForDocType.length === 0 && availableItems.length > 0 && (
                  <div className="border-t p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Không có checklist item nào được cấu hình
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleInitializeChecklistItems(docType)}
                      disabled={savingDocTypeId === docType.id}
                    >
                      {savingDocTypeId === docType.id ? 'Đang khởi tạo...' : 'Khởi tạo Checklist Items'}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={loadData}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Tải lại
        </Button>
      </div>
    </div>
  );
};

// Alert component placeholder
const Alert = ({ children, className }: any) => (
  <div className={`border border-yellow-200 bg-yellow-50 rounded-lg p-3 ${className}`}>{children}</div>
);

const AlertDescription = ({ children }: any) => <div className="text-sm">{children}</div>;
