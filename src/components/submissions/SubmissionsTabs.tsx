import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTable } from './CategoryTable';
import { SummaryHeader } from './SummaryHeader';
import { CategoryProgress } from './CategoryProgress';
import { NewSubmissionDialog } from './NewSubmissionDialog';
import { SubmissionHistorySheet } from './SubmissionHistorySheet';
import type { ContractorRequirement, DocProgress, Submission } from '@/pages/my-submissions';

interface SubmissionsTabsProps {
  categories: string[];
  requirements: ContractorRequirement[];
  docProgress: DocProgress[];
  submissions: Submission[];
  onNewSubmission: (docTypeId: string, file: File) => Promise<void>;
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

    // Filter by category
    const filteredRequirements = requirements.filter(req => req.doc_type.category === category);
    const filteredProgress = docProgress.filter(prog => prog.category === category);
    
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
        <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${categories.length + 1}, minmax(0, 1fr))`}}>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <SummaryHeader
            docProgress={docProgress}
            category={null}
          />
          
          <CategoryProgress
            categories={categories}
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

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            <SummaryHeader
              docProgress={docProgress}
              category={category}
            />

            <CategoryTable
              {...getTabData(category)}
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