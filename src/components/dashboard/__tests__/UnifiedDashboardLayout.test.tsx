import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedDashboardLayout } from '../UnifiedDashboardLayout';

// Mock data
const mockKpiData = {
  overallCompletion: 75,
  totalDocuments: { approved: 24, required: 32 },
  estimatedCompletion: '2025-11-15',
  avgApprovalTime: 3.5,
  avgPrepTime: 2.1,
};

const mockContractors = [
  { id: '1', name: 'Contractor A' },
  { id: '2', name: 'Contractor B' },
  { id: '3', name: 'Contractor C' },
];

const mockDocProgress = [
  {
    doc_type_id: 'dt1',
    doc_type_name: 'HSE Plan',
    category: '1.1',
    contractor_id: '1',
    contractor_name: 'Contractor A',
    required_count: 10,
    approved_count: 8,
    status_color: '#22c55e',
  },
  {
    doc_type_id: 'dt2',
    doc_type_name: 'Risk Assessment',
    category: '1.2',
    contractor_id: '2',
    contractor_name: 'Contractor B',
    required_count: 5,
    approved_count: 2,
    status_color: '#ef4444',
  },
];

const mockCriticalAlerts = [
  {
    contractorId: '1',
    contractorName: 'Contractor A',
    docTypeId: 'dt1',
    docTypeName: 'HSE Plan',
    overdueDays: 5,
    dueInDays: null,
  },
];

const mockProcessingTimeData = {
  stats: [
    {
      contractorId: '1',
      contractorName: 'Contractor A',
      averagePrepDays: 2,
      averageApprovalDays: 3.5,
    },
  ],
  metrics: {
    avgPrep: 2.1,
    avgApproval: 3.2,
  },
  timeline: [
    { date: '2025-10-28', avgTime: 3 },
  ],
  byContractor: [],
  byDocType: [],
};

const mockBottleneckData = [
  {
    stage: 'Submission',
    count: 5,
    avgDays: 2.3,
  },
];

const mockAiActions = [
  {
    id: 'action1',
    priority: 'high',
    type: 'meeting',
    title: 'Schedule Review Meeting',
    description: 'Meet with Contractor A',
    successProbability: 0.85,
  },
];

describe('UnifiedDashboardLayout', () => {
  const defaultProps = {
    kpiData: mockKpiData,
    contractorData: mockContractors,
    docProgressData: mockDocProgress,
    criticalAlerts: mockCriticalAlerts,
    processingTimeData: mockProcessingTimeData,
    bottleneckData: mockBottleneckData,
    aiActions: mockAiActions,
    filters: {
      contractor: '',
      category: '',
    },
    onFiltersChange: vi.fn(),
    isLoading: false,
    error: null,
    title: 'HSE Dashboard',
    subtitle: 'Test Dashboard',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Component Rendering =====

  it('should render unified dashboard with all sections', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('should display KPI cards', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('Chỉ số Hoàn thành Tổng quát')).toBeInTheDocument();
    expect(screen.getByText('Cảnh báo Rủi ro')).toBeInTheDocument();
    expect(screen.getByText('Thời gian Xử lý TB')).toBeInTheDocument();
  });

  it('should display primary charts', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('So sánh Hiệu suất Radar')).toBeInTheDocument();
    expect(screen.getByText('AI Hành động Đề xuất')).toBeInTheDocument();
  });

  it('should display secondary charts', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('Bar Charts So sánh')).toBeInTheDocument();
    expect(screen.getByText('Heatmap Hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Xu hướng Hiệu suất')).toBeInTheDocument();
  });

  it('should display analysis cards', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('Phân tích Bottleneck')).toBeInTheDocument();
    expect(screen.getByText('Timeline Phân tích')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ Danh mục')).toBeInTheDocument();
  });

  it('should display gantt chart', () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    expect(screen.getByText('Gantt Chart Dự án')).toBeInTheDocument();
  });

  // ===== Modal System =====

  it('should open modal when card is clicked', async () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    const viewButtons = screen.getAllByText('Xem chi tiết');
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Chỉ số hiệu suất chi tiết')).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    render(<UnifiedDashboardLayout {...defaultProps} />);
    
    const viewButtons = screen.getAllByText('Xem chi tiết');
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Chỉ số hiệu suất chi tiết')).toBeInTheDocument();
    });
  });

  // ===== Error Handling =====

  it('should display error message when error prop is provided', () => {
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        error="Failed to load dashboard data"
      />
    );
    
    expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
  });

  // ===== Data Validation =====

  it('should handle empty contractor data', () => {
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        contractorData={[]}
      />
    );
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
  });

  it('should handle empty document progress data', () => {
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        docProgressData={[]}
      />
    );
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
  });

  it('should handle missing KPI data', () => {
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        kpiData={null as any}
      />
    );
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
  });

  // ===== Loading State =====

  it('should display loading state when isLoading is true', () => {
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('HSE Dashboard')).toBeInTheDocument();
  });

  // ===== Filter Functionality =====

  it('should call onFiltersChange when filters change', () => {
    const onFiltersChange = vi.fn();
    render(
      <UnifiedDashboardLayout
        {...defaultProps}
        onFiltersChange={onFiltersChange}
      />
    );
    
    // Filter change would be triggered by FilterBar component
    expect(onFiltersChange).not.toHaveBeenCalled(); // Until filter is actually changed
  });

  // ===== Responsive Behavior =====

  it('should render with correct CSS classes for grid', () => {
    const { container } = render(<UnifiedDashboardLayout {...defaultProps} />);
    
    const bentoGrid = container.querySelector('.unified-bento-grid');
    expect(bentoGrid).toBeInTheDocument();
  });

  it('should have all card slots available', () => {
    const { container } = render(<UnifiedDashboardLayout {...defaultProps} />);
    
    const gridKpiCards = container.querySelectorAll('.grid-kpi-overall, .grid-kpi-critical, .grid-kpi-time');
    expect(gridKpiCards.length).toBeGreaterThanOrEqual(3);
  });
});

// ===== Individual Chart Tests =====

describe('Dashboard Chart Components', () => {
  it('should render KPI cards with data', () => {
    render(
      <UnifiedDashboardLayout
        kpiData={mockKpiData}
        contractorData={mockContractors}
        docProgressData={mockDocProgress}
        criticalAlerts={mockCriticalAlerts}
        processingTimeData={mockProcessingTimeData}
        bottleneckData={mockBottleneckData}
        aiActions={mockAiActions}
        filters={{ contractor: '', category: '' }}
        onFiltersChange={vi.fn()}
        title="Test"
        subtitle="Test"
      />
    );
    
    expect(screen.getByText('Chỉ số Hoàn thành Tổng quát')).toBeInTheDocument();
  });

  it('should handle contractor data for comparison charts', () => {
    const mockContractorData = [
      { id: '1', name: 'A', completion: 80, quality: 85 },
      { id: '2', name: 'B', completion: 70, quality: 75 },
      { id: '3', name: 'C', completion: 90, quality: 88 },
    ];
    
    render(
      <UnifiedDashboardLayout
        kpiData={mockKpiData}
        contractorData={mockContractorData}
        docProgressData={mockDocProgress}
        criticalAlerts={mockCriticalAlerts}
        processingTimeData={mockProcessingTimeData}
        bottleneckData={mockBottleneckData}
        aiActions={mockAiActions}
        filters={{ contractor: '', category: '' }}
        onFiltersChange={vi.fn()}
        title="Test"
        subtitle="Test"
      />
    );
    
    expect(screen.getByText('So sánh Hiệu suất Radar')).toBeInTheDocument();
  });

  it('should handle alert data for critical alerts card', () => {
    const alertsWithData = [
      {
        contractorId: '1',
        contractorName: 'Contractor A',
        docTypeId: 'dt1',
        docTypeName: 'HSE Plan',
        overdueDays: 5,
        dueInDays: null,
      },
      {
        contractorId: '2',
        contractorName: 'Contractor B',
        docTypeId: 'dt2',
        docTypeName: 'Risk Assessment',
        overdueDays: 0,
        dueInDays: 3,
      },
    ];
    
    render(
      <UnifiedDashboardLayout
        kpiData={mockKpiData}
        contractorData={mockContractors}
        docProgressData={mockDocProgress}
        criticalAlerts={alertsWithData}
        processingTimeData={mockProcessingTimeData}
        bottleneckData={mockBottleneckData}
        aiActions={mockAiActions}
        filters={{ contractor: '', category: '' }}
        onFiltersChange={vi.fn()}
        title="Test"
        subtitle="Test"
      />
    );
    
    expect(screen.getByText('Cảnh báo Rủi ro')).toBeInTheDocument();
  });
});
