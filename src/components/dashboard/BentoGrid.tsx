import React from 'react';
import { cn } from '@/lib/utils';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  gap?: number;
}

export interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';
  priority?: 'high' | 'medium' | 'low';
}

/**
 * BentoGrid v2.0
 * Modern masonry-style grid layout inspired by Bento Box design
 * 
 * Features:
 * - Auto-fit responsive columns
 * - Flexible item sizing (small, medium, large, wide, tall, full)
 * - Priority-based ordering
 * - Smooth animations
 * - Responsive breakpoints
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
  columns = 12,
  gap = 16,
}) => {
  return (
    <div
      className={cn(
        "bento-grid",
        "grid gap-4 md:gap-6",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6",
        "auto-rows-[minmax(200px,auto)]",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * BentoGridItem v2.0
 * Individual items within the Bento Grid
 * 
 * Size options:
 * - small: 1x1 (KPI cards)
 * - medium: 2x1 (Bar charts, Category progress)
 * - large: 2x2 (Radar chart, AI Actions)
 * - wide: 3x1 (Timeline)
 * - tall: 1x2 (Vertical charts)
 * - full: 4x1 (Alert banner)
 */
export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  children,
  className,
  size = 'medium',
  priority = 'medium',
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2 row-span-2',
    wide: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 2xl:col-span-3',
    tall: 'col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-2',
    full: 'col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 2xl:col-span-6',
  };

  const priorityClasses = {
    high: 'order-1',
    medium: 'order-2',
    low: 'order-3',
  };

  return (
    <div
      className={cn(
        "bento-grid-item",
        "transition-all duration-300 ease-in-out",
        sizeClasses[size],
        priorityClasses[priority],
        className
      )}
    >
      {children}
    </div>
  );
};

export default BentoGrid;
