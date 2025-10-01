import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  role: string | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ role }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateDisplay = format(now, 'EEEE, MMMM d, yyyy');
  const timeDisplay = format(now, 'HH:mm:ss');

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">HSE Document Register</h1>
        <p className="text-muted-foreground">
          Track contractor compliance and document status
          {role === 'guest' ? ' (guest mode)' : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          <span>{timeDisplay}</span>
        </div>
        <div className="text-sm text-muted-foreground leading-tight">
          {dateDisplay}
        </div>
      </div>
    </div>
  );
};
