import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  contractors: Array<{ id: string; name: string }>;
  categories: string[];
  contractorFilter: string;
  categoryFilter: string;
  onContractorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  contractors,
  categories,
  contractorFilter,
  categoryFilter,
  onContractorChange,
  onCategoryChange
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractor-filter">Contractor</Label>
          <Select value={contractorFilter} onValueChange={onContractorChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select contractor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contractors</SelectItem>
              {contractors.map(contractor => (
                <SelectItem key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};