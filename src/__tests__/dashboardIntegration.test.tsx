import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useModal } from '../hooks/useModal';
import { useFilters } from '../hooks/useFilters';

/**
 * Integration tests for hooks and state management
 * Focus on hook interactions without API dependencies
 */

describe('Dashboard Hooks Integration', () => {
  describe('Modal & Filter Integration', () => {
    it('opens and closes modal correctly', async () => {
      const TestComponent = () => {
        const { modal, openModal, closeModal } = useModal();
        return (
          <div>
            <button onClick={() => openModal('alerts')} data-testid="open-modal">
              Open Modal
            </button>
            <button onClick={closeModal} data-testid="close-modal">
              Close Modal
            </button>
            <div data-testid="modal-status">
              {modal.isOpen ? `Open: ${modal.type}` : 'Closed'}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const openBtn = screen.getByTestId('open-modal');
      fireEvent.click(openBtn);

      await waitFor(() => {
        expect(screen.getByTestId('modal-status')).toHaveTextContent('Open: alerts');
      });

      const closeBtn = screen.getByTestId('close-modal');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.getByTestId('modal-status')).toHaveTextContent('Closed');
      });
    });

    it('switches between modal types', async () => {
      const TestComponent = () => {
        const { modal, openModal } = useModal();
        return (
          <div>
            <button onClick={() => openModal('alerts')} data-testid="btn-alerts">
              Alerts
            </button>
            <button onClick={() => openModal('radar')} data-testid="btn-radar">
              Radar
            </button>
            <div data-testid="modal-type">{modal.type || 'none'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      const alertsBtn = screen.getByTestId('btn-alerts');
      fireEvent.click(alertsBtn);

      await waitFor(() => {
        expect(screen.getByTestId('modal-type')).toHaveTextContent('alerts');
      });

      const radarBtn = screen.getByTestId('btn-radar');
      fireEvent.click(radarBtn);

      await waitFor(() => {
        expect(screen.getByTestId('modal-type')).toHaveTextContent('radar');
      });
    });
  });

  describe('Filter Management Integration', () => {
    it('toggles contractor filter on/off', async () => {
      const TestComponent = () => {
        const { filters, toggleContractor } = useFilters();
        return (
          <div>
            <button onClick={() => toggleContractor('1')} data-testid="toggle-contractor">
              Toggle Contractor 1
            </button>
            <div data-testid="filter-count">
              Contractors: {filters.contractors.length}
            </div>
            <div data-testid="contractor-list">
              {filters.contractors.join(', ')}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const toggleBtn = screen.getByTestId('toggle-contractor');

      // Initially 0
      expect(screen.getByTestId('filter-count')).toHaveTextContent('Contractors: 0');

      // Toggle on
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(screen.getByTestId('filter-count')).toHaveTextContent('Contractors: 1');
      });

      // Toggle off
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(screen.getByTestId('filter-count')).toHaveTextContent('Contractors: 0');
      });
    });

    it('adds multiple contractor filters', async () => {
      const TestComponent = () => {
        const { filters, toggleContractor } = useFilters();
        return (
          <div>
            <button onClick={() => toggleContractor('A')} data-testid="toggle-a">
              Toggle A
            </button>
            <button onClick={() => toggleContractor('B')} data-testid="toggle-b">
              Toggle B
            </button>
            <div data-testid="filter-count">
              Count: {filters.contractors.length}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('toggle-a'));
      fireEvent.click(screen.getByTestId('toggle-b'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-count')).toHaveTextContent('Count: 2');
      });
    });

    it('clears all filters', async () => {
      const TestComponent = () => {
        const { filters, toggleContractor, clearFilters } = useFilters();
        return (
          <div>
            <button onClick={() => toggleContractor('1')} data-testid="add-filter">
              Add Filter
            </button>
            <button onClick={clearFilters} data-testid="clear-all">
              Clear All
            </button>
            <div data-testid="count">{filters.contractors.length}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Add filter
      fireEvent.click(screen.getByTestId('add-filter'));
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
      });

      // Clear all
      fireEvent.click(screen.getByTestId('clear-all'));
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0');
      });
    });
  });

  describe('Modal + Filter Combined', () => {
    it('keeps modal state independent from filter state', async () => {
      const TestComponent = () => {
        const { modal, openModal, closeModal } = useModal();
        const { filters, toggleContractor } = useFilters();

        return (
          <div>
            <button onClick={() => openModal('alerts')} data-testid="open">
              Open Modal
            </button>
            <button onClick={() => toggleContractor('1')} data-testid="filter">
              Add Filter
            </button>
            <div data-testid="modal">{modal.isOpen ? 'open' : 'closed'}</div>
            <div data-testid="filters">{filters.contractors.length}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Open modal
      fireEvent.click(screen.getByTestId('open'));
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveTextContent('open');
        expect(screen.getByTestId('filters')).toHaveTextContent('0');
      });

      // Add filter (shouldn't affect modal)
      fireEvent.click(screen.getByTestId('filter'));
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveTextContent('open');
        expect(screen.getByTestId('filters')).toHaveTextContent('1');
      });
    });
  });

  describe('Filter Persistence', () => {
    it('filters persist in localStorage', async () => {
      const TestComponent = () => {
        const { filters, toggleContractor } = useFilters();

        return (
          <div>
            <button onClick={() => toggleContractor('1')} data-testid="toggle">
              Toggle
            </button>
            <div data-testid="display">{filters.contractors.length}</div>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('display')).toHaveTextContent('1');
      });

      // Check localStorage was called
      const stored = localStorage.getItem('dashboardFilters');
      expect(stored).toBeTruthy();
    });
  });

  describe('Hook State Updates', () => {
    it('handles rapid filter toggles', async () => {
      const TestComponent = () => {
        const { filters, toggleContractor } = useFilters();

        return (
          <div>
            <button
              onClick={() => {
                toggleContractor('1');
                toggleContractor('2');
                toggleContractor('3');
              }}
              data-testid="multi-toggle">
              Toggle Multiple
            </button>
            <div data-testid="count">{filters.contractors.length}</div>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('multi-toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });
    });

    it('modal state updates independently', async () => {
      const TestComponent = () => {
        const { modal, openModal, switchModal } = useModal();

        return (
          <div>
            <button onClick={() => openModal('alerts')} data-testid="open-alerts">
              Alerts
            </button>
            <button onClick={() => switchModal('radar')} data-testid="switch-radar">
              Radar
            </button>
            <div data-testid="type">{modal.type}</div>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('open-alerts'));
      await waitFor(() => {
        expect(screen.getByTestId('type')).toHaveTextContent('alerts');
      });

      fireEvent.click(screen.getByTestId('switch-radar'));
      await waitFor(() => {
        expect(screen.getByTestId('type')).toHaveTextContent('radar');
      });
    });
  });
});
