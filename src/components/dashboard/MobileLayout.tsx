import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Menu, 
  Home, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Filter,
  ChevronRight,
  Plus,
  Search,
  Bell,
  Settings,
  User,
  FileText,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResponsiveKpiConfig, getResponsiveChartDimensions, touchUtils } from '@/lib/responsiveUtils';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  onFilterToggle?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface MobileKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  isLoading?: boolean;
}

interface MobileQuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  color?: string;
}

interface MobileSwipeableCardProps {
  title: string;
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

/**
 * Mobile KPI Card component optimized for touch
 */
const MobileKpiCard: React.FC<MobileKpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  onClick,
  isLoading = false,
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-600" />,
    down: <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />,
    neutral: <div className="h-3 w-3 bg-gray-400 rounded-full" />,
  };

  if (isLoading) {
    return (
      <Card className="touch-button">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/2 mb-1" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'touch-button cursor-pointer transition-all duration-200 active:scale-95',
        colorClasses[color]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs opacity-70 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="ml-2 opacity-70">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendIcons[trend.direction]}
            <span className="text-xs font-medium">
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Mobile Quick Action component
 */
const MobileQuickAction: React.FC<MobileQuickActionProps> = ({
  icon,
  label,
  onClick,
  badge,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-500 text-white',
    secondary: 'bg-gray-500 text-white',
  };

  return (
    <button
      className={cn(
        'mobile-quick-action relative',
        colorClasses[color as keyof typeof colorClasses]
      )}
      onClick={onClick}
    >
      <div className="mobile-quick-action-icon">
        {icon}
      </div>
      <span className="mobile-quick-action-label">{label}</span>
      {badge && badge > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          variant="destructive"
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </button>
  );
};

/**
 * Mobile Swipeable Card component
 */
const MobileSwipeableCard: React.FC<MobileSwipeableCardProps> = ({
  title,
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].clientX);
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;
      
      const diff = startX - currentX;
      const threshold = touchUtils.getSwipeThreshold('mobile');
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
      
      setIsSwiping(false);
      setCurrentX(0);
    };

    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', handleTouchEnd);

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startX, currentX, isSwiping, onSwipeLeft, onSwipeRight]);

  return (
    <Card 
      ref={cardRef}
      className={cn(
        'transition-transform duration-200',
        isSwiping && currentX !== 0 && `translate-x-${Math.round(currentX / 10)}`,
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Mobile Navigation component
 */
const MobileNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}> = ({ activeTab, onTabChange, notificationCount = 0 }) => {
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <Home className="h-4 w-4" /> },
    { id: 'analytics', label: 'Phân tích', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
    { id: 'alerts', label: 'Cảnh báo', icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  return (
    <div className="mobile-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            'flex flex-col items-center p-2 rounded-lg transition-colors',
            activeTab === tab.id 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-900'
          )}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="relative">
            {tab.icon}
            {tab.id === 'alerts' && notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                variant="destructive"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </div>
          <span className="text-xs mt-1">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Main Mobile Layout component
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title = 'Dashboard',
  subtitle,
  onMenuToggle,
  onFilterToggle,
  isLoading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
    onFilterToggle?.();
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  const quickActions: MobileQuickActionProps[] = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: 'Thêm mới',
      onClick: () => console.log('Add new'),
      color: 'primary',
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: 'Tìm kiếm',
      onClick: () => console.log('Search'),
      color: 'secondary',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Báo cáo',
      onClick: () => console.log('Reports'),
      badge: 3,
      color: 'success',
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-button">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Button variant="ghost" className="w-full justify-start touch-button">
                    <User className="h-4 w-4 mr-2" />
                    Hồ sơ
                  </Button>
                  <Button variant="ghost" className="w-full justify-start touch-button">
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt
                  </Button>
                  <Button variant="ghost" className="w-full justify-start touch-button">
                    <Bell className="h-4 w-4 mr-2" />
                    Thông báo
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="touch-button"
              onClick={handleFilterToggle}
            >
              <Filter className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="touch-button relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                2
              </Badge>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        <div className="responsive-container">
          {/* Quick Actions */}
          <div className="mobile-quick-actions mb-6">
            {quickActions.map((action, index) => (
              <MobileQuickAction key={index} {...action} />
            ))}
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mobile-tabs mb-4">
              <TabsTrigger value="overview" className="mobile-tab">Tổng quan</TabsTrigger>
              <TabsTrigger value="analytics" className="mobile-tab">Phân tích</TabsTrigger>
              <TabsTrigger value="timeline" className="mobile-tab">Timeline</TabsTrigger>
              <TabsTrigger value="alerts" className="mobile-tab">Cảnh báo</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </>
                ) : (
                  children
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="space-y-4">
                <MobileSwipeableCard title="Biểu đồ hiệu suất">
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Biểu đồ sẽ được tải ở đây</p>
                  </div>
                </MobileSwipeableCard>
                
                <MobileSwipeableCard title="Xu hướng thời gian">
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Biểu đồ xu hướng sẽ được tải ở đây</p>
                  </div>
                </MobileSwipeableCard>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="space-y-4">
                <MobileSwipeableCard title="Lịch sử hoạt động">
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Hoạt động {item}</p>
                          <p className="text-xs text-gray-600">2 giờ trước</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </MobileSwipeableCard>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <div className="space-y-4">
                <MobileSwipeableCard title="Cảnh báo quan trọng">
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">Cảnh báo {item}</p>
                            <p className="text-xs text-red-700 mt-1">
                              Mô tả chi tiết về cảnh báo quan trọng cần xử lý ngay
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </MobileSwipeableCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        notificationCount={2}
      />
    </div>
  );
};

export default MobileLayout;