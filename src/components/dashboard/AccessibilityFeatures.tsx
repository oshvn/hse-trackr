import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface AccessibilityProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

interface FocusTrapProps {
  isActive: boolean;
  onEscape?: () => void;
  children: React.ReactNode;
}

interface AnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  timeout?: number;
}

/**
 * Skip link component for accessibility
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        'absolute top-0 left-0 z-50 p-2 bg-primary text-primary-foreground rounded-md -translate-y-full focus:translate-y-0 transition-transform',
        className
      )}
    >
      {children}
    </a>
  );
};

/**
 * Accessible button component
 */
export const AccessibleButton: React.FC<AccessibilityProps> = ({
  children,
  className,
  ariaLabel,
  ariaDescribedBy,
  role,
  tabIndex,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  const { deviceType, isTouchDevice } = useResponsive();
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
    onKeyDown?.(event);
  }, [onClick, onKeyDown]);
  
  // Add touch-specific handling for mobile
  const handleTouchStart = useCallback(() => {
    if (isTouchDevice) {
      onClick?.();
    }
  }, [onClick, isTouchDevice]);
  
  return (
    <button
      ref={buttonRef}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md',
        isTouchDevice && 'touch-manipulation',
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
    >
      {children}
    </button>
  );
};

/**
 * Focus trap component for modals
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({ isActive, onEscape, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Save the previously focused element
  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isActive]);
  
  // Restore focus when trap is deactivated
  useEffect(() => {
    if (!isActive && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isActive]);
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        onEscape?.();
      }
    };
    
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onEscape]);
  
  // Set focus to first focusable element when trap is activated
  useEffect(() => {
    if (isActive && containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isActive]);
  
  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

/**
 * Screen reader announcer component
 */
export const Announcer: React.FC<AnnouncerProps> = ({
  message,
  politeness = 'polite',
  timeout = 1000,
}) => {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      
      // Clear the announcement after timeout
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [message, timeout]);
  
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

/**
 * Accessible form input component
 */
export const AccessibleInput: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'aria-label'> & {
    label: string;
    error?: string;
    required?: boolean;
  }
> = ({ label, error, required, id, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  
  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className={cn(
          'block text-sm font-medium',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          error && 'border-destructive focus:ring-destructive'
        )}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        aria-required={required}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Accessible table component
 */
export const AccessibleTable: React.FC<{
  headers: Array<{ key: string; label: string; width?: string; sortable?: boolean }>;
  rows: Array<Record<string, any>>;
  caption?: string;
  className?: string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}> = ({ 
  headers, 
  rows, 
  caption, 
  className, 
  onSort, 
  sortKey, 
  sortDirection 
}) => {
  const { deviceType } = useResponsive();
  
  // Handle sort click
  const handleSortClick = useCallback((key: string) => {
    if (onSort && headers.find(h => h.key === key)?.sortable) {
      onSort(key);
    }
  }, [onSort, headers]);
  
  // Determine if should use mobile layout
  const shouldUseMobileLayout = deviceType === 'mobile';
  
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                scope="col"
                className={cn(
                  'text-left p-2 border-b bg-muted font-medium',
                  header.sortable && 'cursor-pointer hover:bg-muted/80',
                  header.width && `w-${header.width}`
                )}
                aria-sort={
                  sortKey === header.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                onClick={() => handleSortClick(header.key)}
              >
                <div className="flex items-center">
                  {header.label}
                  {header.sortable && sortKey === header.key && (
                    <span className="ml-1" aria-hidden="true">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
              {headers.map((header) => (
                <td
                  key={header.key}
                  className="p-2 border-b"
                  data-label={header.label}
                >
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Accessible chart wrapper
 */
export const AccessibleChart: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  data?: any;
  type?: string;
}> = ({ title, description, children, className, data, type }) => {
  const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = `${chartId}-description`;
  const tableId = `${chartId}-table`;
  const [showDataTable, setShowDataTable] = useState(false);
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 id={chartId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          className="text-sm text-primary underline"
          aria-expanded={showDataTable}
          aria-controls={tableId}
          onClick={() => setShowDataTable(!showDataTable)}
        >
          {showDataTable ? 'Hide' : 'Show'} data table
        </button>
      </div>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div
        role="img"
        aria-labelledby={chartId}
        aria-describedby={descriptionId}
        className={cn('w-full', className)}
      >
        {children}
      </div>
      
      {showDataTable && (
        <div id={tableId} className="mt-4 border rounded-md p-4">
          <h3 className="text-md font-medium mb-2">Data Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {data && data.length > 0 && Object.keys(data[0]).map((key) => (
                    <th key={key} className="text-left p-2 border-b bg-muted font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data && data.map((row: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    {Object.values(row).map((value: any, cellIndex: number) => (
                      <td key={cellIndex} className="p-2 border-b">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Mobile navigation component
 */
export const MobileNavigation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const { deviceType } = useResponsive();
  const navRef = useRef<HTMLDivElement>(null);
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Only render on mobile devices
  if (deviceType !== 'mobile') {
    return null;
  }
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Navigation panel */}
          <div
            ref={navRef}
            className="relative flex flex-col w-64 h-full bg-background shadow-lg"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <button
                className="p-2 rounded-md hover:bg-muted"
                onClick={onClose}
                aria-label="Close navigation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Touch-friendly slider component
 */
export const TouchSlider: React.FC<{
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}> = ({ label, min, max, step = 1, value, onChange, className }) => {
  const { deviceType, isTouchDevice } = useResponsive();
  const sliderRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle mouse/touch events
  const handleStart = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
    } else {
      clientX = (event as MouseEvent).clientX;
    }
    
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + percent * (max - min);
    
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, min, max, step, onChange]);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);
  
  // Determine if should use touch-friendly UI
  const shouldUseTouchUI = deviceType === 'mobile' || isTouchDevice;
  
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
            shouldUseTouchUI && 'h-8',
            className
          )}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
        {shouldUseTouchUI && (
          <div
            className="absolute top-0 left-0 h-8 w-8 bg-primary rounded-full shadow-md cursor-pointer"
            style={{
              left: `${((value - min) / (max - min)) * 100}%`,
              transform: 'translateX(-50%)'
            }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

/**
 * High contrast mode toggle
 */
export const HighContrastToggle: React.FC<{
  isHighContrast: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ isHighContrast, onToggle, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm">High Contrast</span>
      <button
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isHighContrast ? 'bg-primary' : 'bg-gray-200'
        )}
        onClick={onToggle}
        aria-pressed={isHighContrast}
        aria-label="Toggle high contrast mode"
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isHighContrast ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
};

/**
 * Font size controls
 */
export const FontSizeControls: React.FC<{
  fontSize: 'small' | 'medium' | 'large';
  onChange: (size: 'small' | 'medium' | 'large') => void;
  className?: string;
}> = ({ fontSize, onChange, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm">Font Size</span>
      <div className="flex space-x-1">
        {(['small', 'medium', 'large'] as const).map((size) => (
          <button
            key={size}
            className={cn(
              'px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              fontSize === size
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-200 text-gray-700'
            )}
            onClick={() => onChange(size)}
            aria-pressed={fontSize === size}
            aria-label={`Set font size to ${size}`}
          >
            {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Accessibility settings panel
 */
export const AccessibilitySettings: React.FC<{
  isHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  onHighContrastToggle: () => void;
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  className?: string;
}> = ({ 
  isHighContrast, 
  fontSize, 
  onHighContrastToggle, 
  onFontSizeChange, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={cn('relative', className)}>
      <button
        className="p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="accessibility-settings"
        aria-label="Accessibility settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4 4m0-4v6m0 6a2 2 0 100-4-4m6 6V10m0-2a2 2 0 100-4 4m0-4v6m0 6a2 2 0 100-4-4" />
        </svg>
      </button>
      
      {isOpen && (
        <div
          id="accessibility-settings"
          className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-md shadow-lg p-4 z-50"
        >
          <h3 className="text-lg font-medium mb-4">Accessibility Settings</h3>
          
          <div className="space-y-4">
            <HighContrastToggle
              isHighContrast={isHighContrast}
              onToggle={onHighContrastToggle}
            />
            
            <FontSizeControls
              fontSize={fontSize}
              onChange={onFontSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main accessibility wrapper component
 */
export const AccessibilityWrapper: React.FC<{
  children: React.ReactNode;
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ children, highContrast = false, fontSize = 'medium', className }) => {
  const fontSizeClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base';
  
  return (
    <div
      className={cn(
        highContrast && 'high-contrast',
        fontSizeClass,
        className
      )}
    >
      {/* Skip to main content link */}
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      
      {/* Main content */}
      <main id="main-content">
        {children}
      </main>
      
      {/* Screen reader announcer */}
      <Announcer message="" politeness="polite" />
    </div>
  );
};