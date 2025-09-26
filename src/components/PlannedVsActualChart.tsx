import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DocProgressRow {
  contractor_id: string;
  contractor_name: string;
  planned_due_date: string | null;
  first_approved_at: string | null;
  required_count: number;
  approved_count: number;
}

interface PlannedVsActualChartProps {
  data: DocProgressRow[];
  selectedContractor: string;
}

export function PlannedVsActualChart({ data, selectedContractor }: PlannedVsActualChartProps) {
  const chartData = useMemo(() => {
    if (selectedContractor === "all") return [];

    const contractorData = data.filter(row => row.contractor_id === selectedContractor);
    
    // Get all dates (planned and actual)
    const dates = new Set<string>();
    
    contractorData.forEach(row => {
      if (row.planned_due_date) {
        dates.add(row.planned_due_date);
      }
      if (row.first_approved_at) {
        dates.add(row.first_approved_at.split('T')[0]);
      }
    });

    const sortedDates = Array.from(dates).sort();
    
    return sortedDates.map(date => {
      const plannedCumulative = contractorData
        .filter(row => row.planned_due_date && row.planned_due_date <= date)
        .reduce((sum, row) => sum + row.required_count, 0);
        
      const actualCumulative = contractorData
        .filter(row => row.first_approved_at && row.first_approved_at.split('T')[0] <= date)
        .reduce((sum, row) => sum + row.approved_count, 0);

      return {
        date: new Date(date).toLocaleDateString('vi-VN'),
        planned: plannedCumulative,
        actual: actualCumulative,
      };
    });
  }, [data, selectedContractor]);

  const contractorName = selectedContractor === "all" 
    ? "All Contractors" 
    : data.find(row => row.contractor_id === selectedContractor)?.contractor_name || "";

  return (
    <Card className="h-[360px]">
      <CardHeader>
        <CardTitle>Planned vs Actual Progress - {contractorName}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        {selectedContractor === "all" ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a specific contractor to view progress chart
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="planned" 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                name="Planned Cumulative"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--destructive))" 
                name="Actual Cumulative"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}