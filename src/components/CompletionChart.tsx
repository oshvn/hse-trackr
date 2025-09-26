import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ContractorKpi {
  contractor_id: string;
  contractor_name: string;
  completion_ratio: number;
  must_have_ready_ratio: number;
  avg_prep_days: number;
  avg_approval_days: number;
  red_items: number;
}

interface CompletionChartProps {
  data: ContractorKpi[];
}

export function CompletionChart({ data }: CompletionChartProps) {
  const chartData = data.map(item => ({
    name: item.contractor_name,
    completion: Math.round((item.completion_ratio || 0) * 100),
    mustHave: Math.round((item.must_have_ready_ratio || 0) * 100),
  }));

  return (
    <Card className="h-[360px]">
      <CardHeader>
        <CardTitle>Completion % by Contractor</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, '']}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="completion" fill="hsl(var(--primary))" name="Overall Completion" />
            <Bar dataKey="mustHave" fill="hsl(var(--destructive))" name="Must-Have Ready" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}