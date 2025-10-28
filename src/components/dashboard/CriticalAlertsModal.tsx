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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, Search, Filter, ArrowUpDown, Eye, X, XCircle, AlertCircle, Calendar, TrendingUp, Mail, Users, UserCheck, AlertTriangle as AlertIcon, PauseCircle, Users2 } from 'lucide-react';
import type { RedCardItem, DocProgressData } from '@/lib/dashboardHelpers';
import { RED_CARD_LEVELS } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DetailSidePanel } from './DetailSidePanel';
import './redCardsAnimations.css';

interface CriticalAlertsModalProps {
  open: boolean;
  onClose: () => void;
  redCards: {
    level1: RedCardItem[];
    level2: RedCardItem[];
    level3: RedCardItem[];
    all: RedCardItem[];
  };
  docProgressData: DocProgressData[];
  onSelect: (contractorId: string, docTypeId: string) => void;
}

type SortField = 'docTypeName' | 'contractorName' | 'overdueDays' | 'dueInDays' | 'plannedDueDate' | 'warningLevel' | 'riskScore';
type SortDirection = 'asc' | 'desc';

// Action icon mapping
const ActionIcons = {
  'Gửi email nhắc nhở': Mail,
  'Lên lịch họp review': Users,
  'Cung cấp hỗ trợ kỹ thuật': UserCheck,
  'Họp hàng ngày': Users,
  'Escalation cho quản lý': AlertIcon,
  'Gán mentor hỗ trợ': UserCheck,
  'NGƯNG thi công': PauseCircle,
  'Họp với ban lãnh đạo': Users2,
  'Xem xét thay thế nhà thầu': XCircle,
};

export const CriticalAlertsModal: React.FC<CriticalAlertsModalProps> = ({
  open,
  onClose,
  redCards,
  docProgressData,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('warningLevel');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDetail, setSelectedDetail] = useState<{ contractorId: string; docTypeId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'level1' | 'level2' | 'level3'>('all');

  const { level1, level2, level3, all } = redCards;

  // Get items based on active tab
  const getItemsByTab = (tab: typeof activeTab) => {
    switch (tab) {
      case 'level1': return level1;
      case 'level2': return level2;
      case 'level3': return level3;
      default: return all;
    }
  };

  const currentItems = useMemo(() => getItemsByTab(activeTab), [activeTab, level1, level2, level3, all]);

  const contractors = useMemo(() => {
    const uniqueContractors = new Set(all.map(item => item.contractorId));
    return Array.from(uniqueContractors).map(id => {
      const item = all.find(i => i.contractorId === id);
      return { id, name: item?.contractorName || '' };
    });
  }, [all]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = currentItems;

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
      if (statusFilter === 'level1') {
        filtered = filtered.filter(item => item.warningLevel === 1);
      } else if (statusFilter === 'level2') {
        filtered = filtered.filter(item => item.warningLevel === 2);
      } else if (statusFilter === 'level3') {
        filtered = filtered.filter(item => item.warningLevel === 3);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'warningLevel':
          aValue = a.warningLevel;
          bValue = b.warningLevel;
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'docTypeName':
          aValue = a.docTypeName.toLowerCase();
          bValue = b.docTypeName.toLowerCase();
          break;
        case 'contractorName':
          aValue = a.contractorName.toLowerCase();
          bValue = b.contractorName.toLowerCase();
          break;
        case 'overdueDays':
          aValue = a.daysOverdue;
          bValue = b.daysOverdue;
          break;
        case 'dueInDays':
          aValue = a.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
          bValue = b.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
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
  }, [currentItems, searchTerm, contractorFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (item: RedCardItem) => {
    const levelConfig = RED_CARD_LEVELS[item.warningLevel];
    return (
      <Badge
        variant="outline"
        className={cn('text-xs', levelConfig.borderColor, levelConfig.textColor, levelConfig.bgColor)}
      >
        {levelConfig.name}
      </Badge>
    );
  };

  const getOverdueText = (item: RedCardItem) => {
    if (item.daysOverdue > 0) {
      return <span className="text-red-600 font-medium">Quá hạn {item.daysOverdue} ngày</span>;
    } else if (item.daysUntilDue !== null) {
      if (item.daysUntilDue === 0) {
        return <span className="text-amber-600 font-medium">Hết hạn hôm nay</span>;
      } else {
        return <span className="text-amber-600 font-medium">Còn {item.daysUntilDue} ngày</span>;
      }
    }
    return <span className="text-muted-foreground">Không có hạn</span>;
  };

  const getActionButtons = (item: RedCardItem) => {
    return item.actionButtons.map((button, index) => {
      const IconComponent = ActionIcons[button.label as keyof typeof ActionIcons];
      return (
        <Button
          key={index}
          variant={button.severity === 'destructive' ? 'destructive' : button.severity === 'secondary' ? 'secondary' : 'default'}
          size="sm"
          className={cn('text-xs h-7', `action-button-${button.severity}`)}
          onClick={(e) => {
            e.stopPropagation();
            // Handle action execution here
            console.log(`Executing action: ${button.action} for item:`, item);
          }}
        >
          {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
          {button.label}
        </Button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full sm:max-h-[90vh] sm:p-6 flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Red Cards - {all.length} items
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          {/* Warning Level Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <span>Tất cả</span>
                <Badge variant="outline" className="ml-1">{all.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="level3" className={cn('flex items-center gap-2', level3.length > 0 && 'tab-level-3')}>
                <div className={level3.length > 0 ? 'status-indicator-level-3' : ''}></div>
                <span>Quá hạn</span>
                <Badge variant="destructive" className="ml-1">{level3.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="level2" className={cn('flex items-center gap-2', level2.length > 0 && 'tab-level-2')}>
                <div className={level2.length > 0 ? 'status-indicator-level-2' : ''}></div>
                <span>Khẩn</span>
                <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-800 border-orange-200">{level2.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="level1" className={cn('flex items-center gap-2', level1.length > 0 && 'tab-level-1')}>
                <div className={level1.length > 0 ? 'status-indicator-level-1' : ''}></div>
                <span>Sớm</span>
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 border-amber-200">{level1.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 flex flex-col gap-4 mt-4">
              {/* Filters */}
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm tài liệu hoặc nhà thầu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Contractor Filter */}
                  <Select value={contractorFilter} onValueChange={setContractorFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Lọc theo nhà thầu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nhà thầu</SelectItem>
                      {contractors.map((contractor: any) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="level1">Cảnh báo sớm</SelectItem>
                      <SelectItem value="level2">Cảnh báo khẩn</SelectItem>
                      <SelectItem value="level3">Quá hạn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Table */}
              <div className="flex-1 overflow-hidden rounded-lg border">
                <ScrollArea className="h-full">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('warningLevel')}
                            className="p-0 h-auto font-semibold"
                          >
                            Mức độ
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('docTypeName')}
                            className="p-0 h-auto font-semibold"
                          >
                            Tài liệu
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
                            Nhà thầu
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('riskScore')}
                            className="p-0 h-auto font-semibold"
                          >
                            Điểm rủi ro
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('plannedDueDate')}
                            className="p-0 h-auto font-semibold"
                          >
                            Hạn chót
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
                            Thời gian
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Tiến độ</TableHead>
                        <TableHead>Hành động</TableHead>
                        <TableHead className="text-right">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Không có red cards nào khớp với bộ lọc của bạn.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedItems.map((item) => {
                          const levelConfig = RED_CARD_LEVELS[item.warningLevel];
                          return (
                            <TableRow key={`${item.contractorId}-${item.docTypeId}`} className={cn('hover:bg-muted/50 red-card-entry', `red-card-level-${item.warningLevel}`)}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={cn(`status-indicator-level-${item.warningLevel}`)}></div>
                                  <Badge
                                    variant="outline"
                                    className={cn('text-xs', levelConfig.borderColor, levelConfig.textColor, levelConfig.bgColor)}
                                  >
                                    {levelConfig.name}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{item.docTypeName}</TableCell>
                              <TableCell>{item.contractorName}</TableCell>
                              <TableCell>
                                <div className={cn(
                                  'flex items-center gap-2 px-2 py-1 rounded-full text-xs',
                                  item.riskScore > 70 ? 'risk-score-high' :
                                  item.riskScore > 40 ? 'risk-score-medium' : 'risk-score-low'
                                )}>
                                  <TrendingUp className="h-3 w-3" />
                                  <span className="font-medium">
                                    {item.riskScore}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.plannedDueDate ? (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{format(new Date(item.plannedDueDate), 'dd/MM/yyyy')}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Chưa đặt</span>
                                )}
                              </TableCell>
                              <TableCell>{getOverdueText(item)}</TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <Progress value={item.progressPercentage} className={cn('w-16 h-2', `progress-bar-level-${item.warningLevel}`)} />
                                    </div>
                                    <span className="text-xs font-medium">{item.progressPercentage}%</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.approvedCount}/{item.requiredCount} đã duyệt
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {getActionButtons(item)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDetail({ contractorId: item.contractorId, docTypeId: item.docTypeId });
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Summary */}
              <Card className="p-4">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    Hiển thị {filteredAndSortedItems.length} của {getItemsByTab(activeTab).length} items
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Quá hạn: {level3.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Khẩn: {level2.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span>Sớm: {level1.length}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      {/* Detail Side Panel */}
      <DetailSidePanel
        open={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        contractorId={selectedDetail?.contractorId || null}
        docTypeId={selectedDetail?.docTypeId || null}
        docProgressData={docProgressData}
      />
    </Dialog>
  );
};
