import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FilterBarProps {
  contractors: Array<{ id: string; name: string }>;
  categories: string[];
  contractorFilter: string;
  categoryFilter: string;
  searchTerm: string;
  onContractorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  contractors,
  categories,
  contractorFilter,
  categoryFilter,
  searchTerm,
  onContractorChange,
  onCategoryChange,
  onSearchChange
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

        <div className="flex-1 min-w-[220px] space-y-2">
          <Label htmlFor="search-filter">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-filter"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search document name or code..."
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};