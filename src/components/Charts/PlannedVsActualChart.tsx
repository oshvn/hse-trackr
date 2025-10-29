import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, eachDayOfInterval, min, max } from 'date-fns';

interface PlannedVsActualProps {
  contractorId: string;
  contractorName: string;
  requirements: Array<{
    doc_type_id: string;
    required_count: number;
    planned_due_date: string | null;
  }>;
  submissions: Array<{
    doc_type_id: string;
    approved_at: string | null;
    cnt: number;
  }>;
}

interface ChartDataPoint {
  date: string;
  planned: number;
  actual: number;
  dateDisplay: string;
}

export const PlannedVsActual: React.FC<PlannedVsActualProps> = ({
  contractorId,
  contractorName,
  requirements,
  submissions
}) => {
  const chartData = useMemo(() => {
    if (!requirements.length && !submissions.length) return [];

    // Get date range
    const plannedDates = requirements
      .filter(req => req.planned_due_date)
      .map(req => parseISO(req.planned_due_date!));
    
    const approvalDates = submissions
      .filter(sub => sub.approved_at)
      .map(sub => parseISO(sub.approved_at!));

    const allDates = [...plannedDates, ...approvalDates];
    if (allDates.length === 0) return [];

    const startDate = min(allDates);
    const endDate = max([...allDates, new Date()]);
    
    // Generate all dates in range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Calculate cumulative data for each date
    const dataPoints: ChartDataPoint[] = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Calculate planned cumulative (sum of required_count for items due by this date)
      const plannedCumulative = requirements
        .filter(req => req.planned_due_date && req.planned_due_date <= dateStr)
        .reduce((sum, req) => sum + req.required_count, 0);

      // Calculate actual cumulative (sum of approvals by this date)
      const actualCumulative = submissions
        .filter(sub => sub.approved_at && sub.approved_at <= dateStr + 'T23:59:59')
        .reduce((sum, sub) => sum + sub.cnt, 0);

      return {
        date: dateStr,
        planned: plannedCumulative,
        actual: actualCumulative,
        dateDisplay: format(date, 'MMM dd')
      };
    });

    // Filter out points where both values are 0 at the beginning
    const firstNonZeroIndex = dataPoints.findIndex(point => point.planned > 0 || point.actual > 0);
    return firstNonZeroIndex >= 0 ? dataPoints.slice(firstNonZeroIndex) : [];
  }, [requirements, submissions]);

  if (contractorId === 'all') {
    return (
      <Card className="p-6 h-80">
        <h3 className="text-lg font-semibold mb-4">Planned vs Actual</h3>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select one contractor to view Planned vs Actual timeline
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6 h-80">
        <h3 className="text-lg font-semibold mb-4">Planned vs Actual - {contractorName}</h3>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No timeline data available for this contractor
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col gap-4 h-full min-h-[400px]">
      <h3 className="text-lg font-semibold">Planned vs Actual - {contractorName}</h3>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="dateDisplay"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Documents', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-md">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {entry.value}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="planned"
              stroke="#8884d8"
              strokeWidth={2}
              name="Planned"
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Actual"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};