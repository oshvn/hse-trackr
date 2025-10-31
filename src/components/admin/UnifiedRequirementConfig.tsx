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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HSE_CHECKLISTS } from '@/lib/checklistData';
import { AlertCircle, Save, RefreshCcw, ChevronDown, ChevronUp, Copy, Trash2, Plus } from 'lucide-react';

interface DocTypeRow {
  id: string;
  name: string;
  document_name: string | null;
  category: string | null;
  is_critical: boolean;
}

interface ChecklistRequirementRow {
  id: string;
  doc_type_id: string;
  checklist_item_id: string;
  checklist_label: string;
  is_required: boolean;
  position: number;
}

interface ContractorRow {
  id: string;
  name: string;
}

interface ContractorRequirementRow {
  id: string;
  contractor_id: string;
  doc_type_id: string;
  required_count: number;
  planned_due_date: string | null;
}

interface UnifiedConfig {
  docType: DocTypeRow;
  checklistItems: ChecklistRequirementRow[];
  contractorRequirements: Map<string, ContractorRequirementRow>;
}

export const UnifiedRequirementConfig: React.FC = () => {
  const { toast } = useToast();
  
  const [docTypes, setDocTypes] = useState<DocTypeRow[]>([]);
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [checklistRequirements, setChecklistRequirements] = useState<ChecklistRequirementRow[]>([]);
  const [contractorRequirements, setContractorRequirements] = useState<ContractorRequirementRow[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedDocTypeId, setExpandedDocTypeId] = useState<string | null>(null);
  const [savingDocTypeId, setSavingDocTypeId] = useState<string | null>(null);
  const [editingDocTypeId, setEditingDocTypeId] = useState<string | null>(null);
  
  const [editDocType, setEditDocType] = useState<Partial<DocTypeRow>>({});
  const [newDocType, setNewDocType] = useState({
    name: '',
    document_name: '',
    category: '',
    is_critical: false,
  });
  // State cho contractor requirements form (key: `${docTypeId}-${contractorId}`)
  const [contractorFormValues, setContractorFormValues] = useState<Record<string, { requiredCount: number; plannedDueDate: string }>>({});

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [docTypesRes, contractorsRes, checklistRes, contractorReqRes] = await Promise.all([
        supabase.from('doc_types' as any).select('*'),
        supabase.from('contractors' as any).select('id, name').order('name'),
        supabase.from('checklist_requirements' as any).select('*').order('doc_type_id').order('position'),
        supabase.from('contractor_requirements' as any).select('*'),
      ]);

      if (docTypesRes.error) throw docTypesRes.error;
      if (contractorsRes.error) throw contractorsRes.error;
      if (checklistRes.error) throw checklistRes.error;
      if (contractorReqRes.error) throw contractorReqRes.error;

      setDocTypes((docTypesRes.data || []) as any);
      setContractors((contractorsRes.data || []) as any);
      setChecklistRequirements((checklistRes.data || []) as any);
      const contractorReqData = (contractorReqRes.data || []) as any;
      setContractorRequirements(contractorReqData);
      
      // Initialize form values from database
      const initialFormValues: Record<string, { requiredCount: number; plannedDueDate: string }> = {};
      contractorReqData.forEach((req: ContractorRequirementRow) => {
        const key = `${req.doc_type_id}-${req.contractor_id}`;
        initialFormValues[key] = {
          requiredCount: req.required_count ?? 0,
          plannedDueDate: req.planned_due_date ?? ''
        };
      });
      setContractorFormValues(prev => ({ ...prev, ...initialFormValues }));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải cấu hình yêu cầu',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Get checklist items for a doc type
  const getChecklistItemsForDocType = useCallback((docTypeName: string | null) => {
    if (!docTypeName) return [];
    return HSE_CHECKLISTS[docTypeName] || [];
  }, []);

  // Get requirements for a specific doc type
  const getRequirementsForDocType = useCallback((docTypeId: string) => {
    return checklistRequirements.filter(req => req.doc_type_id === docTypeId);
  }, [checklistRequirements]);

  // Get contractor requirements for a doc type
  const getContractorRequirementsForDocType = useCallback((docTypeId: string) => {
    const map = new Map<string, ContractorRequirementRow>();
    contractorRequirements
      .filter(req => req.doc_type_id === docTypeId)
      .forEach(req => {
        map.set(req.contractor_id, req);
      });
    return map;
  }, [contractorRequirements]);

  // Initialize checklist for a doc type
  const handleInitializeChecklist = async (docType: DocTypeRow) => {
    setSavingDocTypeId(docType.id);
    try {
      const availableItems = getChecklistItemsForDocType(docType.name);
      const existingReqs = getRequirementsForDocType(docType.id);

      const itemsToAdd = availableItems.filter(item =>
        !existingReqs.find(req => req.checklist_item_id === item.id)
      );

      if (itemsToAdd.length === 0) {
        toast({
          title: 'Không có mục mới',
          description: 'Tất cả mục checklist đã được thêm'
        });
        setSavingDocTypeId(null);
        return;
      }

      const newRecords = itemsToAdd.map((item, index) => ({
        doc_type_id: docType.id,
        checklist_item_id: item.id,
        checklist_label: item.label,
        is_required: item.required !== false,
        position: existingReqs.length + index
      }));

      const { error } = await supabase
        .from('checklist_requirements' as any)
        .insert(newRecords as any);

      if (error) throw error;

      toast({
        title: 'Thêm thành công',
        description: `Đã thêm ${itemsToAdd.length} mục checklist`
      });

      await loadAllData();
    } catch (error) {
      console.error('Error initializing checklist:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm mục checklist',
        variant: 'destructive'
      });
    } finally {
      setSavingDocTypeId(null);
    }
  };

  // Toggle checklist item required status
  const handleToggleChecklistRequired = async (checklistReq: ChecklistRequirementRow, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('checklist_requirements' as any)
        .update({ is_required: newValue } as any)
        .eq('id', checklistReq.id);

      if (error) throw error;

      setChecklistRequirements(prev =>
        prev.map(req =>
          req.id === checklistReq.id ? { ...req, is_required: newValue } : req
        )
      );

      toast({
        title: 'Cập nhật thành công',
        description: `${checklistReq.checklist_label} - ${newValue ? 'bắt buộc' : 'tùy chọn'}`
      });
    } catch (error) {
      console.error('Error toggling requirement:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật',
        variant: 'destructive'
      });
    }
  };

  // Save contractor requirement
  const handleSaveContractorRequirement = async (
    docTypeId: string,
    contractorId: string,
    requiredCount: number,
    plannedDueDate: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('contractor_requirements' as any)
        .upsert({
          doc_type_id: docTypeId,
          contractor_id: contractorId,
          required_count: requiredCount,
          planned_due_date: plannedDueDate || null,
        } as any, { onConflict: 'doc_type_id,contractor_id' });

      if (error) throw error;

      toast({
        title: 'Lưu thành công',
        description: 'Yêu cầu nhà thầu đã được cập nhật'
      });

      await loadAllData();
    } catch (error) {
      console.error('Error saving contractor requirement:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu yêu cầu',
        variant: 'destructive'
      });
    }
  };

  // Update doc type
  const handleUpdateDocType = async (docTypeId: string) => {
    setSavingDocTypeId(docTypeId);
    try {
      const { error } = await supabase
        .from('document_types' as any)
        .update({
          name: editDocType.name,
          document_name: editDocType.document_name,
          category: editDocType.category,
          is_critical: editDocType.is_critical,
        })
        .eq('id', docTypeId);

      if (error) throw error;

      toast({
        title: 'Cập nhật thành công',
        description: 'Loại tài liệu đã được cập nhật'
      });

      setEditingDocTypeId(null);
      await loadAllData();
    } catch (error) {
      console.error('Error updating doc type:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật loại tài liệu',
        variant: 'destructive'
      });
    } finally {
      setSavingDocTypeId(null);
    }
  };

  // Create new doc type
  const handleCreateDocType = async () => {
    if (!newDocType.name.trim() || !newDocType.category?.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Tên và nhóm là bắt buộc',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase.from('document_types' as any).insert({
        name: newDocType.name.trim(),
        document_name: newDocType.document_name?.trim() || null,
        category: newDocType.category.trim(),
        is_critical: newDocType.is_critical,
      } as any);

      if (error) throw error;

      toast({
        title: 'Tạo thành công',
        description: newDocType.name
      });

      setNewDocType({ name: '', document_name: '', category: '', is_critical: false });
      await loadAllData();
    } catch (error) {
      console.error('Error creating doc type:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo loại tài liệu',
        variant: 'destructive'
      });
    }
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
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Cấu Hình Yêu Cầu Nộp Hồ Sơ
          </CardTitle>
          <CardDescription>
            Quản lý toàn bộ yêu cầu nộp hồ sơ: loại tài liệu, checklist items bắt buộc, và yêu cầu từng nhà thầu - Tất cả trong một chỗ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-2">📋 Hướng dẫn sử dụng:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><strong>Bước 1:</strong> Mở rộng loại tài liệu để xem chi tiết</li>
                <li><strong>Bước 2:</strong> Nếu checklist chưa được setup, nhấp "Khởi tạo Checklist"</li>
                <li><strong>Bước 3:</strong> Đánh dấu các item nào là bắt buộc (toggle công tắc)</li>
                <li><strong>Bước 4:</strong> Set yêu cầu cho từng nhà thầu (số lượng, hạn chót)</li>
                <li><strong>Xong!</strong> Nhà thầu sẽ thấy yêu cầu đúng khi nộp hồ sơ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[800px] border rounded-lg p-4">
        <div className="space-y-4 pr-4">
          {docTypes.map(docType => {
            const isExpanded = expandedDocTypeId === docType.id;
            const isEditing = editingDocTypeId === docType.id;
            const checklistItems = getRequirementsForDocType(docType.id);
            const availableItems = getChecklistItemsForDocType(docType.name);
            const contractorReqs = getContractorRequirementsForDocType(docType.id);

            return (
              <Card key={docType.id} className="overflow-hidden">
                {/* Header */}
                <div
                  className="cursor-pointer hover:bg-muted/50 p-4 flex items-center justify-between"
                  onClick={() => {
                    if (!isEditing) {
                      setExpandedDocTypeId(isExpanded ? null : docType.id);
                    }
                  }}
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
                          {checklistItems.length}/{availableItems.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {docType.category} {docType.document_name ? `• ${docType.document_name}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 p-4 space-y-6">
                    {/* Checklist Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          ✅ Checklist Items
                          {checklistItems.length === 0 && availableItems.length > 0 && (
                            <span className="text-xs font-normal text-yellow-600">Chưa khởi tạo</span>
                          )}
                        </h4>
                        {checklistItems.length === 0 && availableItems.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInitializeChecklist(docType)}
                            disabled={savingDocTypeId === docType.id}
                          >
                            {savingDocTypeId === docType.id ? 'Đang khởi tạo...' : 'Khởi tạo Checklist'}
                          </Button>
                        )}
                      </div>

                      {checklistItems.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto bg-background rounded-md border p-3">
                          {checklistItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2 hover:bg-muted/50 rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.checklist_label}</p>
                                <p className="text-xs text-muted-foreground">{item.checklist_item_id}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.is_required}
                                  onCheckedChange={(checked) => handleToggleChecklistRequired(item, checked)}
                                />
                                <Badge variant={item.is_required ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                                  {item.is_required ? 'Bắt buộc' : 'Tùy chọn'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : availableItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Không có checklist item sẵn có</p>
                      ) : null}
                    </div>

                    {/* Contractor Requirements Section */}
                    <div className="space-y-3 border-t pt-4">
                      <h4 className="font-semibold text-sm">👥 Yêu Cầu Từng Nhà Thầu</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                        {contractors.map(contractor => {
                          const req = contractorReqs.get(contractor.id);
                          const formKey = `${docType.id}-${contractor.id}`;
                          const formValue = contractorFormValues[formKey] || {
                            requiredCount: req?.required_count ?? 0,
                            plannedDueDate: req?.planned_due_date ?? ''
                          };

                          return (
                            <div key={contractor.id} className="border rounded-md p-3 space-y-2 bg-background">
                              <p className="font-medium text-sm">{contractor.name}</p>
                              
                              <div className="space-y-1">
                                <Label className="text-xs">Số lượng yêu cầu</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={formValue.requiredCount}
                                  onChange={(e) => setContractorFormValues(prev => ({
                                    ...prev,
                                    [formKey]: {
                                      ...prev[formKey],
                                      requiredCount: Number(e.target.value)
                                    }
                                  }))}
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Hạn hoàn thành</Label>
                                <Input
                                  type="date"
                                  value={formValue.plannedDueDate}
                                  onChange={(e) => setContractorFormValues(prev => ({
                                    ...prev,
                                    [formKey]: {
                                      ...prev[formKey],
                                      plannedDueDate: e.target.value
                                    }
                                  }))}
                                  className="h-8 text-sm"
                                />
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs"
                                onClick={() => handleSaveContractorRequirement(
                                  docType.id,
                                  contractor.id,
                                  formValue.requiredCount,
                                  formValue.plannedDueDate || null
                                )}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Lưu
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add New Doc Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm Loại Tài Liệu Mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-sm">Tên*</Label>
              <Input
                id="new-name"
                placeholder="VD: Construction Manager"
                value={newDocType.name}
                onChange={(e) => setNewDocType(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-doc-name" className="text-sm">Tên Tài Liệu</Label>
              <Input
                id="new-doc-name"
                placeholder="VD: MT_CM"
                value={newDocType.document_name}
                onChange={(e) => setNewDocType(prev => ({ ...prev, document_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category" className="text-sm">Nhóm*</Label>
              <Input
                id="new-category"
                placeholder="VD: Management Teams"
                value={newDocType.category}
                onChange={(e) => setNewDocType(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newDocType.is_critical}
                  onCheckedChange={(checked) => setNewDocType(prev => ({ ...prev, is_critical: checked }))}
                />
                <span className="text-sm">Critical</span>
              </div>
              <Button onClick={handleCreateDocType} size="sm" className="flex-1">
                Tạo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={loadAllData}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Tải lại
        </Button>
      </div>
    </div>
  );
};
