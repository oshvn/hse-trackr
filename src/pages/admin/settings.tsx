import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw, Save, Settings, PlusCircle, ShieldAlert } from "lucide-react";

interface DocTypeRow {
  id: string;
  name: string;
  code: string | null;
  category: string;
  is_critical: boolean;
}

interface ContractorRow {
  id: string;
  name: string;
}

interface RequirementRow {
  id: string;
  contractor_id: string;
  doc_type_id: string;
  required_count: number;
  planned_due_date: string | null;
}

const requirementKey = (docTypeId: string, contractorId: string) => `${docTypeId}__${contractorId}`;

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [docTypes, setDocTypes] = useState<DocTypeRow[]>([]);
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDocTypeId, setSavingDocTypeId] = useState<string | null>(null);
  const [savingRequirementKey, setSavingRequirementKey] = useState<string | null>(null);
  const [creatingDocType, setCreatingDocType] = useState(false);
  const [newDocType, setNewDocType] = useState({
    name: "",
    category: "",
    code: "",
    is_critical: false,
  });

  const requirementMap = useMemo(() => {
    const map = new Map<string, RequirementRow>();
    requirements.forEach((req) => {
      map.set(requirementKey(req.doc_type_id, req.contractor_id), req);
    });
    return map;
  }, [requirements]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      const [{ data: docTypeData, error: docTypeError }, { data: contractorData, error: contractorError }, { data: requirementData, error: requirementError }] = await Promise.all([
        supabase.from("doc_types").select("*").order("category").order("name"),
        supabase.from("contractors").select("id, name").order("name"),
        supabase.from("contractor_requirements").select("*")
      ]);

      if (docTypeError) throw docTypeError;
      if (contractorError) throw contractorError;
      if (requirementError) throw requirementError;

      setDocTypes(docTypeData || []);
      setContractors(contractorData || []);
      setRequirements((requirementData || []).map((row) => ({
        id: row.id,
        contractor_id: row.contractor_id,
        doc_type_id: row.doc_type_id,
        required_count: row.required_count ?? 0,
        planned_due_date: row.planned_due_date,
      })));
    } catch (error) {
      console.error("Failed to load admin settings", error);
      toast({
        title: "Không thể tải cấu hình",
        description: "Vui lòng thử lại hoặc kiểm tra kết nối Supabase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleDocTypeFieldChange = (docTypeId: string, field: keyof DocTypeRow, value: string | boolean) => {
    setDocTypes((prev) =>
      prev.map((docType) =>
        docType.id === docTypeId
          ? {
              ...docType,
              [field]: value,
            }
          : docType
      )
    );
  };

  const handleSaveDocType = async (docTypeId: string) => {
    const docType = docTypes.find((item) => item.id === docTypeId);
    if (!docType) return;

    setSavingDocTypeId(docTypeId);
    try {
      const payload = {
        name: docType.name.trim(),
        category: docType.category.trim(),
        code: docType.code ? docType.code.trim() : null,
        is_critical: docType.is_critical,
      };

      const { error } = await supabase
        .from("doc_types")
        .update(payload)
        .eq("id", docTypeId);

      if (error) throw error;

      toast({
        title: "Đã lưu loại tài liệu",
        description: `${docType.name} được cập nhật thành công`,
      });
      await loadSettings();
    } catch (error: any) {
      console.error("Failed to update doc type", error);
      toast({
        title: "Không thể cập nhật",
        description: error.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSavingDocTypeId(null);
    }
  };

  const handleToggleCritical = async (docTypeId: string, value: boolean) => {
    const previous = docTypes;
    handleDocTypeFieldChange(docTypeId, "is_critical", value);

    try {
      const { error } = await supabase
        .from("doc_types")
        .update({ is_critical: value })
        .eq("id", docTypeId);

      if (error) throw error;

      toast({
        title: value ? "Đánh dấu Critical" : "Bỏ đánh dấu Critical",
        description: "Cấu hình đã được cập nhật",
      });
    } catch (error) {
      console.error("Failed to toggle critical flag", error);
      setDocTypes(previous);
      toast({
        title: "Không thể cập nhật",
        description: "Vui lòng thử lại",
        variant: "destructive",
      });
    }
  };

  const handleCreateDocType = async () => {
    if (!newDocType.name.trim() || !newDocType.category.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Tên và nhóm tài liệu là bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setCreatingDocType(true);
    try {
      const { error } = await supabase.from("doc_types").insert({
        name: newDocType.name.trim(),
        category: newDocType.category.trim(),
        code: newDocType.code.trim() ? newDocType.code.trim() : null,
        is_critical: newDocType.is_critical,
      });

      if (error) throw error;

      toast({
        title: "Đã tạo loại tài liệu",
        description: newDocType.name,
      });

      setNewDocType({ name: "", category: "", code: "", is_critical: false });
      await loadSettings();
    } catch (error: any) {
      console.error("Failed to create doc type", error);
      toast({
        title: "Không thể tạo",
        description: error.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setCreatingDocType(false);
    }
  };

  const handleRequirementFieldChange = (
    docTypeId: string,
    contractorId: string,
    field: keyof RequirementRow,
    value: string | number | null
  ) => {
    setRequirements((prev) => {
      const existingIndex = prev.findIndex(
        (req) => req.doc_type_id === docTypeId && req.contractor_id === contractorId
      );

      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          [field]: field === "required_count" ? (Number(value) || 0) : value,
        } as RequirementRow;
        return copy;
      }

      return [
        ...prev,
        {
          id: `temp-${docTypeId}-${contractorId}`,
          doc_type_id: docTypeId,
          contractor_id: contractorId,
          required_count: field === "required_count" ? Number(value) || 0 : 0,
          planned_due_date:
            field === "planned_due_date" && typeof value === "string" ? value : null,
        },
      ];
    });
  };

  const handleSaveRequirement = async (docTypeId: string, contractorId: string) => {
    const key = requirementKey(docTypeId, contractorId);
    const requirement = requirementMap.get(key);

    setSavingRequirementKey(key);
    try {
      const payload = {
        contractor_id: contractorId,
        doc_type_id: docTypeId,
        required_count: requirement?.required_count ?? 0,
        planned_due_date: requirement?.planned_due_date || null,
      };

      const { error } = await supabase
        .from("contractor_requirements")
        .upsert(payload, { onConflict: "contractor_id,doc_type_id" });

      if (error) throw error;

      toast({
        title: "Đã lưu yêu cầu",
        description: "Yêu cầu tài liệu cập nhật thành công",
      });
      await loadSettings();
    } catch (error: any) {
      console.error("Failed to save requirement", error);
      toast({
        title: "Không thể lưu",
        description: error.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSavingRequirementKey(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 animate-spin" />
          <h1 className="text-2xl font-bold">Đang tải cấu hình...</h1>
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Cấu hình hệ thống HSE</h1>
            <p className="text-muted-foreground">
              Quản lý loại tài liệu, nhà thầu và yêu cầu nộp hồ sơ
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadSettings}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Tải lại
        </Button>
      </div>

      <Tabs defaultValue="doc-types" className="w-full">
        <TabsList>
          <TabsTrigger value="doc-types">Loại tài liệu</TabsTrigger>
          <TabsTrigger value="requirements">Yêu cầu theo nhà thầu</TabsTrigger>
        </TabsList>

        <TabsContent value="doc-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách loại tài liệu</CardTitle>
              <CardDescription>
                Chỉnh sửa tên, nhóm và đánh dấu critical cho từng loại tài liệu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead>Mã</TableHead>
                      <TableHead>Nhóm</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead className="text-right">Lưu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docTypes.map((docType) => (
                      <TableRow key={docType.id}>
                        <TableCell>
                          <Input
                            value={docType.name}
                            onChange={(event) => handleDocTypeFieldChange(docType.id, "name", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={docType.code ?? ""}
                            onChange={(event) => handleDocTypeFieldChange(docType.id, "code", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={docType.category}
                            onChange={(event) => handleDocTypeFieldChange(docType.id, "category", event.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={docType.is_critical}
                              onCheckedChange={(checked) => handleToggleCritical(docType.id, checked)}
                            />
                            {docType.is_critical ? (
                              <Badge variant="destructive">Must-have</Badge>
                            ) : (
                              <Badge variant="outline">Tùy chọn</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSaveDocType(docType.id)}
                            disabled={savingDocTypeId === docType.id}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {savingDocTypeId === docType.id ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" /> Thêm loại tài liệu mới
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="new-name">Tên*</Label>
                    <Input
                      id="new-name"
                      placeholder="VD: Permit to Work"
                      value={newDocType.name}
                      onChange={(event) => setNewDocType((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-code">Mã</Label>
                    <Input
                      id="new-code"
                      placeholder="VD: PTW"
                      value={newDocType.code}
                      onChange={(event) => setNewDocType((prev) => ({ ...prev, code: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-category">Nhóm*</Label>
                    <Input
                      id="new-category"
                      placeholder="VD: An toàn vận hành"
                      value={newDocType.category}
                      onChange={(event) => setNewDocType((prev) => ({ ...prev, category: event.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDocType.is_critical}
                        onCheckedChange={(checked) => setNewDocType((prev) => ({ ...prev, is_critical: checked }))}
                      />
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreateDocType} disabled={creatingDocType}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {creatingDocType ? "Đang tạo..." : "Tạo loại tài liệu"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu nộp hồ sơ theo nhà thầu</CardTitle>
              <CardDescription>
                Thiết lập số lượng tài liệu cần nộp và hạn chót cho từng nhà thầu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {docTypes.map((docType) => (
                <div key={docType.id} className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {docType.name}
                        {docType.is_critical && <Badge variant="destructive">Critical</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Nhóm: {docType.category} {docType.code ? `• Mã: ${docType.code}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {contractors.map((contractor) => {
                      const key = requirementKey(docType.id, contractor.id);
                      const requirement = requirementMap.get(key);
                      return (
                        <div key={key} className="border rounded-md p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{contractor.name}</div>
                            {requirement?.planned_due_date && new Date(requirement.planned_due_date) < new Date() && (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Quá hạn
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Số lượng yêu cầu</Label>
                            <Input
                              type="number"
                              min={0}
                              value={requirement?.required_count ?? 0}
                              onChange={(event) =>
                                handleRequirementFieldChange(
                                  docType.id,
                                  contractor.id,
                                  "required_count",
                                  Number(event.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Hạn hoàn thành</Label>
                            <Input
                              type="date"
                              value={requirement?.planned_due_date ?? ""}
                              onChange={(event) =>
                                handleRequirementFieldChange(
                                  docType.id,
                                  contractor.id,
                                  "planned_due_date",
                                  event.target.value || null
                                )
                              }
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSaveRequirement(docType.id, contractor.id)}
                            disabled={savingRequirementKey === key}
                          >
                            {savingRequirementKey === key ? "Đang lưu..." : "Lưu yêu cầu"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
