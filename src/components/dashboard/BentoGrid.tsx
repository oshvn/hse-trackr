import React from 'react';
import { cn } from '@/lib/utils';
import './bento-grid.css';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  area?: string;
  row?: string;
  col?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bento-grid grid gap-4 auto-rows-min w-full",
        // Grid layout is now defined in CSS file to avoid conflicts
        className
      )}
      style={{
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  children,
  className,
  area,
  row,
  col
}) => {
  const gridAreaStyle: React.CSSProperties = {};
  
  if (area) {
    gridAreaStyle.gridArea = area;
  }
  
  if (row) {
    gridAreaStyle.gridRow = row;
  }
  
  if (col) {
    gridAreaStyle.gridColumn = col;
  }

  return (
    <div
      className={cn(
        "bento-grid-item transition-all duration-500 ease-in-out",
        "hover:shadow-md rounded-lg",
        "min-h-[200px]", // Ensure minimum height for all grid items
        className
      )}
      data-area={area}
      style={{
        ...gridAreaStyle,
        transition: 'grid-template-columns 0.3s ease-in-out, grid-template-rows 0.3s ease-in-out, all 0.3s ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

// Specific bento items with predefined areas
export const BentoHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="header" className={cn("min-h-[auto]", className)}>
    {children}
  </BentoGridItem>
);

export const BentoFilters: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="filters" className={cn("min-h-[auto]", className)}>
    {children}
  </BentoGridItem>
);

export const BentoKpi: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="kpi" className={className}>
    <div className="chart-container h-full">
      {children}
    </div>
  </BentoGridItem>
);

export const BentoPriority: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="priority" className={className}>
    {children}
  </BentoGridItem>
);

export const BentoAnalysis: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="analysis" className={className}>
    <div className="chart-container h-full">
      {children}
    </div>
  </BentoGridItem>
);

export const BentoDetails: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <BentoGridItem area="details" className={cn("min-h-[auto]", className)}>
    {children}
  </BentoGridItem>
);

// Flexible grid item for custom layouts
export const BentoCustom: React.FC<{
  children: React.ReactNode;
  className?: string;
  area?: string;
  row?: string;
  col?: string;
}> = ({ children, className, area, row, col }) => (
  <BentoGridItem area={area} row={row} col={col} className={className}>
    {children}
  </BentoGridItem>
);