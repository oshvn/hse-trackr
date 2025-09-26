import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({ title, value, subtitle, trend }: KpiCardProps) {
  const trendColor = trend === "up" ? "text-green-600" : 
                    trend === "down" ? "text-red-600" : 
                    "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={`text-xs ${trendColor}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}