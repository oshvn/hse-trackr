import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useSessionRole } from "@/hooks/useSessionRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw, Save, Settings, PlusCircle, ShieldAlert, Brain, Cpu, Key, TestTube, List, AlertCircle } from "lucide-react";
import { UnifiedRequirementConfig } from "@/components/admin/UnifiedRequirementConfig";

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

interface AIConfig {
  id: string;
  provider: string;
  model: string;
  api_key: string;
  api_endpoint: string;
  temperature: number;
  max_tokens: number;
  enabled: boolean;
}

interface AIProvider {
  id: string;
  name: string;
  models: {
    id: string;
    name: string;
    isFree: boolean;
  }[];
  defaultEndpoint: string;
}

const requirementKey = (docTypeId: string, contractorId: string) => `${docTypeId}__${contractorId}`;

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const { user } = useSessionRole();
  const [docTypes, setDocTypes] = useState<DocTypeRow[]>([]);
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  const [aiConfigs, setAIConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDocTypeId, setSavingDocTypeId] = useState<string | null>(null);
  const [savingRequirementKey, setSavingRequirementKey] = useState<string | null>(null);
  const [savingAIConfigId, setSavingAIConfigId] = useState<string | null>(null);
  const [creatingDocType, setCreatingDocType] = useState(false);
  const [testingAIConfigId, setTestingAIConfigId] = useState<string | null>(null);
  const [newDocType, setNewDocType] = useState({
    name: "",
    category: "",
    code: "",
    is_critical: false,
  });
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    id: 'main',
    provider: 'GLM',
    model: 'glm-4.5-flash',
    api_key: '',
    api_endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    temperature: 0.3,
    max_tokens: 1000,
    enabled: false,
  });

  const aiProviders: AIProvider[] = [
    {
      id: 'GLM',
      name: 'GLM (Zhipu AI)',
      models: [
        { id: 'glm-4.5-flash', name: 'GLM-4.5-Flash', isFree: true },
        { id: 'glm-4', name: 'GLM-4', isFree: false },
        { id: 'glm-4-air', name: 'GLM-4-Air', isFree: true },
      ],
      defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    },
    {
      id: 'Gemini',
      name: 'Google Gemini',
      models: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', isFree: true },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isFree: false },
        { id: 'gemini-pro', name: 'Gemini Pro', isFree: true },
      ],
      defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    },
    {
      id: 'OpenAI',
      name: 'OpenAI',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', isFree: false },
        { id: 'gpt-4', name: 'GPT-4', isFree: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', isFree: false },
      ],
      defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    },
    {
      id: 'Groq',
      name: 'Groq (Llama 3.x, Free/Ultra Fast)',
      models: [
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', isFree: true },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', isFree: true },
      ],
      defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    },
  ];

  const requirementMap = useMemo(() => {
    const map = new Map<string, RequirementRow>();
    requirements.forEach((req) => {
      map.set(requirementKey(req.doc_type_id, req.contractor_id), req);
    });
    return map;
  }, [requirements]);

  // Load AI config from database (per user)
  const loadAIConfig = useCallback(async () => {
    if (!user?.id) {
      // Fallback to localStorage if not logged in
      try {
        const savedConfig = localStorage.getItem('ai_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setAIConfig(config);
        }
      } catch (error) {
        console.error('Failed to load AI config from localStorage:', error);
      }
      return;
    }

    try {
      // Load from database
      const { data, error } = await supabase
        .from('ai_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setAIConfig({
          id: data.id || 'main',
          provider: data.provider || 'GLM',
          model: data.model || 'glm-4.5-flash',
          api_key: data.api_key || '',
          api_endpoint: data.api_endpoint || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          temperature: data.temperature || 0.3,
          max_tokens: data.max_tokens || 1000,
          enabled: data.enabled || false,
        });
      } else {
        // Migrate from localStorage if exists
        try {
          const savedConfig = localStorage.getItem('ai_config');
          if (savedConfig) {
            const oldConfig = JSON.parse(savedConfig);
            if (oldConfig.api_key || oldConfig.enabled) {
              // Save to database and remove from localStorage
              if (user?.id) {
                const { error: saveError } = await supabase
                  .from('ai_configs')
                  .upsert({
                    user_id: user.id,
                    provider: oldConfig.provider || 'GLM',
                    model: oldConfig.model || 'glm-4.5-flash',
                    api_key: oldConfig.api_key || '',
                    api_endpoint: oldConfig.api_endpoint || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                    temperature: oldConfig.temperature || 0.3,
                    max_tokens: oldConfig.max_tokens || 1000,
                    enabled: oldConfig.enabled || false,
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'user_id'
                  });
                if (!saveError) {
                  localStorage.removeItem('ai_config');
                }
              }
            }
          }
        } catch (migrateError) {
          console.error('Failed to migrate from localStorage:', migrateError);
        }
      }
    } catch (error) {
      console.error('Failed to load AI config from database:', error);
      // Fallback to localStorage
      try {
        const savedConfig = localStorage.getItem('ai_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setAIConfig(config);
        }
      } catch (fallbackError) {
        console.error('Failed to load AI config from localStorage:', fallbackError);
      }
    }
  }, [user?.id]);

  // Save AI config to database (per user) - must be defined before loadAIConfig
  const saveAIConfigToDB = useCallback(async (config: AIConfig) => {
    if (!user?.id) {
      // Fallback to localStorage if not logged in
      try {
        localStorage.setItem('ai_config', JSON.stringify(config));
      } catch (error) {
        console.error('Failed to save AI config to localStorage:', error);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_configs')
        .upsert({
          user_id: user.id,
          provider: config.provider,
          model: config.model,
          api_key: config.api_key,
          api_endpoint: config.api_endpoint,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          enabled: config.enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Also keep in localStorage as cache
      try {
        localStorage.setItem('ai_config', JSON.stringify(config));
      } catch (localError) {
        console.warn('Failed to cache in localStorage:', localError);
      }
    } catch (error) {
      console.error('Failed to save AI config to database:', error);
      throw error;
    }
  }, [user?.id]);

  // Save AI config (wrapper for backward compatibility)
  const saveAIConfig = useCallback((config: AIConfig) => {
    // Will be saved when user clicks "Lưu" button
    setAIConfig(config);
  }, []);

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
      
      // Load AI config from database
      await loadAIConfig();
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
  }, [toast, loadAIConfig]);

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  const handleAIConfigFieldChange = (field: keyof AIConfig, value: string | number | boolean) => {
    const updated = {
      ...aiConfig,
      [field]: value,
    };
    
    // Update endpoint when provider changes
    if (field === 'provider') {
      const provider = aiProviders.find(p => p.id === value);
      if (provider) {
        updated.api_endpoint = provider.defaultEndpoint;
        // Set first model as default
        updated.model = provider.models[0].id;
      }
    }
    
    setAIConfig(updated);
    saveAIConfig(updated);
  };

  const handleSaveAIConfig = async () => {
    setSavingAIConfigId('main');
    try {
      await saveAIConfigToDB(aiConfig);

      toast({
        title: "Đã lưu cấu hình AI",
        description: `${aiConfig.provider} - ${aiConfig.model} được cập nhật thành công. Cấu hình đã được lưu theo tài khoản của bạn.`,
      });
    } catch (error) {
      console.error("Failed to update AI config", error);
      toast({
        title: "Không thể cập nhật",
        description: error instanceof Error ? error.message : "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSavingAIConfigId(null);
    }
  };

  const handleTestAIConfig = async () => {
    setTestingAIConfigId('main');
    try {
      let testUrl = '';
      let testPayload = {};
      const start = performance.now();
      
      if (aiConfig.provider === 'GLM') {
        testUrl = aiConfig.api_endpoint;
        testPayload = {
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, this is a test message. Please respond with "Test successful".' }
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.max_tokens,
        };
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.api_key}` },
          body: JSON.stringify(testPayload)
        });
        if (!response.ok) throw new Error(`GLM API error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) throw new Error('Invalid response from GLM API');
      } else if (aiConfig.provider === 'Gemini') {
        testUrl = `${aiConfig.api_endpoint}?key=${aiConfig.api_key}`;
        testPayload = {
          contents: [{ parts: [{ text: 'Hello, this is a test message. Please respond with "Test successful".' }] }]
        };
        const response = await fetch(testUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testPayload) });
        if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) throw new Error('Invalid response from Gemini API');
      } else if (aiConfig.provider === 'OpenAI') {
        testUrl = aiConfig.api_endpoint;
        testPayload = {
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, this is a test message. Please respond with "Test successful".' }
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.max_tokens,
        };
        const response = await fetch(testUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.api_key}` }, body: JSON.stringify(testPayload) });
        if (!response.ok) throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) throw new Error('Invalid response from OpenAI API');
      } else if (aiConfig.provider === 'Groq') {
        testUrl = aiConfig.api_endpoint;
        testPayload = {
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, this is a test message. Please respond with "Test successful".' }
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.max_tokens,
        };
        const response = await fetch(testUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.api_key}` }, body: JSON.stringify(testPayload) });
        if (!response.ok) throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || '';
        if (typeof content !== 'string' || content.length === 0) throw new Error('Invalid response from Groq API');
      } else {
        throw new Error(`Unsupported provider: ${aiConfig.provider}`);
      }
      const elapsed = Math.round(performance.now() - start);
      toast({ title: 'Kết nối AI thành công', description: `${aiConfig.provider} - ${aiConfig.model} (${elapsed}ms)` });
    } catch (error: any) {
      console.error('Failed to test AI config', error);
      toast({ title: 'Kết nối AI thất bại', description: error.message || 'Vui lòng kiểm tra lại cấu hình', variant: 'destructive' });
    } finally {
      setTestingAIConfigId(null);
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

      <Tabs defaultValue="unified-config" className="w-full">
        <TabsList>
          <TabsTrigger value="unified-config">
            <AlertCircle className="h-4 w-4 mr-2" />
            Cấu Hình Yêu Cầu
          </TabsTrigger>
          <TabsTrigger value="ai-config">Cấu hình AI</TabsTrigger>
        </TabsList>

        <TabsContent value="unified-config" className="space-y-6">
          <UnifiedRequirementConfig />
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cấu hình AI Recommendation
              </CardTitle>
              <CardDescription>
                Thiết lập dịch vụ AI để tạo đề xuất hành động thông minh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Cấu hình AI</h3>
                    {aiConfig.enabled ? (
                      <Badge variant="default">Đã kích hoạt</Badge>
                    ) : (
                      <Badge variant="secondary">Chưa kích hoạt</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestAIConfig}
                      disabled={testingAIConfigId === 'main' || !aiConfig.api_key}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingAIConfigId === 'main' ? "Đang test..." : "Test"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAIConfig}
                      disabled={savingAIConfigId === 'main'}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingAIConfigId === 'main' ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Provider</Label>
                    <select
                      value={aiConfig.provider}
                      onChange={(event) => handleAIConfigFieldChange("provider", event.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {aiProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <select
                      value={aiConfig.model}
                      onChange={(event) => handleAIConfigFieldChange("model", event.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {aiProviders
                        .find((p) => p.id === aiConfig.provider)
                        ?.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} {model.isFree && "(Miễn phí)"}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={aiConfig.api_key}
                        placeholder="Nhập API key"
                        onChange={(event) => handleAIConfigFieldChange("api_key", event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <Input
                      value={aiConfig.api_endpoint}
                      placeholder="https://api.example.com/v1/chat/completions"
                      onChange={(event) => handleAIConfigFieldChange("api_endpoint", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature (0-1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiConfig.temperature}
                      onChange={(event) => handleAIConfigFieldChange("temperature", parseFloat(event.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      min="100"
                      max="4000"
                      step="100"
                      value={aiConfig.max_tokens}
                      onChange={(event) => handleAIConfigFieldChange("max_tokens", parseInt(event.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={aiConfig.enabled}
                      onCheckedChange={(checked) => handleAIConfigFieldChange("enabled", checked)}
                    />
                    <Label>Kích hoạt</Label>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Thông tin về các nhà cung cấp</h4>
                <div className="space-y-2 text-sm">
                  {aiProviders.map((provider) => (
                    <div key={provider.id} className="border-b pb-2 mb-2">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-muted-foreground">Các model có sẵn: {provider.models.map(m => m.name).join(", ")}</div>
                      <div className="text-muted-foreground">Model miễn phí: {provider.models.filter(m => m.isFree).map(m => m.name).join(", ") || "Không có"}</div>
                      {provider.id === 'Groq' && (
                        <div className="mt-1 text-xs text-blue-700">
                          <b>Lấy API key:</b> Đăng ký miễn phí tại <a href="https://console.groq.com/keys" target="_blank" rel="noopener" className="underline">https://console.groq.com/keys</a><br />
                          <b>Endpoint:</b> https://api.groq.com/openai/v1/chat/completions<br />
                          <b>Model:</b> llama-3.1-8b-instant (Nhanh) hoặc llama-3.3-70b-versatile (Chất lượng cao)<br />
                          <span className="text-gray-500">Groq có free tier, tốc độ phản hồi rất nhanh</span>
                        </div>
                      )}
                      {provider.id === 'OpenAI' && (
                        <div className="mt-1 text-xs text-blue-700">
                          <b>Lấy API key:</b> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="underline">https://platform.openai.com/api-keys</a>
                        </div>
                      )}
                      {provider.id === 'GLM' && (
                        <div className="mt-1 text-xs text-blue-700">
                          <b>Đăng ký tại:</b> <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank" rel="noopener" className="underline">https://open.bigmodel.cn/usercenter/apikeys</a>
                        </div>
                      )}
                      {provider.id === 'Gemini' && (
                        <div className="mt-1 text-xs text-blue-700">
                          <b>Lấy API key:</b> <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" className="underline">https://makersuite.google.com/app/apikey</a><br />
                          <span className="text-gray-500">Google cloud API ở project cần enable Gemini, sử dụng endpoint phù hợp nếu đổi model!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
