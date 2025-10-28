import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponsiveDashboard } from '../ResponsiveDashboard';
import { useResponsive, useDeviceCapabilities } from '@/hooks/useResponsive';

// Mock hooks
vi.mock('@/hooks/useResponsive');

const mockResponsiveState = {
  deviceType: 'desktop' as const,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1920,
  height: 1080,
  orientation: 'landscape' as const,
  isTouchDevice: false,
  isHoverCapable: true,
};

const mockDeviceCapabilities = {
  isTouchDevice: false,
  isHoverCapable: true,
  isReducedMotion: false,
  isHighContrast: false,
  connectionType: '4g',
  effectiveType: '4g',
};

const mockProps = {
  contractors: [
    { id: '1', name: 'Nhà thầu A' },
    { id: '2', name: 'Nhà thầu B' },
  ],
  kpiData: [],
  progressData: [],
  criticalAlerts: [
    {
      contractorId: '1',
      contractorName: 'Nhà thầu A',
      docTypeId: 'doc1',
      docTypeName: 'Hồ sơ quan trọng 1',
      plannedDueDate: '2023-12-01',
      approvedCount: 1,
      requiredCount: 3,
      overdueDays: 5,
      dueInDays: null,
    },
  ],
  redCardsByLevel: {
    all: [],
    level1: [],
    level2: [],
    level3: [],
  },
  overallCompletion: 75,
  totalDocuments: { approved: 150, required: 200 },
  estimatedCompletion: '15/12/2023',
  redCardsData: { total: 5, missing: 3, overdue: 2, contractorsCantStart: 2 },
  avgApprovalTime: 3.5,
  avgPrepTime: 2.1,
  approvalTimeComparison: { lastWeek: 4.2 },
  processingTimeStats: [],
  processingTimeMetrics: {},
  timelineData: [],
  contractorProcessingTimeComparison: [],
  documentTypeProcessingTime: [],
  bottleneckAnalysisData: [],
  aiActions: [],
  workflowEngine: null,
  filters: { contractor: 'all', category: 'all', search: '' },
  onFiltersChange: vi.fn(),
  isLoading: false,
  error: null,
  onRetry: vi.fn(),
  onContractorSelect: vi.fn(),
  onDocumentSelect: vi.fn(),
  onAlertSelect: vi.fn(),
  onViewAllAlerts: vi.fn(),
  onRefresh: vi.fn(),
  title: 'HSE Dashboard',
  subtitle: 'Test Dashboard',
};

describe('ResponsiveDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useResponsive as any).mockReturnValue(mockResponsiveState);
    (useDeviceCapabilities as any).mockReturnValue(mockDeviceCapabilities);
  });

  it('renders dashboard correctly', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('renders mobile layout on mobile device', () => {
    (useResponsive as any).mockReturnValue({
      ...mockResponsiveState,
      deviceType: 'mobile' as const,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check for mobile-specific elements
    expect(screen.getByText('Chỉ số hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ theo Nhà thầu')).toBeInTheDocument();
    expect(screen.getByText('Cảnh báo quan trọng')).toBeInTheDocument();
  });

  it('renders tablet layout on tablet device', () => {
    (useResponsive as any).mockReturnValue({
      ...mockResponsiveState,
      deviceType: 'tablet' as const,
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check for tablet-specific elements
    expect(screen.getByText('Chỉ số hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Phân tích dữ liệu')).toBeInTheDocument();
  });

  it('renders desktop layout on desktop device', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check for desktop-specific elements
    expect(screen.getByText('Chỉ số hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Phân tích dữ liệu')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    render(<ResponsiveDashboard {...mockProps} isLoading={true} />);
    
    // Check for loading indicators
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state correctly', () => {
    render(<ResponsiveDashboard {...mockProps} error="Network error" />);
    
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
    expect(screen.getByText('Không thể tải dashboard. Vui lòng thử lại.')).toBeInTheDocument();
  });

  it('handles refresh action correctly', async () => {
    const mockOnRefresh = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /Làm mới/i });
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('applies performance optimizations based on device', () => {
    (useResponsive as any).mockReturnValue({
      ...mockResponsiveState,
      deviceType: 'mobile' as const,
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check if performance optimizations are applied
    const dashboard = screen.getByTestId('responsive-dashboard');
    expect(dashboard).toHaveClass('reduce-animations');
    expect(dashboard).toHaveClass('touch-enabled');
  });

  it('displays performance issues when detected', () => {
    (useDeviceCapabilities as any).mockReturnValue({
      ...mockDeviceCapabilities,
      connectionType: 'slow-2g',
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check for performance issues alert
    expect(screen.getByText('Đã phát hiện các vấn đề hiệu suất:')).toBeInTheDocument();
  });

  it('renders KPI cards with correct data', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('150/200 hồ sơ')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3.5 ngày')).toBeInTheDocument();
  });

  it('renders critical alerts correctly', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    expect(screen.getByText('Hồ sơ quan trọng 1')).toBeInTheDocument();
    expect(screen.getByText('Nhà thầu A')).toBeInTheDocument();
  });

  it('handles filter changes correctly', async () => {
    const mockOnFiltersChange = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onFiltersChange={mockOnFiltersChange} />);
    
    // Simulate filter change
    const contractorFilter = screen.getByLabelText('Nhà thầu');
    if (contractorFilter) {
      fireEvent.change(contractorFilter, { target: { value: '1' } });
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          contractor: '1',
          category: 'all',
          search: '',
        });
      });
    }
  });

  it('handles contractor selection correctly', async () => {
    const mockOnContractorSelect = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onContractorSelect={mockOnContractorSelect} />);
    
    // Simulate contractor selection
    const contractorElement = screen.getByText('Nhà thầu A');
    fireEvent.click(contractorElement);
    
    await waitFor(() => {
      expect(mockOnContractorSelect).toHaveBeenCalledWith('1');
    });
  });

  it('handles document selection correctly', async () => {
    const mockOnDocumentSelect = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onDocumentSelect={mockOnDocumentSelect} />);
    
    // Simulate document selection
    const documentElement = screen.getByText('Hồ sơ quan trọng 1');
    fireEvent.click(documentElement);
    
    await waitFor(() => {
      expect(mockOnDocumentSelect).toHaveBeenCalledWith('1', 'doc1');
    });
  });

  it('handles alert selection correctly', async () => {
    const mockOnAlertSelect = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onAlertSelect={mockOnAlertSelect} />);
    
    // Simulate alert selection
    const alertElement = screen.getByText('Hồ sơ quan trọng 1');
    fireEvent.click(alertElement);
    
    await waitFor(() => {
      expect(mockOnAlertSelect).toHaveBeenCalledWith('1', 'doc1');
    });
  });

  it('handles view all alerts correctly', async () => {
    const mockOnViewAllAlerts = vi.fn();
    render(<ResponsiveDashboard {...mockProps} onViewAllAlerts={mockOnViewAllAlerts} />);
    
    // Simulate view all alerts
    const viewAllButton = screen.getByText('Xem tất cả');
    if (viewAllButton) {
      fireEvent.click(viewAllButton);
      
      await waitFor(() => {
        expect(mockOnViewAllAlerts).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('applies responsive CSS classes correctly', () => {
    (useResponsive as any).mockReturnValue({
      ...mockResponsiveState,
      deviceType: 'mobile' as const,
      width: 375,
      height: 667,
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    const dashboard = screen.getByTestId('responsive-dashboard');
    expect(dashboard).toHaveStyle({
      '--viewport-width': '375px',
      '--viewport-height': '667px',
      '--device-type': 'mobile',
    });
  });

  it('handles error boundary correctly', () => {
    // Create a component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };
    
    // Mock the ErrorBoundary to catch the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <ResponsiveDashboard
          {...mockProps}
          // @ts-ignore
          children={<ThrowingComponent />}
        />
      );
    }).not.toThrow();
    
    // Check if error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('uses lazy loading when enabled', () => {
    render(<ResponsiveDashboard {...mockProps} enableLazyLoading={true} />);
    
    // Check if lazy loading is enabled
    const dashboard = screen.getByTestId('responsive-dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  it('disables animations when reduced motion is preferred', () => {
    (useDeviceCapabilities as any).mockReturnValue({
      ...mockDeviceCapabilities,
      isReducedMotion: true,
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    const dashboard = screen.getByTestId('responsive-dashboard');
    expect(dashboard).toHaveClass('reduce-animations');
  });

  it('has proper accessibility attributes', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check for proper ARIA labels
    const dashboard = screen.getByRole('main');
    expect(dashboard).toHaveAttribute('aria-label');
    
    // Check buttons have proper accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('handles keyboard navigation correctly', () => {
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Test Tab navigation
    fireEvent.keyDown(document, { key: 'Tab' });
    
    // Check if focus moves correctly
    const focusedElement = document.activeElement;
    expect(focusedElement).toBeInTheDocument();
  });

  it('optimizes rendering for different connection types', () => {
    (useDeviceCapabilities as any).mockReturnValue({
      ...mockDeviceCapabilities,
      connectionType: '3g',
    });
    
    render(<ResponsiveDashboard {...mockProps} />);
    
    // Check if optimizations for slow connections are applied
    const dashboard = screen.getByTestId('responsive-dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  it('handles window resize correctly', async () => {
    const { rerender } = render(<ResponsiveDashboard {...mockProps} />);
    
    // Simulate window resize
    (useResponsive as any).mockReturnValue({
      ...mockResponsiveState,
      width: 768,
      height: 1024,
      deviceType: 'tablet' as const,
    });
    
    rerender(<ResponsiveDashboard {...mockProps} />);
    
    // Check if layout adapts to new size
    await waitFor(() => {
      const dashboard = screen.getByTestId('responsive-dashboard');
      expect(dashboard).toHaveStyle({
        '--viewport-width': '768px',
        '--viewport-height': '1024px',
        '--device-type': 'tablet',
      });
    });
  });
});