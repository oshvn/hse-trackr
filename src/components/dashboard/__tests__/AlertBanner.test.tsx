import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from '../AlertBanner';

describe('AlertBanner', () => {
  const mockHandlers = {
    onViewAll: vi.fn(),
    onTakeAction: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when criticalCount > 0', () => {
    render(
      <AlertBanner
        criticalCount={3}
        blockingCount={2}
        {...mockHandlers}
      />
    );
    expect(screen.getByText(/CRITICAL: 3 Red Cards Blocking/i)).toBeInTheDocument();
  });

  it('displays correct blocking count', () => {
    render(
      <AlertBanner
        criticalCount={5}
        blockingCount={3}
        {...mockHandlers}
      />
    );
    expect(screen.getByText(/3 Blocking/i)).toBeInTheDocument();
  });

  it('calls onViewAll when View All button clicked', () => {
    render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    // ✅ Updated selector to match aria-label
    const viewAllBtn = screen.getByRole('button', { name: /View all critical alerts/i });
    fireEvent.click(viewAllBtn);
    expect(mockHandlers.onViewAll).toHaveBeenCalledTimes(1);
  });

  it('calls onTakeAction when Take Action button clicked', () => {
    render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    // ✅ Updated selector to match aria-label
    const takeActionBtn = screen.getByRole('button', { name: /Take recommended action/i });
    fireEvent.click(takeActionBtn);
    expect(mockHandlers.onTakeAction).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button clicked', () => {
    render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    // ✅ Updated selector to match aria-label
    const dismissBtn = screen.getByRole('button', { name: /Dismiss alert banner/i });
    fireEvent.click(dismissBtn);
    expect(mockHandlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has alert role for accessibility', () => {
    const { container } = render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('displays pulsing animation classes', () => {
    const { container } = render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    const pulseElement = container.querySelector('[class*="animate-pulse"]');
    expect(pulseElement).toBeInTheDocument();
  });

  it('renders gradient background styling', () => {
    const { container } = render(
      <AlertBanner
        criticalCount={1}
        blockingCount={1}
        {...mockHandlers}
      />
    );
    const banner = container.querySelector('[class*="bg-gradient"]');
    expect(banner).toBeInTheDocument();
  });
});
