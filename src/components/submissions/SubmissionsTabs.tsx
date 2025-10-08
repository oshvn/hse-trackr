import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTable } from './CategoryTable';
import { SummaryHeader } from './SummaryHeader';
import { CategoryProgress } from './CategoryProgress';
import { NewSubmissionDialog } from './NewSubmissionDialog';
import { SubmissionHistorySheet } from './SubmissionHistorySheet';
import { MAJOR_CATEGORIES } from '@/lib/checklistData';
import type { ContractorRequirement, DocProgress, Submission } from '@/pages/my-submissions';

interface SubmissionsTabsProps {
  categories: string[];
  requirements: ContractorRequirement[];
  docProgress: DocProgress[];
  submissions: Submission[];
  onNewSubmission: (docTypeId: string, documentLink: string, note: string, checklist: string[]) => Promise<void>;
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
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string | null>(null);
  const [showNewSubmission, setShowNewSubmission] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getTabData = (category: string | null) => {
    if (!category) {
      // All tab - return all data
      return {
        requirements,
        docProgress
      };
    }

    // Filter by major category (e.g., "1.1" matches "1.1", "1.1.1", "1.1.2", etc.)
    const filteredRequirements = requirements.filter(req => {
      const reqCategory = req.doc_type.category;
      const reqCode = req.doc_type.code;
      // Check if category matches either the category field or the code field
      return reqCategory === category ||
             reqCategory?.startsWith(category + '.') ||
             reqCode === category ||
             reqCode?.startsWith(category + '.');
    });
    const filteredProgress = docProgress.filter(prog => {
      const progCategory = prog.category;
      return progCategory === category || progCategory?.startsWith(category + '.');
    });
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('SubmissionsTabs Debug:', {
        category,
        totalRequirements: requirements.length,
        filteredRequirements: filteredRequirements.length,
        reqCodes: requirements.map(req => ({
          name: req.doc_type.name,
          category: req.doc_type.category,
          code: req.doc_type.code
        }))
      });
    }
    
    return {
      requirements: filteredRequirements,
      docProgress: filteredProgress
    };
  };

  const handleRowClick = (docTypeId: string) => {
    setSelectedDocTypeId(docTypeId);
    setShowHistory(true);
  };

  const handleNewSubmissionClick = () => {
    setShowNewSubmission(true);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${MAJOR_CATEGORIES.length + 1}, minmax(0, 1fr))`}}>
          <TabsTrigger value="all">All</TabsTrigger>
          {MAJOR_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <SummaryHeader
            docProgress={docProgress}
            category={null}
          />
          
          <CategoryProgress
            categories={MAJOR_CATEGORIES.map(c => c.value)}
            docProgress={docProgress}
          />

          <CategoryTable
            {...getTabData(null)}
            submissions={submissions}
            onRowClick={handleRowClick}
            onNewSubmission={handleNewSubmissionClick}
            showCriticalFirst={true}
          />
        </TabsContent>

        {MAJOR_CATEGORIES.map(cat => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-6">
            <SummaryHeader
              docProgress={docProgress}
              category={cat.value}
            />

            <CategoryTable
              {...getTabData(cat.value)}
              submissions={submissions}
              onRowClick={handleRowClick}
              onNewSubmission={handleNewSubmissionClick}
              showCriticalFirst={true}
            />
          </TabsContent>
        ))}
      </Tabs>

      <NewSubmissionDialog
        open={showNewSubmission}
        onClose={() => setShowNewSubmission(false)}
        onSubmit={onNewSubmission}
        requirements={getTabData(activeTab === 'all' ? null : activeTab).requirements}
        category={activeTab === 'all' ? null : activeTab}
      />

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