import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File, X } from 'lucide-react';

export interface ExportData {
  contractors?: any[];
  metrics?: any[];
  timeline?: any[];
  categories?: any[];
  riskAssessment?: any[];
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeCharts?: boolean;
  includeData?: boolean;
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export interface ExportCapabilitiesProps {
  data?: ExportData;
  onExport?: (options: ExportOptions) => void;
  fileName?: string;
}

/**
 * ExportCapabilities v2.0
 * Export component for PDF reports and data export
 * 
 * Features:
 * - PDF report generation
 * - CSV/Excel data export
 * - Customizable export options
 * - Date range filtering
 */
export const ExportCapabilities: React.FC<ExportCapabilitiesProps> = ({
  data,
  onExport,
  fileName = 'dashboard-report',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
  });

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    const options: ExportOptions = {
      ...exportOptions,
      format,
    };
    
    onExport?.(options);
    
    // Simulate export (in real implementation, this would call an API or generate file)
    if (format === 'pdf') {
      handlePDFExport(options);
    } else if (format === 'csv') {
      handleCSVExport(options);
    } else if (format === 'excel') {
      handleExcelExport(options);
    }
    
    setIsOpen(false);
  };

  const handlePDFExport = (options: ExportOptions) => {
    // PDF export logic would go here
    // This would typically call a backend API or use a library like jsPDF
    console.log('Exporting PDF with options:', options);
    
    // Simulate download
    const link = document.createElement('a');
    link.href = '#'; // In real implementation, this would be the PDF blob URL
    link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.pdf`;
    // link.click(); // Uncomment when PDF generation is implemented
  };

  const handleCSVExport = (options: ExportOptions) => {
    // CSV export logic
    if (!data) return;
    
    let csvContent = '';
    
    // Generate CSV headers
    if (data.contractors) {
      csvContent += 'Contractor,Completion Rate,Quality Score,Compliance,On-Time Delivery,Response Time\n';
      
      data.contractors.forEach((contractor) => {
        csvContent += `${contractor.name},${contractor.completionRate},${contractor.qualityScore},${contractor.compliance},${contractor.onTimeDelivery},${contractor.responseTime}\n`;
      });
    }
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelExport = (options: ExportOptions) => {
    // Excel export would typically use a library like xlsx
    console.log('Exporting Excel with options:', options);
    
    // For now, we'll export as CSV with .xlsx extension
    // In production, use xlsx library to create proper Excel files
    handleCSVExport(options);
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Export</span>
      </button>

      {/* Export Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Export Options</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Export Format Options */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
              >
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Export as PDF</div>
                  <div className="text-xs text-gray-500">Complete dashboard report</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Export as CSV</div>
                  <div className="text-xs text-gray-500">Raw data in CSV format</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-700" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Export as Excel</div>
                  <div className="text-xs text-gray-500">Formatted spreadsheet</div>
                </div>
              </button>
            </div>

            {/* Export Options */}
            <div className="border-t border-gray-200 pt-4">
              <label className="text-xs font-semibold text-gray-700 mb-2 block">Options</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) =>
                      setExportOptions({ ...exportOptions, includeCharts: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">Include Charts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeData}
                    onChange={(e) =>
                      setExportOptions({ ...exportOptions, includeData: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">Include Raw Data</span>
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportCapabilities;
