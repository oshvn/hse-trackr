import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '../DashboardLayout';

describe('DashboardLayout', () => {
  it('renders children correctly', () => {
    const testContent = 'Test Dashboard Content';
    render(
      <DashboardLayout alerts={[]}>
        <div>{testContent}</div>
      </DashboardLayout>
    );
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('displays AlertBanner when critical alerts exist', () => {
    const alertCounts = {
      critical: 3,
      blocking: 2,
      overdue: 1,
      missing: 0,
    };
    render(
      <DashboardLayout alertCounts={alertCounts}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText(/3 Red Cards Blocking/i)).toBeInTheDocument();
  });

  it('hides AlertBanner when no critical alerts', () => {
    const alertCounts = {
      critical: 0,
      blocking: 0,
      overdue: 0,
      missing: 0,
    };
    render(
      <DashboardLayout alertCounts={alertCounts}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.queryByText(/Red Cards Blocking/i)).not.toBeInTheDocument();
  });

  it('calls onAlertBannerAction when View All is clicked', () => {
    const mockAction = vi.fn();
    const alertCounts = {
      critical: 1,
      blocking: 1,
      overdue: 0,
      missing: 0,
    };
    render(
      <DashboardLayout
        alertCounts={alertCounts}
        onAlertBannerAction={mockAction}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText(/View All/i)).toBeInTheDocument();
  });

  it('has proper grid layout with responsive classes', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer?.className).toMatch(/grid-cols-1|md:grid-cols-8|lg:grid-cols-12/);
  });

  it('renders with default empty alerts', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(container).toBeInTheDocument();
  });
});
