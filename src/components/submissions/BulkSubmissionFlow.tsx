import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSessionRole } from '@/hooks/useSessionRole';
import { CategoryNavigationStep } from './CategoryNavigationStep';
import { DocumentChecklistStep } from './DocumentChecklistStep';
import { SubmissionFormStep } from './SubmissionFormStep';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryNode } from '@/lib/checklistData';
import { CheckCircle2, FileText, Send } from 'lucide-react';

interface BulkSubmissionFlowProps {
  contractorId: string;
  onSubmissionComplete: () => void;
}

type Step = 'category' | 'checklist' | 'form';

export const BulkSubmissionFlow: React.FC<BulkSubmissionFlowProps> = ({
  contractorId,
  onSubmissionComplete
}) => {
  const { toast } = useToast();
  const { profile } = useSessionRole();

  // State quản lý các bước
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [documentLink, setDocumentLink] = useState('');

  // Chỉ số bước hiện tại
  const stepIndex = {
    category: 0,
    checklist: 1,
    form: 2
  }[currentStep];

  // Xử lý chọn danh mục
  const handleCategorySelect = useCallback((categoryId: string) => {
    setNavigationPath(prev => [...prev, categoryId]);
  }, []);

  // Xử lý quay lại từ danh mục
  const handleCategoryBack = useCallback(() => {
    setNavigationPath(prev => prev.slice(0, -1));
  }, []);

  // Xử lý chuyển sang bước kiểm tra danh sách
  const handleCategoryNext = useCallback((node: CategoryNode) => {
    setSelectedCategory(node);
    setCurrentStep('checklist');
  }, []);

  // Xử lý quay lại từ danh sách tài liệu
  const handleChecklistBack = useCallback(() => {
    setCurrentStep('category');
  }, []);

  // Xử lý chuyển sang bước form
  const handleChecklistNext = useCallback((items: string[], link: string) => {
    setCheckedItems(items);
    setDocumentLink(link);
    setCurrentStep('form');
  }, []);

  // Xử lý quay lại từ form
  const handleFormBack = useCallback(() => {
    setCurrentStep('checklist');
  }, []);

  // Xử lý nộp hồ sơ
  const handleFormSubmit = useCallback(async (note: string) => {
    try {
      if (!selectedCategory?.docTypeId) {
        throw new Error('Không tìm thấy loại tài liệu');
      }

      // Lấy doc_type_id từ database dựa trên code
      const { data: docTypes, error: docTypeError } = await supabase
        .from('doc_types')
        .select('id')
        .eq('code', selectedCategory.docTypeId)
        .single();

      if (docTypeError || !docTypes) {
        throw new Error('Không tìm thấy loại tài liệu trong database');
      }

      // Tạo submission mới
      const fullNote = `
Danh mục: ${selectedCategory.name}
Tài liệu nộp: ${checkedItems.length} tài liệu
Link: ${documentLink}
${note ? `Ghi chú: ${note}` : ''}
      `.trim();

      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          contractor_id: contractorId,
          doc_type_id: docTypes.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          cnt: checkedItems.length,
          note: fullNote
        });

      if (insertError) throw insertError;

      // Reset form
      setCurrentStep('category');
      setNavigationPath([]);
      setSelectedCategory(null);
      setCheckedItems([]);
      setDocumentLink('');

      // Gọi callback
      onSubmissionComplete();

      toast({
        title: "Thành công",
        description: "Hồ sơ đã được nộp và đang chờ xử lý",
        variant: "default"
      });
    } catch (error) {
      console.error('Error submitting:', error);
      throw error;
    }
  }, [selectedCategory, checkedItems, documentLink, contractorId, onSubmissionComplete, toast]);

  const stepLabels = [
    { label: 'Chọn danh mục', icon: FileText },
    { label: 'Kiểm tra tài liệu', icon: CheckCircle2 },
    { label: 'Xác nhận và nộp', icon: Send }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress Visualization */}
            <div className="flex items-center justify-between mb-4">
              {stepLabels.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full font-semibold
                      transition-colors
                      ${
                        index < stepIndex
                          ? 'bg-green-600 text-white'
                          : index === stepIndex
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index < stepIndex ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`
                        h-1 flex-1 mx-2 rounded-full
                        ${index < stepIndex ? 'bg-green-600' : 'bg-muted'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-between text-xs">
              {stepLabels.map((step, index) => (
                <div key={index} className="text-center flex-1">
                  <p className={`font-medium ${index <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {currentStep === 'category' && (
            <CategoryNavigationStep
              navigationPath={navigationPath}
              onCategorySelect={handleCategorySelect}
              onBack={handleCategoryBack}
              onNext={handleCategoryNext}
            />
          )}

          {currentStep === 'checklist' && selectedCategory && (
            <DocumentChecklistStep
              selectedCategory={selectedCategory}
              onBack={handleChecklistBack}
              onNext={handleChecklistNext}
            />
          )}

          {currentStep === 'form' && selectedCategory && (
            <SubmissionFormStep
              selectedCategory={selectedCategory}
              checkedItems={checkedItems}
              documentLink={documentLink}
              onBack={handleFormBack}
              onSubmit={handleFormSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
