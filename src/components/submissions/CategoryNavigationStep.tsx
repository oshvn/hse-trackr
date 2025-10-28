import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, FolderOpen } from 'lucide-react';
import { 
  CATEGORY_HIERARCHY, 
  CategoryNode, 
  findCategoryNode, 
  getSubCategories,
  isLeafCategory 
} from '@/lib/checklistData';

interface CategoryNavigationStepProps {
  navigationPath: string[];
  onCategorySelect: (categoryId: string) => void;
  onBack: () => void;
  onNext: (selectedNode: CategoryNode) => void;
}

export const CategoryNavigationStep: React.FC<CategoryNavigationStepProps> = ({
  navigationPath,
  onCategorySelect,
  onBack,
  onNext
}) => {
  // Lấy node hiện tại từ path
  const currentNode = useMemo(() => {
    if (navigationPath.length === 0) return null;
    return findCategoryNode(navigationPath[navigationPath.length - 1]);
  }, [navigationPath]);

  // Lấy các danh mục con để hiển thị
  const displayedCategories = useMemo(() => {
    if (navigationPath.length === 0) {
      return CATEGORY_HIERARCHY;
    }
    return getSubCategories(navigationPath[navigationPath.length - 1]);
  }, [navigationPath]);

  // Kiểm tra xem danh mục hiện tại có phải là lá không
  const isCurrentLeaf = isLeafCategory(currentNode);

  const handleCategoryClick = (categoryId: string) => {
    const node = findCategoryNode(categoryId);
    const newPath = [...navigationPath, categoryId];
    
    // Nếu là danh mục lá, tiến hành bước tiếp theo
    if (isLeafCategory(node)) {
      onNext(node);
    } else {
      // Ngược lại, cập nhật path để hiển thị danh mục con
      onCategorySelect(categoryId);
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <span className="text-sm text-muted-foreground">Path:</span>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-medium">HSE</span>
          {navigationPath.map((pathId, index) => {
            const node = findCategoryNode(pathId);
            return (
              <div key={pathId} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-primary">
                  {node?.name.split(' ').slice(-1)[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {navigationPath.length === 0 
            ? 'Chọn danh mục tài liệu' 
            : `Danh mục con: ${currentNode?.name}`}
        </h2>
        <p className="text-muted-foreground">
          {navigationPath.length === 0
            ? 'Chọn danh mục chính để bắt đầu'
            : displayedCategories.length > 0
            ? `Chọn một danh mục con hoặc nhấp vào danh mục cuối để tiếp tục`
            : 'Không có danh mục con'}
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedCategories.map((category) => {
          const hasChildren = category.children && category.children.length > 0;
          return (
            <Card
              key={category.id}
              className="p-4 cursor-pointer hover:bg-accent hover:shadow-md transition-all border-2 hover:border-primary"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {hasChildren 
                      ? `${category.children?.length} danh mục con`
                      : 'Danh mục cuối'}
                  </p>
                  {hasChildren && (
                    <div className="flex flex-wrap gap-1">
                      {category.children?.slice(0, 3).map(child => (
                        <Badge key={child.id} variant="outline" className="text-xs">
                          {child.name.split(' ').pop()}
                        </Badge>
                      ))}
                      {(category.children?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(category.children?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleBackClick}
          disabled={navigationPath.length === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="flex-1" />
        {isCurrentLeaf && (
          <Button
            onClick={() => currentNode && onNext(currentNode)}
            className="flex items-center gap-2"
          >
            Tiếp tục
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
