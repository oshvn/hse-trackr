import React, { useState } from 'react';
import { CategoryTable } from './CategoryTable';
import { SummaryHeader } from './SummaryHeader';
import { CategoryProgress } from './CategoryProgress';
import { SubmissionHistorySheet } from './SubmissionHistorySheet';
import { MAJOR_CATEGORIES } from '@/lib/checklistData';
import type { ContractorRequirement, DocProgress, Submission } from '@/pages/my-submissions';

interface SubmissionsTabsProps {
  categories: string[];
  requirements: ContractorRequirement[];
  docProgress: DocProgress[];
  submissions: Submission[];
  onNewSubmission: () => void;
  onRefresh: () => void;
}

export const SubmissionsTabs: React.FC<SubmissionsTabsProps> = ({
  categories,
  requirements,
  docProgress,
  submissions,
  onNewSubmission,
  onRefresh
}) => {
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleRowClick = (docTypeId: string) => {
    setSelectedDocTypeId(docTypeId);
    setShowHistory(true);
  };

  return (
    <>
      <div className="space-y-6">
        <SummaryHeader
          docProgress={docProgress}
          category={null}
        />
        
        <CategoryProgress
          categories={MAJOR_CATEGORIES.map(c => c.value)}
          docProgress={docProgress}
        />

        <CategoryTable
          requirements={requirements}
          docProgress={docProgress}
          submissions={submissions}
          onRowClick={handleRowClick}
          onNewSubmission={onNewSubmission}
          showCriticalFirst={true}
        />
      </div>

      <SubmissionHistorySheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        docTypeId={selectedDocTypeId}
        submissions={submissions}
        docProgress={docProgress}
        onRefresh={onRefresh}
      />
    </>
  );
};