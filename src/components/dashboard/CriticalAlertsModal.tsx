import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock, Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import type { CriticalAlertItem } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CriticalAlertsModalProps {
  open: boolean;
  onClose: () => void;
  redItems: CriticalAlertItem[];
  amberItems: CriticalAlertItem[];
  onSelect: (contractorId: string, docTypeId: string) => void;
}

type SortField = 'docTypeName' | 'contractorName' | 'overdueDays' | 'dueInDays' | 'plannedDueDate';
type SortDirection = 'asc' | 'desc';

export const CriticalAlertsModal: React.FC<CriticalAlertsModalProps> = ({
  open,
  onClose,
  redItems,
  amberItems,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('overdueDays');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const allItems = useMemo(() => [...redItems, ...amberItems], [redItems, amberItems]);

  const contractors = useMemo(() => {
    const uniqueContractors = new Set(allItems.map(item => item.contractorId));
    return Array.from(uniqueContractors).map(id => {
      const item = allItems.find(i => i.contractorId === id);
      return { id, name: item?.contractorName || '' };
    });
  }, [allItems]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = allItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.docTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contractorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply contractor filter
    if (contractorFilter !== 'all') {
      filtered = filtered.filter(item => item.contractorId === contractorFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'red') {
        filtered = filtered.filter(item => item.overdueDays > 0);
      } else if (statusFilter === 'amber') {
        filtered = filtered.filter(item => item.overdueDays === 0 && item.dueInDays !== null);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'docTypeName':
          aValue = a.docTypeName.toLowerCase();
          bValue = b.docTypeName.toLowerCase();
          break;
        case 'contractorName':
          aValue = a.contractorName.toLowerCase();
          bValue = b.contractorName.toLowerCase();
          break;
        case 'overdueDays':
          aValue = a.overdueDays;
          bValue = b.overdueDays;
          break;
        case 'dueInDays':
          aValue = a.dueInDays ?? Number.MAX_SAFE_INTEGER;
          bValue = b.dueInDays ?? Number.MAX_SAFE_INTEGER;
          break;
        case 'plannedDueDate':
          aValue = a.plannedDueDate ? new Date(a.plannedDueDate).getTime() : 0;
          bValue = b.plannedDueDate ? new Date(b.plannedDueDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allItems, searchTerm, contractorFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (item: CriticalAlertItem) => {
    if (item.overdueDays > 0) {
      return <Badge variant="destructive" className="text-xs">Red</Badge>;
    } else if (item.dueInDays !== null) {
      return <Badge variant="secondary" className="text-xs border-amber-500 text-amber-700 bg-amber-50">Amber</Badge>;
    }
    return null;
  };

  const getOverdueText = (item: CriticalAlertItem) => {
    if (item.overdueDays > 0) {
      return <span className="text-red-600">Overdue {item.overdueDays} day{item.overdueDays !== 1 ? 's' : ''}</span>;
    } else if (item.dueInDays !== null) {
      if (item.dueInDays === 0) {
        return <span className="text-amber-600">Due today</span>;
      } else {
        return <span className="text-amber-600">Due in {item.dueInDays} day{item.dueInDays !== 1 ? 's' : ''}</span>;
      }
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Alerts - {allItems.length} items
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents or contractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Contractor Filter */}
              <Select value={contractorFilter} onValueChange={setContractorFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by contractor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contractors</SelectItem>
                  {contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('docTypeName')}
                      className="p-0 h-auto font-semibold"
                    >
                      Document
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('contractorName')}
                      className="p-0 h-auto font-semibold"
                    >
                      Contractor
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('plannedDueDate')}
                      className="p-0 h-auto font-semibold"
                    >
                      Due Date
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('overdueDays')}
                      className="p-0 h-auto font-semibold"
                    >
                      Overdue/Due
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No critical alerts match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <TableRow key={`${item.contractorId}-${item.docTypeId}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.docTypeName}</TableCell>
                      <TableCell>{item.contractorName}</TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell>
                        {item.plannedDueDate ? (
                          format(new Date(item.plannedDueDate), 'MMM dd, yyyy')
                        ) : (
                          'Not set'
                        )}
                      </TableCell>
                      <TableCell>{getOverdueText(item)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full',
                                item.approvedCount >= item.requiredCount
                                  ? 'bg-green-500'
                                  : item.overdueDays > 0
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                              )}
                              style={{
                                width: `${Math.min(100, (item.approvedCount / item.requiredCount) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.approvedCount}/{item.requiredCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onSelect(item.contractorId, item.docTypeId);
                            onClose();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <Card className="p-4">
            <div className="flex justify-between items-center text-sm">
              <div>
                Showing {filteredAndSortedItems.length} of {allItems.length} items
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Red: {redItems.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>Amber: {amberItems.length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};