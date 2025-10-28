import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { CategoryNode } from '@/lib/checklistData';
import { useToast } from '@/hooks/use-toast';

interface SubmissionFormStepProps {
  selectedCategory: CategoryNode;
  checkedItems: string[];
  documentLink: string;
  onBack: () => void;
  onSubmit: (note: string) => Promise<void>;
}

export const SubmissionFormStep: React.FC<SubmissionFormStepProps> = ({
  selectedCategory,
  checkedItems,
  documentLink,
  onBack,
  onSubmit
}) => {
  const [note, setNote] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Lấy danh sách tài liệu bắt buộc
  const requiredDocuments = useMemo(() => {
    return selectedCategory.required_documents || [];
  }, [selectedCategory]);

  const selectedDocuments = useMemo(() => {
    return requiredDocuments.filter(doc => checkedItems.includes(doc.id));
  }, [requiredDocuments, checkedItems]);

  const handleSubmitClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(note);
      setShowConfirmDialog(false);
      
      toast({
        title: "Thành công",
        description: "Hồ sơ đã được nộp thành công",
        variant: "default"
      });
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: "Lỗi",
        description: "Không thể nộp hồ sơ. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Xác nhận và nộp hồ sơ</h2>
        <p className="text-muted-foreground">
          Vui lòng kiểm tra lại thông tin trước khi nộp
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Danh mục */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh mục tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-sm">{selectedCategory.name}</p>
              <div className="flex gap-2 flex-wrap">
                {selectedCategory.name.split(' ').map((part, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {part}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tài liệu được chọn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tài liệu được chọn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-sm">
                {checkedItems.length}/{requiredDocuments.length} tài liệu
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(checkedItems.length / requiredDocuments.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách tài liệu chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách tài liệu nộp</CardTitle>
          <CardDescription>
            Các tài liệu bạn đã chọn để nộp trong hồ sơ này
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="border rounded-lg p-4 bg-muted/30 max-h-48 overflow-y-auto">
            <ul className="space-y-2">
              {selectedDocuments.map((doc) => (
                <li key={doc.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{doc.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={documentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all text-sm"
          >
            {documentLink}
          </a>
        </CardContent>
      </Card>

      {/* Note Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ghi chú</CardTitle>
          <CardDescription>
            Thêm ghi chú cho quản trị viên (tùy chọn)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="submission-note">Ghi chú</Label>
          <Textarea
            id="submission-note"
            placeholder="Nhập ghi chú... (ví dụ: Một số tài liệu vẫn đang chuẩn bị, hoặc có các điều cần lưu ý, v.v.)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {note.length}/1000 ký tự
          </p>
        </CardContent>
      </Card>

      {/* Warning Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Hồ sơ sẽ được chuyển sang trạng thái "Đang xử lý"</li>
            <li>Bạn sẽ nhận được thông báo khi quản trị viên xem xét</li>
            <li>Đảm bảo link chia sẻ đang hoạt động</li>
          </ul>
        </AlertDescription>
      </Alert>

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
          onClick={handleSubmitClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4" />
          Nộp hồ sơ
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận nộp hồ sơ</DialogTitle>
            <DialogDescription>
              Bạn chắc chắn muốn nộp hồ sơ này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {/* Summary in Dialog */}
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-3 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Danh mục</span>
                <p className="font-semibold text-sm">{selectedCategory.name}</p>
              </div>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Tài liệu</span>
                <p className="font-semibold text-sm">{checkedItems.length} tài liệu</p>
              </div>
              {note && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground">Ghi chú</span>
                    <p className="text-sm mt-1">{note}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
