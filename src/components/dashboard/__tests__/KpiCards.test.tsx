import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KpiCards } from '../KpiCards';

// Mock data for testing
const mockProps = {
  overallCompletion: 75,
  totalApproved: 150,
  totalRequired: 200,
  estimatedCompletion: '15/12/2023',
  redCardsCount: 5,
  missingDocsCount: 3,
  overdueDocsCount: 2,
  contractorsCantStart: 2,
  avgApprovalTime: 3.5,
  avgPrepTime: 2.1,
  lastWeekApprovalTime: 4.2,
  targetApprovalTime: 3,
  isLoading: false,
  onViewCompletionDetails: vi.fn(),
  onViewRedCardsDetails: vi.fn(),
  onViewApprovalTimeDetails: vi.fn(),
};

describe('KpiCards Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI cards correctly', () => {
    render(<KpiCards {...mockProps} />);
    
    // Check if all three KPI cards are rendered
    expect(screen.getByText('Tỷ lệ Hoàn thành Toàn bộ Hồ sơ')).toBeInTheDocument();
    expect(screen.getByText('Red Cards - Cảnh báo Rủi ro Thi công')).toBeInTheDocument();
    expect(screen.getByText('Thời gian Phê duyệt Trung bình')).toBeInTheDocument();
  });

  it('displays correct completion percentage', () => {
    render(<KpiCards {...mockProps} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('150/200 yêu cầu đã duyệt')).toBeInTheDocument();
  });

  it('displays correct red cards count', () => {
    render(<KpiCards {...mockProps} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3 thiếu + 2 quá hạn')).toBeInTheDocument();
  });

  it('displays correct approval time', () => {
    render(<KpiCards {...mockProps} />);
    
    expect(screen.getByText('3.5 ngày')).toBeInTheDocument();
    expect(screen.getByText('Chuẩn bị: 2.1 ngày + Phê duyệt: 3.5 ngày')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<KpiCards {...mockProps} isLoading={true} />);
    
    // Check for skeleton loaders
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies correct variant styles based on completion rate', () => {
    const { rerender } = render(<KpiCards {...mockProps} />);
    
    // High completion (>= 80%) should have success variant
    rerender(<KpiCards {...mockProps} overallCompletion={85} />);
    const completionCard = screen.getByText('85%').closest('.bg-green-50');
    expect(completionCard).toBeInTheDocument();
    
    // Low completion (< 50%) should have default variant
    rerender(<KpiCards {...mockProps} overallCompletion={45} />);
    const lowCompletionCard = screen.getByText('45%').closest('.bg-white');
    expect(lowCompletionCard).toBeInTheDocument();
  });

  it('applies correct variant styles based on red cards count', () => {
    const { rerender } = render(<KpiCards {...mockProps} />);
    
    // No red cards should have success variant
    rerender(<KpiCards {...mockProps} redCardsCount={0} />);
    const redCardElement = screen.getByText('0').closest('.bg-green-50');
    expect(redCardElement).toBeInTheDocument();
    
    // Red cards present should have warning variant
    rerender(<KpiCards {...mockProps} redCardsCount={5} />);
    const redCardWarningElement = screen.getByText('5').closest('.bg-amber-50');
    expect(redCardWarningElement).toBeInTheDocument();
  });

  it('applies correct variant styles based on approval time', () => {
    const { rerender } = render(<KpiCards {...mockProps} />);
    
    // Approval time within target should have success variant
    rerender(<KpiCards {...mockProps} avgApprovalTime={2} targetApprovalTime={3} />);
    const approvalCard = screen.getByText('2 ngày').closest('.bg-green-50');
    expect(approvalCard).toBeInTheDocument();
    
    // Approval time exceeding target should have default variant
    rerender(<KpiCards {...mockProps} avgApprovalTime={5} targetApprovalTime={3} />);
    const approvalWarningCard = screen.getByText('5 ngày').closest('.bg-white');
    expect(approvalWarningCard).toBeInTheDocument();
  });

  it('shows correct trend indicators', () => {
    render(<KpiCards {...mockProps} />);
    
    // Check for trend icons (up/down/neutral)
    const trendIcons = screen.getAllByTestId('trend-icon');
    expect(trendIcons.length).toBe(3);
  });

  it('calls callback functions when action buttons are clicked', async () => {
    const mockOnViewCompletionDetails = vi.fn();
    const mockOnViewRedCardsDetails = vi.fn();
    const mockOnViewApprovalTimeDetails = vi.fn();
    
    render(
      <KpiCards
        {...mockProps}
        onViewCompletionDetails={mockOnViewCompletionDetails}
        onViewRedCardsDetails={mockOnViewRedCardsDetails}
        onViewApprovalTimeDetails={mockOnViewApprovalTimeDetails}
      />
    );
    
    // Click completion details button
    const completionButton = screen.getByText('Xem chi tiết theo loại hồ sơ');
    fireEvent.click(completionButton);
    expect(mockOnViewCompletionDetails).toHaveBeenCalledTimes(1);
    
    // Click red cards details button
    const redCardsButton = screen.getByText('Xem danh sách chi tiết');
    fireEvent.click(redCardsButton);
    expect(mockOnViewRedCardsDetails).toHaveBeenCalledTimes(1);
    
    // Click approval time details button
    const approvalButton = screen.getByText('Xem chi tiết theo nhà thầu');
    fireEvent.click(approvalButton);
    expect(mockOnViewApprovalTimeDetails).toHaveBeenCalledTimes(1);
  });

  it('displays tooltips on hover', async () => {
    render(<KpiCards {...mockProps} />);
    
    // Hover over a KPI card to trigger tooltip
    const completionCard = screen.getByText('75%').closest('[data-testid="kpi-card"]');
    if (completionCard) {
      fireEvent.mouseEnter(completionCard);
      
      await waitFor(() => {
        expect(screen.getByText('Tỷ lệ hoàn thành tổng thể của tất cả các hồ sơ yêu cầu')).toBeInTheDocument();
      });
    }
  });

  it('shows correct details in expanded view', () => {
    render(<KpiCards {...mockProps} />);
    
    // Check for detail information
    expect(screen.getByText('Dự kiến hoàn thành: 15/12/2023')).toBeInTheDocument();
    expect(screen.getByText('Còn lại: 50 hồ sơ')).toBeInTheDocument();
    expect(screen.getByText('2 nhà thầu chưa thể bắt đầu thi công')).toBeInTheDocument();
    expect(screen.getByText('Cần hành động khẩn cấp')).toBeInTheDocument();
  });

  it('handles edge cases correctly', () => {
    // Test with zero values
    render(
      <KpiCards
        {...mockProps}
        overallCompletion={0}
        totalApproved={0}
        totalRequired={0}
        redCardsCount={0}
        avgApprovalTime={0}
        avgPrepTime={0}
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0/0 yêu cầu đã duyệt')).toBeInTheDocument();
    expect(screen.getByText('0 ngày')).toBeInTheDocument();
  });

  it('calculates comparison values correctly', () => {
    render(<KpiCards {...mockProps} />);
    
    // Should show comparison with last week
    expect(screen.getByText(/So với tuần trước:/)).toBeInTheDocument();
    expect(screen.getByText(/Mục tiêu: 3 ngày/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<KpiCards {...mockProps} />);
    
    // Check for proper ARIA labels
    const kpiCards = screen.getAllByRole('article');
    kpiCards.forEach(card => {
      expect(card).toHaveAttribute('aria-label');
    });
    
    // Check buttons have proper accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});