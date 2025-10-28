import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BulkSubmissionFlow } from '@/components/submissions/BulkSubmissionFlow';
import { useSessionRole } from '@/hooks/useSessionRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft } from 'lucide-react';

const BulkSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, role } = useSessionRole();
  const { toast } = useToast();
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin' || role === 'super_admin';

  // Xác định contractor hiện tại
  useEffect(() => {
    if (!isAdmin && profile?.contractor_id) {
      setContractorId(profile.contractor_id);
    }
    setLoading(false);
  }, [profile, isAdmin]);

  // Tải danh sách nhà thầu cho admin
  useEffect(() => {
    if (isAdmin) {
      loadContractors();
    }
  }, [isAdmin]);

  const loadContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('id, name')
        .order('name');

      if (error) throw error;

      setContractors(data || []);
      if (data && data.length > 0) {
        setSelectedContractorId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhà thầu",
        variant: "destructive"
      });
    }
  };

  const handleSubmissionComplete = () => {
    // Quay về trang danh sách submissions
    navigate('/my-submissions');
  };

  const effectiveContractorId = isAdmin ? selectedContractorId : contractorId;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nộp Hồ Sơ Mới</h1>
            <p className="text-muted-foreground mt-1">
              Quy trình nộp hồ sơ phân cấp với 3 bước dễ dàng
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/my-submissions')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>

        {/* Admin Contractor Selection */}
        {isAdmin && (
          <div className="bg-muted p-4 rounded-lg">
            <label htmlFor="contractor-select" className="block text-sm font-medium mb-2">
              Chọn nhà thầu:
            </label>
            <select
              id="contractor-select"
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="w-full max-w-md px-3 py-2 border rounded-md bg-background"
            >
              <option value="">-- Chọn nhà thầu --</option>
              {contractors.map(contractor => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error State */}
        {!effectiveContractorId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Không thể tiếp tục</h3>
              <p className="text-sm text-red-700 mt-1">
                {isAdmin
                  ? 'Vui lòng chọn một nhà thầu để tiếp tục'
                  : 'Tài khoản của bạn chưa được gán nhà thầu. Vui lòng liên hệ quản trị viên.'}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {effectiveContractorId ? (
          <BulkSubmissionFlow
            contractorId={effectiveContractorId}
            onSubmissionComplete={handleSubmissionComplete}
          />
        ) : null}
      </div>
    </div>
  );
};

export default BulkSubmissionPage;
